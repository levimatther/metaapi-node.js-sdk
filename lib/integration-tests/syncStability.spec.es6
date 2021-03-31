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

let server;

class FakeServer {
  constructor(){
    this.io;
    this.socket;
    this.statusTask;
  }

  async authenticate(data){
    server.emit('synchronization', {type: 'authenticated', accountId: data.accountId,
      instanceIndex: 0, replicas: 1, host: 'ps-mpa-0'});
  }

  async emitStatus(accountId){
    const packet = {connected: true, authenticated: true, instanceIndex: 0, type: 'status',
      healthStatus: {rpcApiHealthy: true}, replicas: 1, host: 'ps-mpa-0',
      connectionId: accountId, accountId: accountId};
    server.emit('synchronization', packet);
  }

  async respondAccountInformation(data){
    await server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, 
      accountInformation});
  }

  async syncAccount(data){
    server.emit('synchronization', {type: 'synchronizationStarted', accountId: data.accountId, instanceIndex: 0, 
      synchronizationId: data.requestId, host: 'ps-mpa-0'});
    await new Promise(res => setTimeout(res, 50));
    server.emit('synchronization', {type: 'accountInformation', accountId: data.accountId, accountInformation,
      instanceIndex: 0, host: 'ps-mpa-0'});
    await new Promise(res => setTimeout(res, 50));
    server.emit('synchronization',
      {type: 'specifications', accountId: data.accountId, specifications: [], instanceIndex: 0, host: 'ps-mpa-0'});
    await new Promise(res => setTimeout(res, 50));
    server.emit('synchronization', {type: 'orderSynchronizationFinished', accountId: data.accountId,
      synchronizationId: data.requestId, instanceIndex: 0, host: 'ps-mpa-0'});
    await new Promise(res => setTimeout(res, 50));
    server.emit('synchronization', {type: 'dealSynchronizationFinished', accountId: data.accountId,
      synchronizationId: data.requestId, instanceIndex: 0, host: 'ps-mpa-0'});
  }

  async respond(data){
    await server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
  }

  enableSync(){
    server.removeAllListeners('request');
    server.on('request', async data => {
      if(data.type === 'subscribe') {
        await new Promise(res => setTimeout(res, 200)); 
        await this.respond(data);
        this.statusTask = setInterval(() => this.emitStatus(data.accountId), 100);
        await new Promise(res => setTimeout(res, 50)); 
        await this.authenticate(data);
      } else if (data.type === 'synchronize') {
        await this.respond(data);
        await new Promise(res => setTimeout(res, 50)); 
        await this.syncAccount(data);
      } else if (data.type === 'waitSynchronized' || data.type === 'unsubscribe') {
        await this.respond(data);
      } else if (data.type === 'getAccountInformation') {
        await this.respondAccountInformation(data);
      }
    });
  }

  disableSync(){
    server.removeAllListeners('request');
    server.on('request', async data => {
      await this.respond(data);
    });
  }

  async start(){
    this.io = new Server(6785, {path: '/ws', pingTimeout: 1000000});
    this.io.on('connect', socket => {
      server = socket;
      socket.emit('response', {type: 'response'});
      this.enableSync();
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
      requestTimeout: 3, retryOpts: {retries: 3, minDelayInSeconds: 0.1, maxDelayInSeconds: 0.5}});
    sandbox.stub(api.metatraderAccountApi._metatraderAccountClient, 'getAccount').resolves({
      _id: 'accountId',
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
    await api._metaApiWebsocketClient.connect();
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
    await new Promise(res => setTimeout(res, 100));
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
    const response = await connection.getAccountInformation();
    sinon.assert.match(response, accountInformation);
    (connection.synchronized && connection.terminalState.connected 
      && connection.terminalState.connectedToBroker).should.equal(true);
  }).timeout(10000);

  it('should synchronize if subscribe response arrives after synchronization', async () => {
    server.removeAllListeners('request');
    server.on('request', async data => {
      if(data.type === 'subscribe') {
        await new Promise(res => setTimeout(res, 200)); 
        fakeServer.statusTask = setInterval(() => fakeServer.emitStatus(data.accountId), 100);
        await fakeServer.authenticate(data);
        await new Promise(res => setTimeout(res, 400)); 
        await fakeServer.respond(data);
      } else if (data.type === 'synchronize') {
        await fakeServer.respond(data);
        await fakeServer.syncAccount(data);
      } else if (data.type === 'waitSynchronized') {
        await fakeServer.respond(data);
      } else if (data.type === 'getAccountInformation') {
        await fakeServer.respondAccountInformation(data);
      }
    });
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
    fakeServer.enableSync();
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
    fakeServer.enableSync();
    await fakeServer.emitStatus('accountId');
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

});
