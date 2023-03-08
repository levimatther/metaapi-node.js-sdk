'use strict';

import should from 'should';
import sinon from 'sinon';
import Server from 'socket.io';
import * as helpers from '../helpers/helpers';
import MetaApi from '../metaApi/metaApi';
import log4js from 'log4js';

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
const defaultPositions = [{
  id: '46214692',
  type: 'POSITION_TYPE_BUY',
  symbol: 'GBPUSD',
  magic: 1000,
  time: new Date('2020-04-15T02:45:06.521Z'),
  updateTime: new Date('2020-04-15T02:45:06.521Z'),
  openPrice: 1,
  currentPrice: 1.1,
  currentTickValue: 1,
  volume: 0.05,
  swap: 0,
  profit: -85.25999999999966,
  commission: -0.25,
  clientId: 'TE_GBPUSD_7hyINWqAlE',
  stopLoss: 1.17721,
  unrealizedProfit: -85.25999999999901,
  realizedProfit: -6.536993168992922e-13
}];
const defaultOrders = [{
  id: '46871284',
  type: 'ORDER_TYPE_BUY_LIMIT',
  state: 'ORDER_STATE_PLACED',
  symbol: 'AUDNZD',
  magic: 123456,
  platform: 'mt5',
  time: new Date('2020-04-20T08:38:58.270Z'),
  openPrice: 1.03,
  currentPrice: 1.05206,
  volume: 0.05,
  currentVolume: 0.01,
  comment: 'COMMENT2'
}];
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

let server, server1;
let defaultSpecifications = [{
  symbol: 'EURUSD',
  tickSize: 0.00001,
  minVolume: 0.01,
  maxVolume: 200,
  volumeStep: 0.01
}];
let syncHost = 'ps-mpa-0';

class FakeServer {

  constructor() {
    this.io;
    this.socket;
    this.statusTasks = {};
    this._sequenceNumbers = {};
  }

  async authenticate(socket, data, host=syncHost) {
    socket.emit('synchronization', {type: 'authenticated', accountId: data.accountId,
      instanceIndex: 0, replicas: 1, host});
  }

  deleteStatusTask(accountId) {
    if(this.statusTasks[accountId]) {
      clearInterval(this.statusTasks[accountId]);
      delete this.statusTasks[accountId];
    }
  }

  async emitStatus(socket, accountId, host=syncHost) {
    const packet = {connected: true, authenticated: true, instanceIndex: 0, type: 'status',
      healthStatus: {rpcApiHealthy: true}, replicas: 1, host,
      connectionId: accountId, accountId: accountId};
    socket.emit('synchronization', packet);
  }

  async respondAccountInformation(socket, data) {
    await socket.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, 
      accountInformation});
  }

  async syncAccount(socket, data, host=syncHost, opts={}) {
    const snId = `${data.accountId}:0`;
    this._sequenceNumbers[snId] = this._sequenceNumbers[snId] || 0;
    socket.emit('synchronization', {type: 'synchronizationStarted', accountId: data.accountId, instanceIndex: 0, 
      synchronizationId: data.requestId, host, sequenceNumber: this._sequenceNumbers[snId]++,
      specificationsHashIndex: opts.specificationsHashIndex, positionsHashIndex: opts.positionsHashIndex,
      ordersHashIndex: opts.ordersHashIndex});
    await new Promise(res => setTimeout(res, 50));
    socket.emit('synchronization', {type: 'accountInformation', accountId: data.accountId, accountInformation,
      instanceIndex: 0, host, sequenceNumber: this._sequenceNumbers[snId]++});
    socket.emit('synchronization',
      {type: 'specifications', accountId: data.accountId, specifications: opts.specifications || defaultSpecifications,
        instanceIndex: 0, host, sequenceNumber: this._sequenceNumbers[snId]++});
    socket.emit('synchronization',
      {type: 'positions', accountId: data.accountId, synchronizationId: data.requestId,
        positions: opts.positions || defaultPositions, instanceIndex: 0, host,
        sequenceNumber: this._sequenceNumbers[snId]++});
    socket.emit('synchronization',
      {type: 'orders', accountId: data.accountId, synchronizationId: data.requestId,
        orders: opts.orders || defaultOrders, instanceIndex: 0, host, sequenceNumber: this._sequenceNumbers[snId]++});
    await new Promise(res => setTimeout(res, 50));
    socket.emit('synchronization', {type: 'orderSynchronizationFinished', accountId: data.accountId,
      synchronizationId: data.requestId, instanceIndex: 0, host, sequenceNumber: this._sequenceNumbers[snId]++});
    await new Promise(res => setTimeout(res, 50));
    socket.emit('synchronization', {type: 'dealSynchronizationFinished', accountId: data.accountId,
      synchronizationId: data.requestId, instanceIndex: 0, host, sequenceNumber: this._sequenceNumbers[snId]++});
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
    // eslint-disable-next-line complexity
    socket.on('request', async data => {
      if(data.instanceIndex === 1) {
        await this.respond(socket, data);
      } else {
        if(data.type === 'subscribe') {
          await new Promise(res => setTimeout(res, 200)); 
          await this.respond(socket, data);
          this.statusTasks[data.accountId] = setInterval(() => this.emitStatus(socket, data.accountId), 100);
          await new Promise(res => setTimeout(res, 50)); 
          await this.authenticate(socket, data);
        } else if (data.type === 'synchronize') {
          await this.respond(socket, data);
          await new Promise(res => setTimeout(res, 50)); 
          await this.syncAccount(socket, data);
        } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions' || 
        data.type === 'unsubscribeFromMarketData') {
          await this.respond(socket, data);
        } else if (data.type === 'getAccountInformation') {
          await this.respondAccountInformation(socket, data);
        } else if (data.type === 'unsubscribe') {
          this.deleteStatusTask(data.accountId);
          await this.respond(socket, data);
        }
      }
    });
  }

  disableSync() {
    server.removeAllListeners('request');
    server.on('request', async data => {
      await this.respond(server, data);
    });
    server1.removeAllListeners('request');
    server1.on('request', async data => {
      await this.respond(server1, data);
    });
  }

  async start(port = 6785) {
    this.io = new Server(port, {path: '/ws', pingTimeout: 1000000});
    this.io.on('connect', socket => {
      if(server) {
        server1 = socket;
      } else {
        server = socket;
      }
      this.enableSync(socket);
    });
  }

}

const sequentialProcessing = [true];
sequentialProcessing.forEach(param => {
  describe('Synchronization stability test', () => {

    let fakeServer;
    let connection;
    let clock;
    let sandbox;
    let api;
    let random;
    
    before(() => {
      MetaApi.enableLog4jsLogging();
      log4js.configure(helpers.assembleLog4jsConfig());
      sandbox = sinon.createSandbox();
      random = Math.random;
    });

    beforeEach(async () => {
      syncHost = 'ps-mpa-0';
      defaultSpecifications = [{
        symbol: 'EURUSD',
        tickSize: 0.00001,
        minVolume: 0.01,
        maxVolume: 200,
        volumeStep: 0.01
      }];
      clock = sinon.useFakeTimers({shouldAdvanceTime: true, now: new Date('2020-04-02T00:00:00.000Z').getTime()});
      api = new MetaApi('token', {application: 'application', domain: 'project-stock.agiliumlabs.cloud',
        useSharedClientApi: true, requestTimeout: 3, retryOpts: {
          retries: 3, minDelayInSeconds: 0.1, maxDelayInSeconds: 0.5, subscribeCooldownInSeconds: 6}, 
        eventProcessing: { sequentialProcessing: param }});
      api.metatraderAccountApi._metatraderAccountClient.getAccount = (accountId) => ({
        _id:  accountId,
        login: '50194988',
        name: 'mt5a',
        region: 'vint-hill',
        reliability: 'regular',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYED',
        type: 'cloud-g1',
        accessToken: '2RUnoH1ldGbnEneCoqRTgI4QO1XOmVzbH5EVoQsA'
      });
      api._metaApiWebsocketClient.url = 'http://localhost:6785';
      sandbox.stub(api._connectionRegistry._terminalHashManager._clientApiClient,
        'refreshIgnoredFieldLists').resolves();
      sandbox.stub(api._connectionRegistry._terminalHashManager._clientApiClient,
        'getHashingIgnoredFieldLists').returns({
        'g1': {
          'specification': ['description'],
          'position': ['time'],
          'order': ['time']
        },
        'g2': {
          'specification': ['pipSize'],
          'position': ['comment'],
          'order': ['comment']
        }
      });
      fakeServer = new FakeServer();
      await fakeServer.start();
    });

    afterEach(async () => {
      Object.values(fakeServer.statusTasks).forEach(task => clearInterval(task));
      connection._websocketClient._subscriptionManager.cancelAccount('accountId');
      connection._websocketClient.close();
      let resolve;
      let promise = new Promise(res => resolve = res);
      fakeServer.io.close(() => resolve());
      await promise;
      sandbox.restore();
      clock.restore();
      await new Promise(res => setTimeout(res, 50));
      server = null;
      server1 = null;
    });

    it('should synchronize account', async () => {
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000); 
      await connection.waitSynchronized({timeoutInSeconds: 10});
      const response = connection.terminalState.accountInformation;
      sinon.assert.match(response, accountInformation);
      (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
    }).timeout(10000);

    it('should reconnect on server socket crash', async () => {
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000); 
      await connection.waitSynchronized({timeoutInSeconds: 10});
      server.disconnect();
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(10000);
      const response = connection.terminalState.accountInformation;
      sinon.assert.match(response, accountInformation);
      (connection.synchronized && connection.terminalState.connected 
        && connection.terminalState.connectedToBroker).should.equal(true);
    }).timeout(10000);

    it('should set state to disconnected on timeout', async () => {
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 10});
      fakeServer.deleteStatusTask('accountId');
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
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 10});
      fakeServer.deleteStatusTask('accountId');
      await clock.tickAsync(61000);
      await new Promise(res => setTimeout(res, 50));
      const response = connection.terminalState.accountInformation;
      sinon.assert.match(response, accountInformation);
      (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
    }).timeout(10000);

    it('should synchronize if subscribe response arrives after synchronization', async () => {
      fakeServer.io.removeAllListeners('connect');
      fakeServer.io.on('connect', socket => {
        server = socket;
        socket.emit('response', {type: 'response'});
        socket.removeAllListeners('request');
        socket.on('request', async data => {
          if(data.instanceIndex === 1) {
            await fakeServer.respond(socket, data);
            return;
          }
          if(data.type === 'subscribe') {
            await new Promise(res => setTimeout(res, 200)); 
            fakeServer.statusTasks.accountId = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
            await fakeServer.authenticate(socket, data);
            await new Promise(res => setTimeout(res, 400)); 
            await fakeServer.respond(socket, data);
          } else if (data.type === 'synchronize') {
            await fakeServer.respond(socket, data);
            await fakeServer.syncAccount(socket, data);
          } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
            await fakeServer.respond(socket, data);
          } else if (data.type === 'getAccountInformation') {
            await fakeServer.respondAccountInformation(socket, data);
          }
        });
      });
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 10});
      const response = connection.terminalState.accountInformation;
      sinon.assert.match(response, accountInformation);
      (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
    }).timeout(10000);

    it('should wait until account is redeployed after disconnect', async () => {
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 10});
      fakeServer.deleteStatusTask('accountId');
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
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 10});
      fakeServer.deleteStatusTask('accountId');
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
      connection = account.getStreamingConnection();
      await connection.connect();
      await new Promise(res => setTimeout(res, 50));
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 10});
      for (let i = 0; i < 5; i++) {
        fakeServer.deleteStatusTask('accountId');
        fakeServer.io.close();
        await clock.tickAsync(200000);
        await new Promise(res => setTimeout(res, 50));
        clock.tickAsync(2000);
        await fakeServer.start();
        await new Promise(res => setTimeout(res, 50));
        await clock.tickAsync(1000);
      }
      await clock.tickAsync(20000);
      await new Promise(res => setTimeout(res, 100));
      await clock.tickAsync(20000);
      const response = connection.terminalState.accountInformation;
      sinon.assert.match(response, accountInformation);
      connection.synchronized.should.equal(true);
      connection.terminalState.connected.should.equal(true);
      connection.terminalState.connectedToBroker.should.equal(true);
    }).timeout(20000);

    it('should synchronize if connecting while server is rebooting', async () => {
      fakeServer.io.close();
      await fakeServer.start(9000);
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      setTimeout(() => {
        fakeServer.io.close();
        fakeServer.start();
      }, 3000);
      await new Promise(res => setTimeout(res, 50));
      clock.tickAsync(7000);
      await connection.waitSynchronized({timeoutInSeconds: 10});
      const response = connection.terminalState.accountInformation;
      sinon.assert.match(response, accountInformation);
      (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
    }).timeout(10000);

    it('should resubscribe other accounts after one of connections is closed', async () => {
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 10});
      const account2 = await api.metatraderAccountApi.getAccount('accountId2');
      const connection2 = account2.getStreamingConnection();
      await connection2.connect();
      clock.tickAsync(5000);
      await connection2.waitSynchronized({timeoutInSeconds: 10});
      const account3 = await api.metatraderAccountApi.getAccount('accountId3');
      const connection3 = account3.getStreamingConnection();
      await connection3.connect();
      clock.tickAsync(1000);
      await connection3.waitSynchronized({timeoutInSeconds: 10});
      await connection.close();
      fakeServer.deleteStatusTask('accountId2');
      fakeServer.deleteStatusTask('accountId3');
      fakeServer.disableSync();
      server.disconnect();
      await clock.tickAsync(2000);
      await new Promise(res => setTimeout(res, 50)); 
      fakeServer.enableSync(server);
      server.disconnect();
      await clock.tickAsync(8000);
      await new Promise(res => setTimeout(res, 50)); 
      connection.synchronized.should.equal(false);
      connection2.synchronized.should.equal(true);
      connection2.terminalState.connected.should.equal(true);
      connection2.terminalState.connectedToBroker.should.equal(true);
      connection3.synchronized.should.equal(true);
      connection3.terminalState.connected.should.equal(true);
      connection3.terminalState.connectedToBroker.should.equal(true);
    }).timeout(10000);

    it('should limit subscriptions during per user 429 error', async () => {
      const subscribedAccounts = {};
      fakeServer.io.removeAllListeners('connect');
      fakeServer.io.on('connect', socket => {
        server = socket;
        socket.emit('response', {type: 'response'});
        socket.removeAllListeners('request');
        // eslint-disable-next-line complexity
        socket.on('request', async data => {
          if(data.instanceIndex === 1) {
            await fakeServer.respond(socket, data);
            return;
          }
          if(data.type === 'subscribe') {
            if (Object.keys(subscribedAccounts).length < 2) {
              subscribedAccounts[data.accountId] = true;
              await new Promise(res => setTimeout(res, 200)); 
              await fakeServer.respond(socket, data);
              fakeServer.statusTasks.accountId = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
              await new Promise(res => setTimeout(res, 50)); 
              await fakeServer.authenticate(socket, data);
            } else {
              await fakeServer.emitError(socket, data, 1, 2);
            }
          } else if (data.type === 'synchronize') {
            await fakeServer.respond(socket, data);
            await fakeServer.syncAccount(socket, data);
          } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
            await fakeServer.respond(socket, data);
          } else if (data.type === 'getAccountInformation') {
            await fakeServer.respondAccountInformation(socket, data);
          } else if (data.type === 'unsubscribe') {
            delete subscribedAccounts[data.accountId];
            await fakeServer.respond(socket, data);
          }
        });
      });
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      await new Promise(res => setTimeout(res, 50)); 
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 5});
      const account2 = await api.metatraderAccountApi.getAccount('accountId2');
      const connection2 = account2.getStreamingConnection();
      await connection2.connect();
      await new Promise(res => setTimeout(res, 50)); 
      clock.tickAsync(5000);
      await connection2.waitSynchronized({timeoutInSeconds: 5});
      const account3 = await api.metatraderAccountApi.getAccount('accountId3');
      const connection3 = account3.getStreamingConnection();
      await connection3.connect();
      try {
        await new Promise(res => setTimeout(res, 50)); 
        clock.tickAsync(5000);
        await connection3.waitSynchronized({timeoutInSeconds: 5});
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

      fakeServer.io.removeAllListeners('connect');
      fakeServer.io.on('connect', socket => {
        server = socket;
        socket.emit('response', {type: 'response'});
        socket.removeAllListeners('request');
        //eslint-disable-next-line complexity
        socket.on('request', async data => {
          if(data.instanceIndex === 1) {
            await fakeServer.respond(socket, data);
            return;
          }
          if(data.type === 'subscribe') {
            if (Object.keys(subscribedAccounts).length < 2 || 
            (requestTimestamp !== 0 && Date.now() - 2 * 1000 > requestTimestamp)) {
              subscribedAccounts[data.accountId] = true;
              await new Promise(res => setTimeout(res, 200)); 
              await fakeServer.respond(socket, data);
              fakeServer.statusTasks.accountId = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
              await new Promise(res => setTimeout(res, 50)); 
              await fakeServer.authenticate(socket, data);
            } else {
              requestTimestamp = Date.now();
              await fakeServer.emitError(socket, data, 1, 3);
            }
          } else if (data.type === 'synchronize') {
            await fakeServer.respond(socket, data);
            await fakeServer.syncAccount(socket, data);
          } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
            await fakeServer.respond(socket, data);
          } else if (data.type === 'getAccountInformation') {
            await fakeServer.respondAccountInformation(socket, data);
          } else if (data.type === 'unsubscribe') {
            delete subscribedAccounts[data.accountId];
            await fakeServer.respond(socket, data);
          }
        });
      });
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      await new Promise(res => setTimeout(res, 50));
      clock.tickAsync(1500);
      await connection.waitSynchronized({timeoutInSeconds: 3});
      const account2 = await api.metatraderAccountApi.getAccount('accountId2');
      const connection2 = account2.getStreamingConnection();
      await connection2.connect();
      await new Promise(res => setTimeout(res, 50));
      clock.tickAsync(1500);
      await connection2.waitSynchronized({timeoutInSeconds: 3});
      const account3 = await api.metatraderAccountApi.getAccount('accountId3');
      const connection3 = account3.getStreamingConnection();
      await connection3.connect();
      try {
        await new Promise(res => setTimeout(res, 50));
        clock.tickAsync(3000);
        await connection3.waitSynchronized({timeoutInSeconds: 3});
        throw new Error('TimeoutError expected');
      } catch (err) {
        err.name.should.equal('TimeoutError');
      }
      await clock.tickAsync(1500);
      sinon.assert.match(connection3.synchronized, false);
      await clock.tickAsync(2500);
      await new Promise(res => setTimeout(res, 200));
      sinon.assert.match(connection3.synchronized, true);
    }).timeout(10000);

    it('should wait for retry time after per server 429 error', async () => {
      let requestTimestamp = 0;
      const sidByAccounts = {};

      fakeServer.io.removeAllListeners('connect');
      fakeServer.io.on('connect', socket => {
        server = socket;
        socket.emit('response', {type: 'response'});
        socket.removeAllListeners('request');
        //eslint-disable-next-line complexity
        socket.on('request', async data => {
          if(data.instanceIndex === 1) {
            await fakeServer.respond(socket, data);
            return;
          }
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
              fakeServer.statusTasks.accountId = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
              await new Promise(res => setTimeout(res, 50)); 
              await fakeServer.authenticate(socket, data);
            }
          } else if (data.type === 'synchronize') {
            await fakeServer.respond(socket, data);
            await fakeServer.syncAccount(socket, data);
          } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
            await fakeServer.respond(socket, data);
          } else if (data.type === 'getAccountInformation') {
            await fakeServer.respondAccountInformation(socket, data);
          }
        });
      });
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      await connection.waitSynchronized({timeoutInSeconds: 3});
      const account2 = await api.metatraderAccountApi.getAccount('accountId2');
      const connection2 = account2.getStreamingConnection();
      await connection2.connect();
      await connection2.waitSynchronized({timeoutInSeconds: 3});
      const account3 = await api.metatraderAccountApi.getAccount('accountId3');
      const connection3 = account3.getStreamingConnection();
      await connection3.connect();
      connection3.waitSynchronized({timeoutInSeconds: 5});
      await clock.tickAsync(5000);
      sidByAccounts.accountId.should.equal(sidByAccounts.accountId2);
      sidByAccounts.accountId2.should.not.equal(sidByAccounts.accountId3);
      await clock.tickAsync(5000);
      const account4 = await api.metatraderAccountApi.getAccount('accountId4');
      const connection4 = account4.getStreamingConnection();
      await connection4.connect();
      await new Promise(res => setTimeout(res, 50)); 
      clock.tickAsync(5000);
      await connection4.waitSynchronized({timeoutInSeconds: 3});
      sidByAccounts.accountId.should.equal(sidByAccounts.accountId4);
    }).timeout(10000);
  
    it('should reconnect after per server 429 error if connection has no subscribed accounts', async () => {
      const sids = [];

      fakeServer.io.removeAllListeners('connect');
      fakeServer.io.on('connect', socket => {
        server = socket;
        socket.emit('response', {type: 'response'});
        socket.removeAllListeners('request');
        //eslint-disable-next-line complexity
        socket.on('request', async data => {
          if(data.instanceIndex === 1) {
            await fakeServer.respond(socket, data);
            return;
          }
          const sid = socket.id;
          if(data.type === 'subscribe') {
            sids.push(sid);
            if (sids.length === 1) {
              await fakeServer.emitError(socket, data, 2, 2);
            } else {
              await new Promise(res => setTimeout(res, 200)); 
              await fakeServer.respond(socket, data);
              fakeServer.statusTasks.accountId = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
              await new Promise(res => setTimeout(res, 50)); 
              await fakeServer.authenticate(socket, data);
            }
          } else if (data.type === 'synchronize') {
            await fakeServer.respond(socket, data);
            await fakeServer.syncAccount(socket, data);
          } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
            await fakeServer.respond(socket, data);
          } else if (data.type === 'getAccountInformation') {
            await fakeServer.respondAccountInformation(socket, data);
          }
        });
      });
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      await new Promise(res => setTimeout(res, 50)); 
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 5});
      sids[0].should.not.equal(sids[1]);
    }).timeout(10000);

    it('should free a subscribe slot on unsubscribe after per server 429 error', async () => {
      const sidByAccounts = {};

      fakeServer.io.removeAllListeners('connect');
      fakeServer.io.on('connect', socket => {
        server = socket;
        socket.emit('response', {type: 'response'});
        socket.removeAllListeners('request');
        //eslint-disable-next-line complexity
        socket.on('request', async data => {
          if(data.instanceIndex === 1) {
            await fakeServer.respond(socket, data);
            return;
          }
          const sid = socket.id;
          if(data.type === 'subscribe') {
            if(Object.values(sidByAccounts).filter(accountSID => accountSID === sid).length >= 2) {
              await fakeServer.emitError(socket, data, 2, 200);
            } else {
              sidByAccounts[data.accountId] = sid;
              await new Promise(res => setTimeout(res, 200)); 
              await fakeServer.respond(socket, data);
              fakeServer.statusTasks.accountId = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
              await new Promise(res => setTimeout(res, 50)); 
              await fakeServer.authenticate(socket, data);
            }
          } else if (data.type === 'synchronize') {
            await fakeServer.respond(socket, data);
            await fakeServer.syncAccount(socket, data);
          } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
            await fakeServer.respond(socket, data);
          } else if (data.type === 'getAccountInformation') {
            await fakeServer.respondAccountInformation(socket, data);
          } else if (data.type === 'unsubscribe') {
            delete sidByAccounts[data.accountId];
            await fakeServer.respond(socket, data);
          }
        });
      });
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      await connection.waitSynchronized({timeoutInSeconds: 3});
      const account2 = await api.metatraderAccountApi.getAccount('accountId2');
      const connection2 = account2.getStreamingConnection();
      await connection2.connect();
      await connection2.waitSynchronized({timeoutInSeconds: 3});
      const account3 = await api.metatraderAccountApi.getAccount('accountId3');
      const connection3 = account3.getStreamingConnection();
      await connection3.connect();
      connection3.waitSynchronized({timeoutInSeconds: 5});
      await clock.tickAsync(5000);
      sidByAccounts.accountId.should.equal(sidByAccounts.accountId2);
      sidByAccounts.accountId2.should.not.equal(sidByAccounts.accountId3);
      await connection2.close();
      const account4 = await api.metatraderAccountApi.getAccount('accountId4');
      const connection4 = account4.getStreamingConnection();
      await connection4.connect();
      await new Promise(res => setTimeout(res, 50)); 
      clock.tickAsync(5000);
      await connection4.waitSynchronized({timeoutInSeconds: 3});
      sidByAccounts.accountId.should.equal(sidByAccounts.accountId4);
    }).timeout(10000);

    it('should wait for retry time after per server per user 429 error', async () => {
      let requestTimestamp = 0;
      const sidByAccounts = {};

      fakeServer.io.removeAllListeners('connect');
      fakeServer.io.on('connect', socket => {
        server = socket;
        socket.emit('response', {type: 'response'});
        socket.removeAllListeners('request');
        //eslint-disable-next-line complexity
        socket.on('request', async data => {
          if(data.instanceIndex === 1) {
            await fakeServer.respond(socket, data);
            return;
          }
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
              fakeServer.statusTasks.accountId = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
              await new Promise(res => setTimeout(res, 50)); 
              await fakeServer.authenticate(socket, data);
            }
          } else if (data.type === 'synchronize') {
            await fakeServer.respond(socket, data);
            await fakeServer.syncAccount(socket, data);
          } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
            await fakeServer.respond(socket, data);
          } else if (data.type === 'getAccountInformation') {
            await fakeServer.respondAccountInformation(socket, data);
          } else if (data.type === 'unsubscribe') {
            delete sidByAccounts[data.accountId];
            await fakeServer.respond(socket, data);
          }
        });
      });
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      await new Promise(res => setTimeout(res, 50));
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 5});
      const account2 = await api.metatraderAccountApi.getAccount('accountId2');
      const connection2 = account2.getStreamingConnection();
      await connection2.connect();
      await new Promise(res => setTimeout(res, 50));
      clock.tickAsync(5000);
      await connection2.waitSynchronized({timeoutInSeconds: 5});
      const account3 = await api.metatraderAccountApi.getAccount('accountId3');
      const connection3 = account3.getStreamingConnection();
      await connection3.connect();
      await new Promise(res => setTimeout(res, 50));
      clock.tickAsync(5000);
      await connection3.waitSynchronized({timeoutInSeconds: 5});
      sidByAccounts.accountId.should.equal(sidByAccounts.accountId2);
      sidByAccounts.accountId2.should.not.equal(sidByAccounts.accountId3);
      const account4 = await api.metatraderAccountApi.getAccount('accountId4');
      const connection4 = account4.getStreamingConnection();
      await connection4.connect();
      await new Promise(res => setTimeout(res, 50));
      clock.tickAsync(5000);
      await connection4.waitSynchronized({timeoutInSeconds: 5});
      sidByAccounts.accountId.should.not.equal(sidByAccounts.accountId4);
      await connection2.close();
      const account5 = await api.metatraderAccountApi.getAccount('accountId5');
      const connection5 = account5.getStreamingConnection();
      await connection5.connect();
      await new Promise(res => setTimeout(res, 50));
      clock.tickAsync(5000);
      await connection5.waitSynchronized({timeoutInSeconds: 5});
      sidByAccounts.accountId.should.equal(sidByAccounts.accountId5);
    }).timeout(10000);

    it('should attempt to resubscribe on disconnected packet', async () => {
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      await new Promise(res => setTimeout(res, 50));
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 3}); 
      (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
      fakeServer.deleteStatusTask('accountId');
      await server.emit('synchronization', {type: 'disconnected', accountId: 'accountId',
        host: 'ps-mpa-0', instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50)); 
      await clock.tickAsync(200);
      await new Promise(res => setTimeout(res, 50)); 
      connection.synchronized.should.equal(false);
      connection.terminalState.connected.should.equal(false);
      connection.terminalState.connectedToBroker.should.equal(false);
      await clock.tickAsync(5000);
      (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
    }).timeout(10000);

    it('should handle multiple streams in one instance number', async () => {
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 10}); 
      let subscribeCalled = false;

      fakeServer.enableSync = (socket) => {
        socket.removeAllListeners('request');
        //eslint-disable-next-line complexity
        socket.on('request', async data => {
          if(data.instanceIndex === 1) {
            await fakeServer.respond(socket, data);
            return;
          }
          if(data.type === 'subscribe') {
            subscribeCalled = true;
          } else if (data.type === 'synchronize') {
            await fakeServer.respond(socket, data);
            await fakeServer.syncAccount(socket, data, 'ps-mpa-1');
          } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
            await fakeServer.respond(socket, data);
          } else if (data.type === 'getAccountInformation') {
            await fakeServer.respondAccountInformation(socket, data);
          }
        });
      };
      fakeServer.enableSync(server);
      const statusTask = setInterval(() => fakeServer.emitStatus(server, 'accountId', 'ps-mpa-1'), 100);
      await fakeServer.authenticate(server, {accountId: 'accountId'}, 'ps-mpa-1');
      await new Promise(res => setTimeout(res, 50)); 
      await clock.tickAsync(20000); 
      fakeServer.deleteStatusTask('accountId');
      await server.emit('synchronization', {type: 'disconnected', accountId: 'accountId',
        host: 'ps-mpa-0', instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50)); 
      await clock.tickAsync(10000); 
      (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
      subscribeCalled.should.equal(false);
      await server.emit('synchronization', {type: 'disconnected', accountId: 'accountId',
        host: 'ps-mpa-1', instanceIndex: 0});
      clearInterval(statusTask);
      await new Promise(res => setTimeout(res, 50)); 
      connection.synchronized.should.equal(false);
      connection.terminalState.connected.should.equal(false);
      connection.terminalState.connectedToBroker.should.equal(false);
    }).timeout(10000);

    it('should not resubscribe if multiple streams and one timed out', async () => {
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      await new Promise(res => setTimeout(res, 50));
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 10}); 
      let subscribeCalled = false;

      fakeServer.enableSync = (socket) => {
        socket.removeAllListeners('request');
        //eslint-disable-next-line complexity
        socket.on('request', async data => {
          if(data.instanceIndex === 1) {
            await fakeServer.respond(socket, data);
            return;
          }
          if(data.type === 'subscribe') {
            subscribeCalled = true;
          } else if (data.type === 'synchronize') {
            await fakeServer.respond(socket, data);
            await fakeServer.syncAccount(socket, data, 'ps-mpa-1');
          } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
            await fakeServer.respond(socket, data);
          } else if (data.type === 'getAccountInformation') {
            await fakeServer.respondAccountInformation(socket, data);
          }
        });
      };
      fakeServer.enableSync(server);
      const statusTask = setInterval(() => fakeServer.emitStatus(server, 'accountId', 'ps-mpa-1'), 120);
      await fakeServer.authenticate(server, {accountId: 'accountId'}, 'ps-mpa-1');
      await new Promise(res => setTimeout(res, 50)); 
      await clock.tickAsync(20000); 
      fakeServer.deleteStatusTask('accountId');
      await clock.tickAsync(55000); 
      await new Promise(res => setTimeout(res, 50)); 
      (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
      subscribeCalled.should.equal(false);
      clearInterval(statusTask);
      await new Promise(res => setTimeout(res, 50)); 
      await clock.tickAsync(65000); 
      connection.synchronized.should.equal(false);
      connection.terminalState.connected.should.equal(false);
      connection.terminalState.connectedToBroker.should.equal(false);
      subscribeCalled.should.equal(true);
    }).timeout(10000);

    it('should not synchronize if connection is closed', async () => {
      let synchronizeCounter = 0;
      fakeServer.io.removeAllListeners('connect');
      fakeServer.io.on('connect', socket => {
        server = socket;
        socket.emit('response', {type: 'response'});
        socket.removeAllListeners('request');
        //eslint-disable-next-line complexity
        socket.on('request', async data => {
          if(data.instanceIndex === 1) {
            await fakeServer.respond(socket, data);
            return;
          }
          if(data.type === 'subscribe') {
            await new Promise(res => setTimeout(res, 200)); 
            await fakeServer.respond(socket, data);
            fakeServer.statusTasks.accountId = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
            await fakeServer.authenticate(socket, data);
          } else if (data.type === 'synchronize') {
            synchronizeCounter++;
            await fakeServer.respond(socket, data);
            await fakeServer.syncAccount(socket, data, 'ps-mpa-1');
          } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
            await fakeServer.respond(socket, data);
          } else if (data.type === 'getAccountInformation') {
            await fakeServer.respondAccountInformation(socket, data);
          } else if (data.type === 'unsubscribe') {
            fakeServer.deleteStatusTask(data.accountId);
            await fakeServer.respond(socket, data);
          }
        });
      });
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      await new Promise(res => setTimeout(res, 50)); 
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 10}); 
      sinon.assert.match(synchronizeCounter, 1);
      const account2 = await api.metatraderAccountApi.getAccount('accountId2');
      const connection2 = account2.getStreamingConnection();
      await connection2.connect();
      await new Promise(res => setTimeout(res, 50)); 
      await connection2.close();
      try {
        clock.tickAsync(5000);
        await connection2.waitSynchronized({timeoutInSeconds: 5}); 
        throw new Error('Error expected');
      } catch (err) {
        err.message.should.equal('This connection has been closed, please create a new connection');
      }
      sinon.assert.match(synchronizeCounter, 1);
    }).timeout(10000);

    it('should not resubscribe after connection is closed', async () => {
      let subscribeCounter = 0;
      const servers = [];

      fakeServer.io.removeAllListeners('connect');
      fakeServer.io.on('connect', socket => {
        servers.push(socket);
        socket.emit('response', {type: 'response'});
        socket.removeAllListeners('request');
        //eslint-disable-next-line complexity
        socket.on('request', async data => {
          if(data.instanceIndex === 1) {
            await fakeServer.respond(socket, data);
            return;
          }
          if(data.type === 'subscribe') {
            subscribeCounter++;
            await new Promise(res => setTimeout(res, 100)); 
            await fakeServer.respond(socket, data);
            fakeServer.deleteStatusTask(data.accountId);
            fakeServer.statusTasks.accountId = setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
            await fakeServer.authenticate(socket, data);
          } else if (data.type === 'synchronize') {
            await fakeServer.respond(socket, data);
            await fakeServer.syncAccount(socket, data);
          } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
            await fakeServer.respond(socket, data);
          } else if (data.type === 'getAccountInformation') {
            await fakeServer.respondAccountInformation(socket, data);
          } else if (data.type === 'unsubscribe') {
            fakeServer.deleteStatusTask(data.accountId);
            await fakeServer.respond(socket, data);
          }
        });
      });

      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 10}); 
      (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
      subscribeCounter.should.equal(1);
      await servers[0].emit('synchronization', {type: 'disconnected', accountId: 'accountId',
        host: 'ps-mpa-0', instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50)); 
      await clock.tickAsync(100000); 
      await new Promise(res => setTimeout(res, 50)); 
      subscribeCounter.should.be.above(1);
      const previousSubscribeCounter = subscribeCounter;
      (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
      servers[0].emit('synchronization', {type: 'disconnected', accountId: 'accountId',
        host: 'ps-mpa-0', instanceIndex: 0});
      await connection.close();
      await new Promise(res => setTimeout(res, 50)); 
      await clock.tickAsync(100000); 
      await new Promise(res => setTimeout(res, 50)); 
      sinon.assert.match(subscribeCounter, previousSubscribeCounter);
      connection.synchronized.should.equal(false);
      connection.terminalState.connected.should.equal(false);
      connection.terminalState.connectedToBroker.should.equal(false);
    }).timeout(10000);

    it('should not resubscribe on timeout if connection is closed', async () => {
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000); 
      await connection.waitSynchronized({timeoutInSeconds: 10}); 
      fakeServer.deleteStatusTask('accountId');
      connection.synchronized.should.equal(true);
      await connection.close();
      await new Promise(res => setTimeout(res, 100)); 
      await clock.tickAsync(62000); 
      connection.synchronized.should.equal(false);
    }).timeout(10000);

    it('should not send multiple subscribe requests if status arrives faster than subscribe', async () => {
      let subscribeCounter = 0;
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000); 
      await connection.waitSynchronized({timeoutInSeconds: 10}); 
      fakeServer.disableSync();
      fakeServer.deleteStatusTask('accountId');
      await new Promise(res => setTimeout(res, 50)); 
      await clock.tickAsync(120000); 
      connection.synchronized.should.equal(false);
      connection.terminalState.connected.should.equal(false);
      connection.terminalState.connectedToBroker.should.equal(false);

      server.removeAllListeners('request');
      server1.removeAllListeners('request');
      //eslint-disable-next-line complexity
      server.on('request', async data => {
        if(data.type === 'subscribe') {
          subscribeCounter++;
          await new Promise(res => setTimeout(res, 2800)); 
          await fakeServer.respond(server, data);
          fakeServer.deleteStatusTask(data.accountId);
          fakeServer.statusTasks.accountId = setInterval(() => fakeServer.emitStatus(server, data.accountId), 1000);
          await fakeServer.authenticate(server, data);
        } else if (data.type === 'synchronize') {
          await fakeServer.respond(server, data);
          await fakeServer.syncAccount(server, data);
        } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
          await fakeServer.respond(server, data);
        } else if (data.type === 'getAccountInformation') {
          await fakeServer.respondAccountInformation(server, data);
        } else if (data.type === 'unsubscribe') {
          fakeServer.deleteStatusTask(data.accountId);
          await fakeServer.respond(server, data);
        }
      });
      fakeServer.statusTasks.accountId = setInterval(() => fakeServer.emitStatus(server, 'accountId'), 1000);
      await new Promise(res => setTimeout(res, 100)); 
      await clock.tickAsync(200000); 
      await new Promise(res => setTimeout(res, 100)); 
      await clock.tickAsync(5000); 
      (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
      sinon.assert.match(subscribeCounter, 1);
    }).timeout(10000);

    it('should not update price from old price packets', async () => {
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000); 
      await connection.waitSynchronized({timeoutInSeconds: 10});
      const prices = {
        prices: [{
          time: new Date(Date.now() - 10000), symbol: 'EURUSD', bid: 1, ask: 1.1
        }],
        accountId: 'accountId', instanceIndex: 0, host: 'ps-mpa-0', type: 'prices'
      };
      await server.emit('synchronization', prices);
      await new Promise(res => setTimeout(res, 100)); 
      sinon.assert.match(connection.terminalState.price('EURUSD').bid, 1);

      prices.prices[0].time = new Date(Date.now() - 20000);
      prices.prices[0].bid = 1.1;
      await server.emit('synchronization', prices);
      await new Promise(res => setTimeout(res, 100)); 
      sinon.assert.match(connection.terminalState.price('EURUSD').bid, 1);

      prices.prices[0].time = new Date();
      prices.prices[0].bid = 1.2;
      await server.emit('synchronization', prices);
      await new Promise(res => setTimeout(res, 100)); 
      sinon.assert.match(connection.terminalState.price('EURUSD').bid, 1.2);

    }).timeout(10000);

    describe('Terminal state', () => {

      it('should receive updates for an account', async () => {
        const positionsUpdate = [{
          id: '46214692',
          type: 'POSITION_TYPE_BUY',
          symbol: 'GBPUSD',
          magic: 1000,
          time: new Date('2020-04-15T02:45:06.521Z'),
          updateTime: new Date('2020-04-15T02:45:06.521Z'),
          openPrice: 1.26101,
          currentPrice: 1.24883,
          currentTickValue: 1,
          volume: 0.07,
          swap: 0,
          profit: -85.25999999999966,
          commission: -0.25,
          clientId: 'TE_GBPUSD_7hyINWqAlE',
          stopLoss: 1.17721,
          unrealizedProfit: -85.25999999999901,
          realizedProfit: -6.536993168992922e-13
        },
        {
          id: '46214693',
          type: 'POSITION_TYPE_BUY',
          symbol: 'EURUSD',
          magic: 1000,
          time: new Date('2020-04-15T02:45:06.521Z'),
          updateTime: new Date('2020-04-15T02:45:06.521Z'),
          openPrice: 1.26101,
          currentPrice: 1.24883,
          currentTickValue: 1,
          volume: 0.07,
          swap: 0,
          profit: -85.25999999999966,
          commission: -0.25,
          clientId: 'TE_GBPUSD_7hyINWqAlE',
          stopLoss: 1.17721,
          unrealizedProfit: -85.25999999999901,
          realizedProfit: -6.536993168992922e-13
        }, {
          id: '46214694',
          type: 'POSITION_TYPE_BUY',
          symbol: 'AUDNZD',
          magic: 1000,
          time: new Date('2020-04-15T02:45:06.521Z'),
          updateTime: new Date('2020-04-15T02:45:06.521Z'),
          openPrice: 1.26101,
          currentPrice: 1.24883,
          currentTickValue: 1,
          volume: 0.07,
          swap: 0,
          profit: -85.25999999999966,
          commission: -0.25,
          clientId: 'TE_GBPUSD_7hyINWqAlE',
          stopLoss: 1.17721,
          unrealizedProfit: -85.25999999999901,
          realizedProfit: -6.536993168992922e-13
        }];
        const ordersUpdate = [{
          id: '46871284',
          type: 'ORDER_TYPE_BUY_LIMIT',
          state: 'ORDER_STATE_PLACED',
          symbol: 'AUDNZD',
          magic: 123456,
          platform: 'mt5',
          time: new Date('2020-04-20T08:38:58.270Z'),
          openPrice: 1.03,
          currentPrice: 1.05206,
          volume: 0.01,
          currentVolume: 0.01,
          comment: 'COMMENT2'
        }, {
          id: '46871285',
          type: 'ORDER_TYPE_BUY_LIMIT',
          state: 'ORDER_STATE_PLACED',
          symbol: 'EURUSD',
          magic: 123456,
          platform: 'mt5',
          time: new Date('2020-04-20T08:38:58.270Z'),
          openPrice: 1.03,
          currentPrice: 1.05206,
          volume: 0.01,
          currentVolume: 0.01,
          comment: 'COMMENT2'
        }, {
          id: '46871286',
          type: 'ORDER_TYPE_BUY_LIMIT',
          state: 'ORDER_STATE_PLACED',
          symbol: 'BTCUSD',
          magic: 123456,
          platform: 'mt5',
          time: new Date('2020-04-20T08:38:58.270Z'),
          openPrice: 1.03,
          currentPrice: 1.05206,
          volume: 0.01,
          currentVolume: 0.01,
          comment: 'COMMENT2'
        }];
        let update = {
          accountInformation: {
            broker: 'True ECN Trading Ltd',
            currency: 'USD',
            server: 'ICMarketsSC-Demo',
            balance: 7319.9,
            equity: 7306.649913200001,
            margin: 184.1,
            freeMargin: 7120.22,
            leverage: 100,
            marginLevel: 3967.58283542
          },
          updatedPositions: positionsUpdate,
          removedPositionIds: [],
          updatedOrders: ordersUpdate,
          completedOrderIds: [],
          historyOrders: [{
            clientId: 'TE_GBPUSD_7hyINWqAlE',
            currentPrice: 1.261,
            currentVolume: 0,
            doneTime: new Date('2020-04-15T02:45:06.521Z'),
            id: '46214692',
            magic: 1000,
            platform: 'mt5',
            positionId: '46214692',
            state: 'ORDER_STATE_FILLED',
            symbol: 'GBPUSD',
            time: new Date('2020-04-15T02:45:06.260Z'),
            type: 'ORDER_TYPE_BUY',
            volume: 0.07
          }],
          deals: [{
            clientId: 'TE_GBPUSD_7hyINWqAlE',
            commission: -0.25,
            entryType: 'DEAL_ENTRY_IN',
            id: '33230099',
            magic: 1000,
            platform: 'mt5',
            orderId: '46214692',
            positionId: '46214692',
            price: 1.26101,
            profit: 0,
            swap: 0,
            symbol: 'GBPUSD',
            time: new Date('2020-04-15T02:45:06.521Z'),
            type: 'DEAL_TYPE_BUY',
            volume: 0.07
          }]
        };

        const account = await api.metatraderAccountApi.getAccount('accountId');
        connection = account.getStreamingConnection();
        await connection.connect();
        clock.tickAsync(5000); 
        await connection.waitSynchronized({timeoutInSeconds: 10});
        server.emit('synchronization', Object.assign({type: 'update', accountId: 'accountId',
          instanceIndex: 0,
          host: 'ps-mpa-0'}, update));
        await clock.tickAsync(5000);
        sinon.assert.match(connection.terminalState.orders, ordersUpdate);
        sinon.assert.match(connection.terminalState.positions, positionsUpdate);
        sinon.assert.match(connection.terminalState.specifications, [{
          maxVolume: 200,
          minVolume: 0.01,
          symbol: 'EURUSD',
          tickSize: 0.00001,
          volumeStep: 0.01
        }]);

        let update2 = {
          updatedPositions: [
            {
              id: '46214693',
              type: 'POSITION_TYPE_BUY',
              symbol: 'EURUSD',
              magic: 1000,
              time: new Date('2020-04-15T02:45:06.521Z'),
              updateTime: new Date('2020-04-15T02:45:06.521Z'),
              openPrice: 1.26101,
              currentPrice: 1.24883,
              currentTickValue: 1,
              volume: 0.07,
              swap: 0,
              profit: -85.25999999999966,
              commission: -0.25,
              clientId: 'TE_GBPUSD_7hyINWqAlE',
              stopLoss: 1.18,
              unrealizedProfit: -85.25999999999901,
              realizedProfit: -6.536993168992922e-13
            }, {
              id: '46214695',
              type: 'POSITION_TYPE_BUY',
              symbol: 'BTCUSD',
              magic: 1000,
              time: new Date('2020-04-15T02:45:06.521Z'),
              updateTime: new Date('2020-04-15T02:45:06.521Z'),
              openPrice: 1.26101,
              currentPrice: 1.24883,
              currentTickValue: 1,
              volume: 0.07,
              swap: 0,
              profit: -85.25999999999966,
              commission: -0.25,
              clientId: 'TE_GBPUSD_7hyINWqAlE',
              stopLoss: 1.17721,
              unrealizedProfit: -85.25999999999901,
              realizedProfit: -6.536993168992922e-13
            }],
          removedPositionIds: ['46214694'],
          updatedOrders: [{
            id: '46871285',
            type: 'ORDER_TYPE_BUY_LIMIT',
            state: 'ORDER_STATE_PLACED',
            symbol: 'EURUSD',
            magic: 123456,
            platform: 'mt5',
            time: new Date('2020-04-20T08:38:58.270Z'),
            openPrice: 1.03,
            currentPrice: 1.05206,
            volume: 0.5,
            currentVolume: 0.01,
            comment: 'COMMENT2'
          }, {
            id: '46871287',
            type: 'ORDER_TYPE_BUY_LIMIT',
            state: 'ORDER_STATE_PLACED',
            symbol: 'XAUUSD',
            magic: 123456,
            platform: 'mt5',
            time: new Date('2020-04-20T08:38:58.270Z'),
            openPrice: 1.03,
            currentPrice: 1.05206,
            volume: 0.01,
            currentVolume: 0.01,
            comment: 'COMMENT2'
          }],
          completedOrderIds: ['46871286'],
          specifications: [{
            maxVolume: 200,
            minVolume: 0.01,
            symbol: 'EURUSD',
            tickSize: 0.01,
            volumeStep: 0.01
          }]
        };
        server.emit('synchronization', Object.assign({type: 'update', accountId: 'accountId',
          instanceIndex: 0,
          host: 'ps-mpa-0'}, update2));
        await clock.tickAsync(5000);

        sinon.assert.match(connection.terminalState.orders, [{
          id: '46871284',
          type: 'ORDER_TYPE_BUY_LIMIT',
          state: 'ORDER_STATE_PLACED',
          symbol: 'AUDNZD',
          magic: 123456,
          platform: 'mt5',
          time: new Date('2020-04-20T08:38:58.270Z'),
          openPrice: 1.03,
          currentPrice: 1.05206,
          volume: 0.01,
          currentVolume: 0.01,
          comment: 'COMMENT2'
        }, {
          id: '46871285',
          type: 'ORDER_TYPE_BUY_LIMIT',
          state: 'ORDER_STATE_PLACED',
          symbol: 'EURUSD',
          magic: 123456,
          platform: 'mt5',
          time: new Date('2020-04-20T08:38:58.270Z'),
          openPrice: 1.03,
          currentPrice: 1.05206,
          volume: 0.5,
          currentVolume: 0.01,
          comment: 'COMMENT2'
        }, {
          id: '46871287',
          type: 'ORDER_TYPE_BUY_LIMIT',
          state: 'ORDER_STATE_PLACED',
          symbol: 'XAUUSD',
          magic: 123456,
          platform: 'mt5',
          time: new Date('2020-04-20T08:38:58.270Z'),
          openPrice: 1.03,
          currentPrice: 1.05206,
          volume: 0.01,
          currentVolume: 0.01,
          comment: 'COMMENT2'
        }]);

        sinon.assert.match(connection.terminalState.positions, [{
          id: '46214692',
          type: 'POSITION_TYPE_BUY',
          symbol: 'GBPUSD',
          magic: 1000,
          time: new Date('2020-04-15T02:45:06.521Z'),
          updateTime: new Date('2020-04-15T02:45:06.521Z'),
          openPrice: 1.26101,
          currentPrice: 1.24883,
          currentTickValue: 1,
          volume: 0.07,
          swap: 0,
          profit: -85.25999999999966,
          commission: -0.25,
          clientId: 'TE_GBPUSD_7hyINWqAlE',
          stopLoss: 1.17721,
          unrealizedProfit: -85.25999999999901,
          realizedProfit: -6.536993168992922e-13
        },
        {
          id: '46214693',
          type: 'POSITION_TYPE_BUY',
          symbol: 'EURUSD',
          magic: 1000,
          time: new Date('2020-04-15T02:45:06.521Z'),
          updateTime: new Date('2020-04-15T02:45:06.521Z'),
          openPrice: 1.26101,
          currentPrice: 1.24883,
          currentTickValue: 1,
          volume: 0.07,
          swap: 0,
          profit: -85.25999999999966,
          commission: -0.25,
          clientId: 'TE_GBPUSD_7hyINWqAlE',
          stopLoss: 1.18,
          unrealizedProfit: -85.25999999999901,
          realizedProfit: -6.536993168992922e-13
        }, {
          id: '46214695',
          type: 'POSITION_TYPE_BUY',
          symbol: 'BTCUSD',
          magic: 1000,
          time: new Date('2020-04-15T02:45:06.521Z'),
          updateTime: new Date('2020-04-15T02:45:06.521Z'),
          openPrice: 1.26101,
          currentPrice: 1.24883,
          currentTickValue: 1,
          volume: 0.07,
          swap: 0,
          profit: -85.25999999999966,
          commission: -0.25,
          clientId: 'TE_GBPUSD_7hyINWqAlE',
          stopLoss: 1.17721,
          unrealizedProfit: -85.25999999999901,
          realizedProfit: -6.536993168992922e-13
        }]);

      }).timeout(10000);

    });

    describe('specifications sync', () => {
      
      it('should synchronize two accounts with similar server names and same data', async () => {
        api.metatraderAccountApi._metatraderAccountClient.getAccount = (accountId) => ({
          _id:  accountId,
          login: '50194988',
          name: 'mt5a',
          region: 'vint-hill',
          reliability: 'regular',
          server: 'ICMarketsSC-Demo' + accountId.slice(9),
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'DISCONNECTED',
          state: 'DEPLOYED',
          type: 'cloud-g1',
          accessToken: '2RUnoH1ldGbnEneCoqRTgI4QO1XOmVzbH5EVoQsA'
        });
        const account = await api.metatraderAccountApi.getAccount('accountId');
        const account2 = await api.metatraderAccountApi.getAccount('accountId2');
        connection = account.getStreamingConnection();
        await connection.connect();
        clock.tickAsync(5000); 
        await connection.waitSynchronized({timeoutInSeconds: 10});
        const response = connection.terminalState.accountInformation;
        sinon.assert.match(response, accountInformation);
        (connection.synchronized && connection.terminalState.connected 
        && connection.terminalState.connectedToBroker).should.equal(true);
        sinon.assert.match(connection.terminalState.specifications, defaultSpecifications);
        const connection2 = account2.getStreamingConnection();
        await connection2.connect();
        clock.tickAsync(5000); 
        await connection2.waitSynchronized({timeoutInSeconds: 10});
        sinon.assert.match(connection2.terminalState.specifications, defaultSpecifications);
      });

      it('should synchronize two accounts with different specs and same server name', async () => {
        const specifications2 = [{
          symbol: 'AUDUSD',
          tickSize: 0.00001,
          minVolume: 0.01,
          maxVolume: 200,
          volumeStep: 0.01
        }];
        fakeServer.io.removeAllListeners('connect');
        fakeServer.io.on('connect', socket => {
          server = socket;
          socket.emit('response', {type: 'response'});
          socket.removeAllListeners('request');
          // eslint-disable-next-line complexity
          socket.on('request', async data => {
            if(data.instanceIndex === 1) {
              await fakeServer.respond(socket, data);
              return;
            }
            if(data.type === 'subscribe') {
              await new Promise(res => setTimeout(res, 200)); 
              await fakeServer.respond(socket, data);
              fakeServer.statusTasks[data.accountId] = 
                setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
              await new Promise(res => setTimeout(res, 50)); 
              await fakeServer.authenticate(socket, data);
            } else if (data.type === 'synchronize') {
              await fakeServer.respond(socket, data);
              if(data.accountId === 'accountId2') {
                await fakeServer.syncAccount(socket, data, undefined, {specifications: specifications2});
              } else {
                await fakeServer.syncAccount(socket, data);
              }
            } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
              await fakeServer.respond(socket, data);
            } else if (data.type === 'getAccountInformation') {
              await fakeServer.respondAccountInformation(socket, data);
            } else if (data.type === 'unsubscribe') {
              fakeServer.deleteStatusTask(data.accountId);
              await fakeServer.respond(socket, data);
            }
          });
        });
        const account = await api.metatraderAccountApi.getAccount('accountId');
        const account2 = await api.metatraderAccountApi.getAccount('accountId2');
        connection = account.getStreamingConnection();
        await connection.connect();
        clock.tickAsync(5000); 
        await connection.waitSynchronized({timeoutInSeconds: 10});
        const response = connection.terminalState.accountInformation;
        sinon.assert.match(response, accountInformation);
        (connection.synchronized && connection.terminalState.connected 
        && connection.terminalState.connectedToBroker).should.equal(true);
        sinon.assert.match(connection.terminalState.specifications, defaultSpecifications);
        const connection2 = account2.getStreamingConnection();
        await connection2.connect();
        clock.tickAsync(5000); 
        await connection2.waitSynchronized({timeoutInSeconds: 10});
        sinon.assert.match(connection2.terminalState.specifications, specifications2);
      });

      it('should synchronize two accounts with different specs and different server names', async () => {
        const specifications2 = [{
          symbol: 'AUDUSD',
          tickSize: 0.00001,
          minVolume: 0.01,
          maxVolume: 200,
          volumeStep: 0.01
        }];
        api.metatraderAccountApi._metatraderAccountClient.getAccount = (accountId) => ({
          _id:  accountId,
          login: '50194988',
          name: 'mt5a',
          region: 'vint-hill',
          reliability: 'regular',
          server: accountId === 'accountId' ? 'ICMarketsSC-Demo' : 'Tradeview-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'DISCONNECTED',
          state: 'DEPLOYED',
          type: 'cloud-g1',
          accessToken: '2RUnoH1ldGbnEneCoqRTgI4QO1XOmVzbH5EVoQsA'
        });
        fakeServer.io.removeAllListeners('connect');
        fakeServer.io.on('connect', socket => {
          server = socket;
          socket.emit('response', {type: 'response'});
          socket.removeAllListeners('request');
          // eslint-disable-next-line complexity
          socket.on('request', async data => {
            if(data.instanceIndex === 1) {
              await fakeServer.respond(socket, data);
              return;
            }
            if(data.type === 'subscribe') {
              await new Promise(res => setTimeout(res, 200)); 
              await fakeServer.respond(socket, data);
              fakeServer.statusTasks[data.accountId] = 
                setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
              await new Promise(res => setTimeout(res, 50)); 
              await fakeServer.authenticate(socket, data);
            } else if (data.type === 'synchronize') {
              await fakeServer.respond(socket, data);
              if(data.accountId === 'accountId2') {
                await fakeServer.syncAccount(socket, data, undefined, {specifications: specifications2});
              } else {
                await fakeServer.syncAccount(socket, data);
              }
            } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
              await fakeServer.respond(socket, data);
            } else if (data.type === 'getAccountInformation') {
              await fakeServer.respondAccountInformation(socket, data);
            } else if (data.type === 'unsubscribe') {
              fakeServer.deleteStatusTask(data.accountId);
              await fakeServer.respond(socket, data);
            }
          });
        });
        const account = await api.metatraderAccountApi.getAccount('accountId');
        const account2 = await api.metatraderAccountApi.getAccount('accountId2');
        connection = account.getStreamingConnection();
        await connection.connect();
        clock.tickAsync(5000); 
        await connection.waitSynchronized({timeoutInSeconds: 10});
        const response = connection.terminalState.accountInformation;
        sinon.assert.match(response, accountInformation);
        (connection.synchronized && connection.terminalState.connected 
        && connection.terminalState.connectedToBroker).should.equal(true);
        sinon.assert.match(connection.terminalState.specifications, defaultSpecifications);
        const connection2 = account2.getStreamingConnection();
        await connection2.connect();
        clock.tickAsync(5000); 
        await connection2.waitSynchronized({timeoutInSeconds: 10});
        sinon.assert.match(connection2.terminalState.specifications, specifications2);
      });

    });

    // eslint-disable-next-line complexity, max-statements
    it('should handle random socket events', async () => {
      const account = await api.metatraderAccountApi.getAccount('accountId');
      connection = account.getStreamingConnection();
      await connection.connect();
      clock.tickAsync(5000);
      await connection.waitSynchronized({timeoutInSeconds: 10}); 
      const eventCount = 100;
      const accountId = 'accountId';
      const eventLog = [];
      const historyStorage = {
        deals: connection.historyStorage.deals,
        historyOrders: connection.historyStorage.historyOrders
      };
      const states = {
        combined: {
          connected: false,
          accountInformation: accountInformation,
          positions: defaultPositions.slice(0),
          orders: defaultOrders.slice(0),
          specifications: defaultSpecifications.slice(0)
        },
        'vint-hill:0:ps-mpa-0': {
          connected: true,
          synced: true,
          positions: defaultPositions.slice(0),
          orders: defaultOrders.slice(0),
          specifications: defaultSpecifications.slice(0)
        }
      };
      for(let k = 0; k < eventCount; k++) {
        const synchronizationId = 'ABC';
        const number = Math.floor(random() * 10);
        const instanceIndexNumber = Math.floor(random() * 5);
        const host = 'ps-mpa-' + instanceIndexNumber;
        const instanceIndex = `vint-hill:0:${host}`;
        if(!states[instanceIndex]) {
          states[instanceIndex] = {
            connected: false,
            synced: false,
          };
        }
        let accountInfo = {
          broker: 'True ECN Trading Ltd',
          currency: 'USD',
          server: 'ICMarketsSC-Demo',
          balance: Math.floor(random() * 4500),
          equity: 7306.649913200001,
          margin: 184.1,
          freeMargin: 7120.22,
          leverage: 100,
          marginLevel: 3967.58283542
        };
        const randomId = (1000000 + Math.floor(random() * 1000000)).toString();
        const deals = [{
          clientId: 'TE_GBPUSD_7hyINWqAlE',
          commission: -0.25,
          entryType: 'DEAL_ENTRY_IN',
          id: randomId,
          magic: Math.floor(random() * 1000),
          platform: 'mt5',
          orderId: '46214692',
          positionId: '46214692',
          price: 1.26101,
          profit: 0,
          swap: 0,
          symbol: 'GBPUSD',
          time: new Date('2020-04-15T02:45:06.521Z'),
          type: 'DEAL_TYPE_BUY',
          volume: 0.07
        }];
        const historyOrders = [{
          clientId: 'TE_GBPUSD_7hyINWqAlE',
          currentPrice: 1.261,
          currentVolume: 0,
          doneTime: new Date('2020-04-15T02:45:06.521Z'),
          id: randomId,
          magic: Math.floor(random() * 1000),
          platform: 'mt5',
          positionId: '46214692',
          state: 'ORDER_STATE_FILLED',
          symbol: 'GBPUSD',
          time: new Date('2020-04-15T02:45:06.260Z'),
          type: 'ORDER_TYPE_BUY',
          volume: 0.07
        }];
        let specifications = [{
          symbol: 'EURUSD',
          tickSize: 0.00001,
          minVolume: 0.01,
          maxVolume: Math.floor(random() * 1000),
          volumeStep: 0.01
        }];
        const prices = [{
          symbol: 'EURUSD',
          time: new Date(),
          bid: random() * 2,
          ask: random() * 2 - 0.1,
          profitTickValue: 0.602,
          lossTickValue: 0.60203
        }];
        const positions = [{
          id: randomId,
          type: 'POSITION_TYPE_BUY',
          symbol: 'GBPUSD',
          magic: 1000,
          time: new Date('2020-04-15T02:45:06.521Z'),
          updateTime: new Date('2020-04-15T02:45:06.521Z'),
          openPrice: 1.26101,
          currentPrice: 1.24883,
          currentTickValue: 1,
          volume: 0.07,
          swap: 0,
          profit: -85.25999999999966,
          commission: -0.25,
          clientId: 'TE_GBPUSD_7hyINWqAlE',
          stopLoss: 1.17721,
          unrealizedProfit: -85.25999999999901,
          realizedProfit: -6.536993168992922e-13
        }];
        const orders = [{
          id: randomId,
          type: 'ORDER_TYPE_BUY_LIMIT',
          state: 'ORDER_STATE_PLACED',
          symbol: 'AUDNZD',
          magic: Math.floor(random() * 1000),
          platform: 'mt5',
          time: new Date('2020-04-20T08:38:58.270Z'),
          openPrice: 1.03,
          currentPrice: 1.05206,
          volume: 0.01,
          currentVolume: 0.01,
          comment: 'COMMENT2'
        }];
        let update = {
          updatedPositions: positions,
          updatedOrders: orders
        };
        const equity = Math.floor(random() * 1000);
        const freeMargin = Math.floor(random() * 1000);
        const marginLevel = Math.floor(random() * 1000);
        const margin = Math.floor(random() * 1000);
        switch(number) {
        case 0:
          eventLog.push(`accountInformation:${instanceIndex}`);
          server.emit('synchronization', {type: 'accountInformation', accountId, accountInformation: accountInfo,
            instanceIndex: 0, host});
          await new Promise(res => setTimeout(res, 200));
          states.combined.accountInformation = accountInfo;
          break;
        case 1:
          syncHost = host;
          eventLog.push(`authenticated:${instanceIndex}`);
          server.emit('synchronization', {type: 'authenticated', accountId,
            instanceIndex: 0, replicas: 1, host});
          await new Promise(res => setTimeout(res, 1000));
          states[instanceIndex].connected = true;
          states[instanceIndex].synced = true;
          states.combined.accountInformation = accountInformation;
          states.combined.orders = defaultOrders.slice(0);
          states.combined.positions = defaultPositions.slice(0);
          states.combined.specifications = defaultSpecifications.slice(0);
          syncHost = 'ps-mpa-0';
          break;
        case 2:
          eventLog.push(`deals:${instanceIndex}`);
          server.emit('synchronization', {type: 'deals', accountId, deals, instanceIndex: 0, host});
          await new Promise(res => setTimeout(res, 200));
          historyStorage.deals.push(deals[0]);
          historyStorage.deals.sort((a, b) => a.id - b.id);
          break;
        case 3:
          eventLog.push(`deals:${instanceIndex}`);
          server.emit('synchronization', {type: 'historyOrders', accountId, historyOrders, instanceIndex: 0, host});
          await new Promise(res => setTimeout(res, 200));
          historyStorage.historyOrders.push(historyOrders[0]);
          historyStorage.historyOrders.sort((a, b) => a.id - b.id);
          break;
        case 4:
          eventLog.push(`dealSynchronizationFinished:${instanceIndex}`);
          server.emit('synchronization', {type: 'dealSynchronizationFinished', accountId, host,
            instanceIndex: 0, synchronizationId});
          break;
        case 5:
          eventLog.push(`orderSynchronizationFinished:${instanceIndex}`);
          server.emit('synchronization', {type: 'orderSynchronizationFinished', accountId, host,
            instanceIndex: 0, synchronizationId});
          break;
        case 6:
          eventLog.push(`downgradeSubscription:${instanceIndex}`);
          server.emit('synchronization', {type: 'downgradeSubscription', accountId, host,
            instanceIndex: 0, symbol: 'EURUSD', unsubscriptions: [{type: 'ticks'}, {type: 'books'}]});
          break;
        case 7:
          eventLog.push(`specifications:${instanceIndex}`);
          server.emit('synchronization',
            {type: 'specifications', accountId, specifications, instanceIndex: 0, host,
              removedSymbols: []});
          await new Promise(res => setTimeout(res, 200));
          if(states[instanceIndex].synced) {
            states.combined.specifications = specifications;
          }
          break;
        case 8:
          eventLog.push(`prices:${instanceIndex}`);
          server.emit('synchronization', {type: 'prices', accountId, host, prices,
            equity, margin, freeMargin, marginLevel, instanceIndex: 0});
          await new Promise(res => setTimeout(res, 200));
          states.combined.accountInformation.equity = equity;
          states.combined.accountInformation.margin = margin;
          states.combined.accountInformation.freeMargin = freeMargin;
          states.combined.accountInformation.marginLevel = marginLevel;
          break;  
        case 9:
          eventLog.push(`update:${instanceIndex}`);
          server.emit('synchronization', Object.assign({type: 'update', accountId, instanceIndex: 0, host},
            update));
          await new Promise(res => setTimeout(res, 200));
          if(states[instanceIndex].synced) {
            states.combined.positions.push(update.updatedPositions[0]);
            states.combined.orders.push(update.updatedOrders[0]);
            states.combined.positions.sort((a, b) => a.id - b.id);
            states.combined.orders.sort((a, b) => a.id - b.id);
          }
          break;  
        }
        try {
          sinon.assert.match(connection.terminalState.specifications, states.combined.specifications);
          sinon.assert.match(connection.terminalState.accountInformation, states.combined.accountInformation);
          sinon.assert.match(connection.terminalState.positions, states.combined.positions);
          sinon.assert.match(connection.terminalState.orders, states.combined.orders);
          sinon.assert.match(connection.historyStorage.deals, historyStorage.deals);
          sinon.assert.match(connection.historyStorage.historyOrders, historyStorage.historyOrders);
        } catch (error) {
          console.log(eventLog.slice(-50), error);
          throw error;
        }
      }
    }).timeout(120000);

    describe('Region replica support', () => {

      beforeEach(() => {
        api.metatraderAccountApi._metatraderAccountClient.getAccount = (accountId) => ({
          _id:  accountId,
          login: '50194988',
          name: 'mt5a',
          region: 'vint-hill',
          reliability: 'regular',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud',
          accessToken: '2RUnoH1ldGbnEneCoqRTgI4QO1XOmVzbH5EVoQsA',
          accountReplicas: [
            {
              '_id': 'accountIdReplica',
              'quoteStreamingIntervalInSeconds': 2.5,
              'region': 'new-york',
              'magic': 0,
              'symbol': 'EURUSD',
              'copyFactoryResourceSlots': 1,
              'resourceSlots': 1,
              'extensions': [],
              'tags': [],
              'state': 'DEPLOYED',
              'connectionStatus': 'CONNECTED',
              'reliability': 'regular'
            }
          ],
        });
      });

      it('should synchronize account', async () => {
        const account = await api.metatraderAccountApi.getAccount('accountId');
        connection = account.getStreamingConnection();
        await connection.connect();
        clock.tickAsync(5000); 
        await connection.waitSynchronized({timeoutInSeconds: 10});
        const response = connection.terminalState.accountInformation;
        sinon.assert.match(response, accountInformation);
        (connection.synchronized && connection.terminalState.connected 
        && connection.terminalState.connectedToBroker).should.equal(true);
      }).timeout(10000);

      it('should synchronize using a replica', async () => {
        let calledAccountId;

        const account = await api.metatraderAccountApi.getAccount('accountId');
        fakeServer.io.removeAllListeners('connect');
        fakeServer.io.on('connect', socket => {
          server = socket;
          socket.emit('response', {type: 'response'});
          socket.removeAllListeners('request');
          // eslint-disable-next-line complexity
          socket.on('request', async data => {
            if(data.instanceIndex === 1) {
              await fakeServer.respond(socket, data);
              return;
            }
            if(data.type === 'subscribe') {
              await new Promise(res => setTimeout(res, 200)); 
              await fakeServer.respond(socket, data);
              fakeServer.statusTasks[data.accountId] = 
                setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
              await new Promise(res => setTimeout(res, 50)); 
              await fakeServer.authenticate(socket, data);
            } else if (data.type === 'synchronize') {
              await fakeServer.respond(socket, data);
              await fakeServer.syncAccount(socket, data);
            } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
              calledAccountId = data.accountId;
              await fakeServer.respond(socket, data);
            } else if (data.type === 'getAccountInformation') {
              await fakeServer.respondAccountInformation(socket, data);
            } else if (data.type === 'unsubscribe') {
              fakeServer.deleteStatusTask(data.accountId);
              await fakeServer.respond(socket, data);
            }
          });
        });
        
        connection = account.getStreamingConnection();
        connection._websocketClient._latencyService._latencyCache = {'vint-hill': 500, 'new-york': 100};
        await connection.connect();
        clock.tickAsync(5000); 
        await connection.waitSynchronized({timeoutInSeconds: 10});
        const response = connection.terminalState.accountInformation;
        sinon.assert.match(response, accountInformation);
        sinon.assert.match(calledAccountId, 'accountIdReplica');
        (connection.synchronized && connection.terminalState.connected 
        && connection.terminalState.connectedToBroker).should.equal(true);
      }).timeout(10000);

      it('should resynchronize if used account was undeployed, then return when redeployed', async () => {
        let calledAccountId;
        let unsubscribedAccountId;
        const allowedAccounts = ['accountId', 'accountIdReplica'];

        const account = await api.metatraderAccountApi.getAccount('accountId');
        fakeServer.io.removeAllListeners('connect');
        fakeServer.io.on('connect', socket => {
          server = socket;
          socket.emit('response', {type: 'response'});
          socket.removeAllListeners('request');
          // eslint-disable-next-line complexity
          socket.on('request', async data => {
            if(data.instanceIndex === 1) {
              await fakeServer.respond(socket, data);
              return;
            }
            if(!allowedAccounts.includes(data.accountId)) {
              return;
            }
            if(data.type === 'subscribe') {
              await new Promise(res => setTimeout(res, 200)); 
              await fakeServer.respond(socket, data);
              fakeServer.statusTasks[data.accountId] = 
                setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
              await new Promise(res => setTimeout(res, 50)); 
              await fakeServer.authenticate(socket, data);
            } else if (data.type === 'synchronize') {
              calledAccountId = data.accountId;
              await fakeServer.respond(socket, data);
              await fakeServer.syncAccount(socket, data);
            } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
              calledAccountId = data.accountId;
              await fakeServer.respond(socket, data);
            } else if (data.type === 'getAccountInformation') {
              await fakeServer.respondAccountInformation(socket, data);
            } else if (data.type === 'unsubscribe') {
              unsubscribedAccountId = data.accountId;
              fakeServer.deleteStatusTask(data.accountId);
              await fakeServer.respond(socket, data);
            }
          });
        });
        
        connection = account.getStreamingConnection();
        connection._websocketClient._latencyService._latencyCache = {'vint-hill': 500, 'new-york': 100};
        await connection.connect();
        clock.tickAsync(5000); 
        await connection.waitSynchronized({timeoutInSeconds: 10});
        const response = connection.terminalState.accountInformation;
        sinon.assert.match(response, accountInformation);
        sinon.assert.match(calledAccountId, 'accountIdReplica');
        sinon.assert.match(unsubscribedAccountId, 'accountId');
        (connection.synchronized && connection.terminalState.connected 
          && connection.terminalState.connectedToBroker).should.equal(true);
        allowedAccounts.splice(1, 1);
        fakeServer.deleteStatusTask('accountIdReplica');
        await clock.tickAsync(61000);
        await new Promise(res => setTimeout(res, 50));
        sinon.assert.match(calledAccountId, 'accountId');
        sinon.assert.match(unsubscribedAccountId, 'accountId');
        (connection.synchronized && connection.terminalState.connected 
          && connection.terminalState.connectedToBroker).should.equal(true);
        allowedAccounts.splice(1, 1, 'accountIdReplica');
        await fakeServer.emitStatus(server, 'accountIdReplica');
        await clock.tickAsync(5000);
        await new Promise(res => setTimeout(res, 50));
        sinon.assert.match(calledAccountId, 'accountIdReplica');
        sinon.assert.match(unsubscribedAccountId, 'accountId');
        (connection.synchronized && connection.terminalState.connected 
        && connection.terminalState.connectedToBroker).should.equal(true);
      }).timeout(10000);

      it('should change replica if region priority changed', async () => {
        let calledAccountId;
        let unsubscribedAccountId;

        const account = await api.metatraderAccountApi.getAccount('accountId');
        fakeServer.io.removeAllListeners('connect');
        fakeServer.io.on('connect', socket => {
          server = socket;
          socket.emit('response', {type: 'response'});
          socket.removeAllListeners('request');
          // eslint-disable-next-line complexity
          socket.on('request', async data => {
            if(data.instanceIndex === 1) {
              await fakeServer.respond(socket, data);
              return;
            }
            if(data.type === 'subscribe') {
              await new Promise(res => setTimeout(res, 200)); 
              await fakeServer.respond(socket, data);
              fakeServer.statusTasks[data.accountId] = 
                setInterval(() => fakeServer.emitStatus(socket, data.accountId), 100);
              await new Promise(res => setTimeout(res, 50)); 
              await fakeServer.authenticate(socket, data);
            } else if (data.type === 'synchronize') {
              calledAccountId = data.accountId;
              await fakeServer.respond(socket, data);
              await fakeServer.syncAccount(socket, data);
            } else if (data.type === 'waitSynchronized' || data.type === 'refreshMarketDataSubscriptions') {
              calledAccountId = data.accountId;
              await fakeServer.respond(socket, data);
            } else if (data.type === 'getAccountInformation') {
              await fakeServer.respondAccountInformation(socket, data);
            } else if (data.type === 'unsubscribe') {
              unsubscribedAccountId = data.accountId;
              fakeServer.deleteStatusTask(data.accountId);
              await fakeServer.respond(socket, data);
            }
          });
        });
        
        connection = account.getStreamingConnection();
        sandbox.stub(connection._websocketClient._latencyService, '_refreshLatency').resolves();
        connection._websocketClient._latencyService._latencyCache = {'vint-hill': 500, 'new-york': 100};
        await connection.connect();
        clock.tickAsync(5000); 
        await connection.waitSynchronized({timeoutInSeconds: 10});
        const response = connection.terminalState.accountInformation;
        sinon.assert.match(response, accountInformation);
        sinon.assert.match(calledAccountId, 'accountIdReplica');
        sinon.assert.match(unsubscribedAccountId, 'accountId');
        (connection.synchronized && connection.terminalState.connected 
          && connection.terminalState.connectedToBroker).should.equal(true);
        connection._websocketClient._latencyService._latencyCache = {'vint-hill': 100, 'new-york': 500};
        await clock.tickAsync(15 * 60 * 1000 + 5000); 
        sinon.assert.match(calledAccountId, 'accountId');
        sinon.assert.match(unsubscribedAccountId, 'accountIdReplica');
        (connection.synchronized && connection.terminalState.connected 
        && connection.terminalState.connectedToBroker).should.equal(true);
      }).timeout(20000);

    });

  });
});
