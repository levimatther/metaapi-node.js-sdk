'use strict';

import should from 'should';
import sinon from 'sinon';
import Server from 'socket.io';
import MetaApi from '../metaApi/metaApi';

const accountInformation = {
  broker: 'True ECN Trading Ltd',
  currency: 'USD',
  server: 'ICMarketsSC-Demo',
  balance: 7319.9,
  equity: 7306.649913200001,
  margin: 184.1,
  freeMargin: 7120.22,
  leverage: 100,
  marginLevel: 3967.58283542
};
const errors = [
  {
    'id': 1,
    'error': 'TooManyRequestsError',
    'message': 'One user can connect to one server no more than 300 accounts. Current number of connected ' +
               'accounts 300. For more information see https://metaapi.cloud/docs/client/rateLimiting/',
    'metadata': {
      'maxAccountsPerUserPerServer': 300,
      'accountsCount':  300,
      'recommendedRetryTime': new Date(Date.now() + 20000),
      'type': 'LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_USER_PER_SERVER'
    }
  },
  {
    'id': 1,
    'error': 'TooManyRequestsError',
    'message': 'You have used all your account subscriptions quota. You have 50 account subscriptions available ' +
               'and have used 50 subscriptions. Please deploy more accounts to get more subscriptions. For more ' +
               'information see https://metaapi.cloud/docs/client/rateLimiting/',
    'metadata': {
      'maxAccountsPerUser':  50,
      'accountsCount': 50,
      'recommendedRetryTime': new Date(Date.now() + 20000),
      'type': 'LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_USER'
    }
  },
  {
    'id': 1,
    'error': 'TooManyRequestsError',
    'message': 'You can not subscribe to more accounts on this connection because server is out of capacity. ' +
               'Please establish a new connection with a different client-id header value to switch to a ' +
               'different server. For more information see https://metaapi.cloud/docs/client/rateLimiting/',
    'metadata': {
      'changeClientIdHeader': true,
      'recommendedRetryTime': new Date(Date.now() + 20000),
      'type': 'LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_SERVER'
    }
  }
];

let server;

class FakeServer {
  constructor(){
    this.io;
    this.socket;
    this.statusTask;
  }

  async authenticate(socket, data){
    socket.emit('synchronization', {type: 'authenticated', accountId: data.accountId,
      instanceIndex: 0, replicas: 1, host: 'ps-mpa-0'});
  }

  async emitStatus(socket, accountId){
    const packet = {connected: true, authenticated: true, instanceIndex: 0, type: 'status',
      healthStatus: {rpcApiHealthy: true}, replicas: 1, host: 'ps-mpa-0',
      connectionId: accountId, accountId: accountId};
    socket.emit('synchronization', packet);
  }

  async respondAccountInformation(socket, data){
    await socket.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, 
      accountInformation});
  }

  async syncAccount(socket, data){
    socket.emit('synchronization', {type: 'synchronizationStarted', accountId: data.accountId, instanceIndex: 0, 
      synchronizationId: data.requestId, host: 'ps-mpa-0'});
    await new Promise(res => setTimeout(res, 50));
    socket.emit('synchronization', {type: 'accountInformation', accountId: data.accountId, accountInformation,
      instanceIndex: 0, host: 'ps-mpa-0'});
    await new Promise(res => setTimeout(res, 50));
    socket.emit('synchronization',
      {type: 'specifications', accountId: data.accountId, specifications: [], instanceIndex: 0, host: 'ps-mpa-0'});
    await new Promise(res => setTimeout(res, 50));
    socket.emit('synchronization', {type: 'orderSynchronizationFinished', accountId: data.accountId,
      synchronizationId: data.requestId, instanceIndex: 0, host: 'ps-mpa-0'});
    await new Promise(res => setTimeout(res, 50));
    socket.emit('synchronization', {type: 'dealSynchronizationFinished', accountId: data.accountId,
      synchronizationId: data.requestId, instanceIndex: 0, host: 'ps-mpa-0'});
  }

  async respond(socket, data){
    await socket.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
  }

  async emitError(socket, data, errorIndex, retryAfterSeconds) {
    const error = errors[errorIndex];
    error.metadata.recommendedRetryTime = new Date(Date.now() + retryAfterSeconds * 1000);
    error.requestId = data.requestId;
    await socket.emit('processingError', error);
  }

  enableSync(socket){
    socket.removeAllListeners('request');
    socket.on('request', async data => {
      if(data.type === 'subscribe') {
        await new Promise(res => setTimeout(res, 200)); 
        await this.respond(socket, data);
        this.statusTask = setInterval(() => this.emitStatus(socket, data.accountId), 100);
        await new Promise(res => setTimeout(res, 50)); 
        await this.authenticate(socket, data);
      } else if (data.type === 'synchronize') {
        await this.respond(socket, data);
        await new Promise(res => setTimeout(res, 50)); 
        await this.syncAccount(socket, data);
      } else if (data.type === 'waitSynchronized' || data.type === 'unsubscribe') {
        await this.respond(socket, data);
      } else if (data.type === 'getAccountInformation') {
        await this.respondAccountInformation(socket, data);
      }
    });
  }

  disableSync(){
    server.removeAllListeners('request');
    server.on('request', async data => {
      await this.respond(server, data);
    });
  }

  async start(port = 6785){
    this.io = new Server(port, {path: '/ws', pingTimeout: 1000000});
    this.io.on('connect', socket => {
      server = socket;
      socket.emit('response', {type: 'response'});
      this.enableSync(socket);
    });
  }

}

describe('Synchronization stability test', () => {

  let fakeServer;
  let connection;
  let clock;
  let sandbox;
  let api;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(async () => {
    clock = sinon.useFakeTimers({shouldAdvanceTime: true});
    api = new MetaApi('token', {application: 'application', domain: 'project-stock.agiliumlabs.cloud',
      requestTimeout: 3, retryOpts: {retries: 3, minDelayInSeconds: 0.1, maxDelayInSeconds: 0.5, 
        subscribeCooldownInSeconds: 6}});
    api.metatraderAccountApi._metatraderAccountClient.getAccount = (accountId) => ({
      _id:  accountId,
      login: '50194988',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      application: 'MetaApi',
      connectionStatus: 'DISCONNECTED',
      state: 'DEPLOYED',
      type: 'cloud',
      accessToken: '2RUnoH1ldGbnEneCoqRTgI4QO1XOmVzbH5EVoQsA'
    });
    api._metaApiWebsocketClient.url = 'http://localhost:6785';
    fakeServer = new FakeServer();
    await fakeServer.start();
  });

  afterEach(async () => {
    clearInterval(fakeServer.statusTask);
    connection._websocketClient._subscriptionManager.cancelAccount('accountId');
    connection._websocketClient.close();
    let resolve;
    let promise = new Promise(res => resolve = res);
    fakeServer.io.close(() => {
      resolve();
    });
    await promise;
    sandbox.restore();
    clock.restore();
    await new Promise(res => setTimeout(res, 50));
  });

  it('should synchronize account', async () => {
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 10});
    const response = await connection.getAccountInformation();
    sinon.assert.match(response, accountInformation);
    (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
  }).timeout(10000);

  it('should reconnect on server socket crash', async () => {
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 10});
    server.disconnect();
    await new Promise(res => setTimeout(res, 200));
    const response = await connection.getAccountInformation();
    sinon.assert.match(response, accountInformation);
  }).timeout(10000);

  it('should set state to disconnected on timeout', async () => {
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 10});
    clearInterval(fakeServer.statusTask);
    fakeServer.io.on('connect', socket => {
      socket.disconnect();
    });
    server.disconnect();
    await clock.tickAsync(61000);
    await new Promise(res => setTimeout(res, 50));
    connection.synchronized.should.equal(false);
    connection.terminalState.connected.should.equal(false);
    connection.terminalState.connectedToBroker.should.equal(false);
  }).timeout(10000);

  it('should resubscribe on timeout', async () => {
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 10});
    clearInterval(fakeServer.statusTask);
    await clock.tickAsync(61000);
    await new Promise(res => setTimeout(res, 50));
    const response = await connection.getAccountInformation();
    sinon.assert.match(response, accountInformation);
    (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
  }).timeout(10000);

  it('should synchronize if subscribe response arrives after synchronization', async () => {
    fakeServer.enableSync = (socket) => {
      socket.removeAllListeners('request');
      socket.on('request', async data => {
        if(data.type === 'subscribe') {
          await new Promise(res => setTimeout(res, 200)); 
          fakeServer.statusTask = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
          await fakeServer.authenticate(socket, data);
          await new Promise(res => setTimeout(res, 400)); 
          await fakeServer.respond(socket, data);
        } else if (data.type === 'synchronize') {
          await fakeServer.respond(socket, data);
          await fakeServer.syncAccount(socket, data);
        } else if (data.type === 'waitSynchronized') {
          await fakeServer.respond(socket, data);
        } else if (data.type === 'getAccountInformation') {
          await fakeServer.respondAccountInformation(socket, data);
        }
      });
    };
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 10});
    const response = await connection.getAccountInformation();
    sinon.assert.match(response, accountInformation);
    (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
  }).timeout(10000);

  it('should wait until account is redeployed after disconnect', async () => {
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 10});
    clearInterval(fakeServer.statusTask);
    fakeServer.disableSync();
    await server.emit('synchronization', {type: 'disconnected', accountId: 'accountId',
      host: 'ps-mpa-0', instanceIndex: 0});
    await clock.tickAsync(20000);
    connection.synchronized.should.equal(false);
    connection.terminalState.connected.should.equal(false);
    connection.terminalState.connectedToBroker.should.equal(false);
    await clock.tickAsync(200000);
    fakeServer.enableSync(server);
    await clock.tickAsync(20000);
    connection.synchronized.should.equal(false);
    connection.terminalState.connected.should.equal(false);
    connection.terminalState.connectedToBroker.should.equal(false);
    await clock.tickAsync(200000);
    (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
  }).timeout(10000);

  it('should resubscribe immediately after disconnect on status packet', async () => {
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 10});
    clearInterval(fakeServer.statusTask);
    fakeServer.disableSync();
    await server.emit('synchronization', {type: 'disconnected', accountId: 'accountId',
      host: 'ps-mpa-0', instanceIndex: 0});
    await clock.tickAsync(20000);
    connection.synchronized.should.equal(false);
    connection.terminalState.connected.should.equal(false);
    connection.terminalState.connectedToBroker.should.equal(false);
    await clock.tickAsync(200000);
    fakeServer.enableSync(server);
    await fakeServer.emitStatus(server, 'accountId');
    await clock.tickAsync(20000);
    (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
  }).timeout(10000);

  it('should reconnect after server restarts', async () => {
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 10});
    for (let i = 0; i < 5; i++) {
      clearInterval(fakeServer.statusTask);
      fakeServer.io.close();
      await clock.tickAsync(200000);
      await new Promise(res => setTimeout(res, 50));
      await fakeServer.start();
      await new Promise(res => setTimeout(res, 200));
    }
    const response = await connection.getAccountInformation();
    sinon.assert.match(response, accountInformation);
  }).timeout(10000);

  it('should synchronize if connecting while server is rebooting', async () => {
    fakeServer.io.close();
    await fakeServer.start(9000);
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    setTimeout(() => {
      fakeServer.io.close();
      fakeServer.start();
    }, 3000);
    await connection.waitSynchronized({timeoutInSeconds: 10});
    const response = await connection.getAccountInformation();
    sinon.assert.match(response, accountInformation);
    (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
  }).timeout(10000);

  it('should limit subscriptions during per user 429 error', async () => {
    const subscribedAccounts = {};
    fakeServer.enableSync = (socket) => {
      socket.removeAllListeners('request');
      socket.on('request', async data => {
        if(data.type === 'subscribe') {
          if (Object.keys(subscribedAccounts).length < 2) {
            subscribedAccounts[data.accountId] = true;
            await new Promise(res => setTimeout(res, 200)); 
            await fakeServer.respond(socket, data);
            fakeServer.statusTask = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
            await new Promise(res => setTimeout(res, 50)); 
            await fakeServer.authenticate(socket, data);
          } else {
            await fakeServer.emitError(socket, data, 1, 2);
          }
        } else if (data.type === 'synchronize') {
          await fakeServer.respond(socket, data);
          await fakeServer.syncAccount(socket, data);
        } else if (data.type === 'waitSynchronized') {
          await fakeServer.respond(socket, data);
        } else if (data.type === 'getAccountInformation') {
          await fakeServer.respondAccountInformation(socket, data);
        } else if (data.type === 'unsubscribe') {
          delete subscribedAccounts[data.accountId];
          await fakeServer.respondAccountInformation(socket, data);
        }
      });
    };

    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 3});
    const account2 = await api.metatraderAccountApi.getAccount('accountId2');
    const connection2 = await account2.connect();
    await connection2.waitSynchronized({timeoutInSeconds: 3});
    const account3 = await api.metatraderAccountApi.getAccount('accountId3');
    const connection3 = await account3.connect();
    try {
      await connection3.waitSynchronized({timeoutInSeconds: 3});
      throw new Error('TimeoutError expected');
    } catch (err) {
      err.name.should.equal('TimeoutError');
    }
    await connection2.close();
    await clock.tickAsync(2000);
    sinon.assert.match(connection3.synchronized, true);
  }).timeout(10000);

  it('should wait for retry time after per user 429 error', async () => {
    let requestTimestamp = 0;
    const subscribedAccounts = {};

    fakeServer.enableSync = (socket) => {
      socket.removeAllListeners('request');
      //eslint-disable-next-line complexity
      socket.on('request', async data => {
        if(data.type === 'subscribe') {
          if (Object.keys(subscribedAccounts).length < 2 || 
            (requestTimestamp !==0 && Date.now() - 2 * 1000 > requestTimestamp)) {
            subscribedAccounts[data.accountId] = true;
            await new Promise(res => setTimeout(res, 200)); 
            await fakeServer.respond(socket, data);
            fakeServer.statusTask = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
            await new Promise(res => setTimeout(res, 50)); 
            await fakeServer.authenticate(socket, data);
          } else {
            requestTimestamp = Date.now();
            await fakeServer.emitError(socket, data, 1, 3);
          }
        } else if (data.type === 'synchronize') {
          await fakeServer.respond(socket, data);
          await fakeServer.syncAccount(socket, data);
        } else if (data.type === 'waitSynchronized') {
          await fakeServer.respond(socket, data);
        } else if (data.type === 'getAccountInformation') {
          await fakeServer.respondAccountInformation(socket, data);
        } else if (data.type === 'unsubscribe') {
          delete subscribedAccounts[data.accountId];
          await fakeServer.respond(socket, data);
        }
      });
    };
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 3});
    const account2 = await api.metatraderAccountApi.getAccount('accountId2');
    const connection2 = await account2.connect();
    await connection2.waitSynchronized({timeoutInSeconds: 3});
    const account3 = await api.metatraderAccountApi.getAccount('accountId3');
    const connection3 = await account3.connect();
    try {
      await connection3.waitSynchronized({timeoutInSeconds: 3});
      throw new Error('TimeoutError expected');
    } catch (err) {
      err.name.should.equal('TimeoutError');
    }
    await clock.tickAsync(2000);
    sinon.assert.match(connection3.synchronized, false);
    await clock.tickAsync(2500);
    await new Promise(res => setTimeout(res, 200));
    sinon.assert.match(connection3.synchronized, true);
  }).timeout(10000);

  it('should wait for retry time after per server 429 error', async () => {
    let requestTimestamp = 0;
    const sidByAccounts = {};

    fakeServer.enableSync = (socket) => {
      socket.removeAllListeners('request');
      //eslint-disable-next-line complexity
      socket.on('request', async data => {
        const sid = socket.id;
        if(data.type === 'subscribe') {
          if(Object.values(sidByAccounts).filter(accountSID => accountSID === sid).length >= 2 && 
          (requestTimestamp === 0 || Date.now() - 5 * 1000 < requestTimestamp)) {
            requestTimestamp = Date.now();
            await fakeServer.emitError(socket, data, 2, 5);
          } else {
            sidByAccounts[data.accountId] = sid;
            await new Promise(res => setTimeout(res, 200)); 
            await fakeServer.respond(socket, data);
            fakeServer.statusTask = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
            await new Promise(res => setTimeout(res, 50)); 
            await fakeServer.authenticate(socket, data);
          }
        } else if (data.type === 'synchronize') {
          await fakeServer.respond(socket, data);
          await fakeServer.syncAccount(socket, data);
        } else if (data.type === 'waitSynchronized') {
          await fakeServer.respond(socket, data);
        } else if (data.type === 'getAccountInformation') {
          await fakeServer.respondAccountInformation(socket, data);
        }
      });
    };
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 3});
    const account2 = await api.metatraderAccountApi.getAccount('accountId2');
    const connection2 = await account2.connect();
    await connection2.waitSynchronized({timeoutInSeconds: 3});
    const account3 = await api.metatraderAccountApi.getAccount('accountId3');
    const connection3 = await account3.connect();
    connection3.waitSynchronized({timeoutInSeconds: 5});
    await clock.tickAsync(5000);
    sidByAccounts.accountId.should.equal(sidByAccounts.accountId2);
    sidByAccounts.accountId2.should.not.equal(sidByAccounts.accountId3);
    await clock.tickAsync(5000);
    const account4 = await api.metatraderAccountApi.getAccount('accountId4');
    const connection4 = await account4.connect();
    await connection4.waitSynchronized({timeoutInSeconds: 3});
    sidByAccounts.accountId.should.equal(sidByAccounts.accountId4);
  }).timeout(10000);
  
  it('should reconnect after per server 429 error if connection has no subscribed accounts', async () => {
    const sids = [];

    fakeServer.enableSync = (socket) => {
      socket.removeAllListeners('request');
      //eslint-disable-next-line complexity
      socket.on('request', async data => {
        const sid = socket.id;
        if(data.type === 'subscribe') {
          sids.push(sid);
          if (sids.length === 1) {
            await fakeServer.emitError(socket, data, 2, 2);
          } else {
            await new Promise(res => setTimeout(res, 200)); 
            await fakeServer.respond(socket, data);
            fakeServer.statusTask = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
            await new Promise(res => setTimeout(res, 50)); 
            await fakeServer.authenticate(socket, data);
          }
        } else if (data.type === 'synchronize') {
          await fakeServer.respond(socket, data);
          await fakeServer.syncAccount(socket, data);
        } else if (data.type === 'waitSynchronized') {
          await fakeServer.respond(socket, data);
        } else if (data.type === 'getAccountInformation') {
          await fakeServer.respondAccountInformation(socket, data);
        }
      });
    };
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 5});
    sids[0].should.not.equal(sids[1]);
  }).timeout(10000);

  it('should free a subscribe slot on unsubscribe after per server 429 error', async () => {
    const sidByAccounts = {};

    fakeServer.enableSync = (socket) => {
      socket.removeAllListeners('request');
      //eslint-disable-next-line complexity
      socket.on('request', async data => {
        const sid = socket.id;
        if(data.type === 'subscribe') {
          if(Object.values(sidByAccounts).filter(accountSID => accountSID === sid).length >= 2) {
            await fakeServer.emitError(socket, data, 2, 200);
          } else {
            sidByAccounts[data.accountId] = sid;
            await new Promise(res => setTimeout(res, 200)); 
            await fakeServer.respond(socket, data);
            fakeServer.statusTask = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
            await new Promise(res => setTimeout(res, 50)); 
            await fakeServer.authenticate(socket, data);
          }
        } else if (data.type === 'synchronize') {
          await fakeServer.respond(socket, data);
          await fakeServer.syncAccount(socket, data);
        } else if (data.type === 'waitSynchronized') {
          await fakeServer.respond(socket, data);
        } else if (data.type === 'getAccountInformation') {
          await fakeServer.respondAccountInformation(socket, data);
        } else if (data.type === 'unsubscribe') {
          delete sidByAccounts[data.accountId];
          await fakeServer.respond(socket, data);
        }
      });
    };
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 3});
    const account2 = await api.metatraderAccountApi.getAccount('accountId2');
    const connection2 = await account2.connect();
    await connection2.waitSynchronized({timeoutInSeconds: 3});
    const account3 = await api.metatraderAccountApi.getAccount('accountId3');
    const connection3 = await account3.connect();
    connection3.waitSynchronized({timeoutInSeconds: 5});
    await clock.tickAsync(5000);
    sidByAccounts.accountId.should.equal(sidByAccounts.accountId2);
    sidByAccounts.accountId2.should.not.equal(sidByAccounts.accountId3);
    await connection2.close();
    const account4 = await api.metatraderAccountApi.getAccount('accountId4');
    const connection4 = await account4.connect();
    await connection4.waitSynchronized({timeoutInSeconds: 3});
    sidByAccounts.accountId.should.equal(sidByAccounts.accountId4);
  }).timeout(10000);

  it('should wait for retry time after per server per user 429 error', async () => {
    let requestTimestamp = 0;
    const sidByAccounts = {};

    fakeServer.enableSync = (socket) => {
      socket.removeAllListeners('request');
      //eslint-disable-next-line complexity
      socket.on('request', async data => {
        const sid = socket.id;
        if(data.type === 'subscribe') {
          if(Object.values(sidByAccounts).filter(accountSID => accountSID === sid).length >= 2 && 
          (requestTimestamp === 0 || Date.now() - 2 * 1000 < requestTimestamp)) {
            requestTimestamp = Date.now();
            await fakeServer.emitError(socket, data, 0, 2);
          } else {
            sidByAccounts[data.accountId] = sid;
            await new Promise(res => setTimeout(res, 200)); 
            await fakeServer.respond(socket, data);
            fakeServer.statusTask = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
            await new Promise(res => setTimeout(res, 50)); 
            await fakeServer.authenticate(socket, data);
          }
        } else if (data.type === 'synchronize') {
          await fakeServer.respond(socket, data);
          await fakeServer.syncAccount(socket, data);
        } else if (data.type === 'waitSynchronized') {
          await fakeServer.respond(socket, data);
        } else if (data.type === 'getAccountInformation') {
          await fakeServer.respondAccountInformation(socket, data);
        } else if (data.type === 'unsubscribe') {
          delete sidByAccounts[data.accountId];
          await fakeServer.respond(socket, data);
        }
      });
    };
    const account = await api.metatraderAccountApi.getAccount('accountId');
    connection = await account.connect();
    await connection.waitSynchronized({timeoutInSeconds: 3});
    const account2 = await api.metatraderAccountApi.getAccount('accountId2');
    const connection2 = await account2.connect();
    await connection2.waitSynchronized({timeoutInSeconds: 3});
    const account3 = await api.metatraderAccountApi.getAccount('accountId3');
    const connection3 = await account3.connect();
    connection3.waitSynchronized({timeoutInSeconds: 5});
    await clock.tickAsync(5000);
    sidByAccounts.accountId.should.equal(sidByAccounts.accountId2);
    sidByAccounts.accountId2.should.not.equal(sidByAccounts.accountId3);
    const account4 = await api.metatraderAccountApi.getAccount('accountId4');
    const connection4 = await account4.connect();
    await connection4.waitSynchronized({timeoutInSeconds: 3});
    sidByAccounts.accountId.should.not.equal(sidByAccounts.accountId4);
    await connection2.close();
    const account5 = await api.metatraderAccountApi.getAccount('accountId5');
    const connection5 = await account5.connect();
    await connection5.waitSynchronized({timeoutInSeconds: 3});
    sidByAccounts.accountId.should.equal(sidByAccounts.accountId5);
  }).timeout(10000);

});
