'use strict';

import should from 'should';
import sinon from 'sinon';
import StreamingMetaApiConnection from './streamingMetaApiConnection';
import StreamingMetaApiConnectionInstance from './streamingMetaApiConnectionInstance';
import RpcMetaApiConnectionInstance from './rpcMetaApiConnectionInstance';
import ConnectionRegistry from './connectionRegistry';

/**
 * @test {ConnectionRegistry}
 */
describe('ConnectionRegistry', () => {

  let sandbox;
  let registry;
  let metaApiWebsocketClient = {
    addSynchronizationListener: () => {},
    addReconnectListener: () => {},
    subscribe: () => {},
    regionsByAccounts: {},
    unsubscribe: () => {}
  };
  let storage = {
    lastHistoryOrderTime: () => new Date('2020-01-01T00:00:00.000Z'),
    lastDealTime: () => new Date('2020-01-02T00:00:00.000Z'),
    loadDataFromDisk: () => ({deals: [], historyOrders: []})
  };
  let unsubscribeStub;

  before(() => {
    sandbox = sinon.createSandbox();
  });
  
  beforeEach(() => {
    registry = new ConnectionRegistry(metaApiWebsocketClient);
    sandbox.stub(StreamingMetaApiConnection.prototype, 'initialize').resolves();
    sandbox.stub(StreamingMetaApiConnection.prototype, 'subscribe').resolves();
    unsubscribeStub = sandbox.stub(metaApiWebsocketClient, 'unsubscribe').resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {ConnectionRegistry#connectStreaming}
   */
  it('should create streaming connection', async () => {
    let account = {id: 'id', region: 'vint-hill', accountRegions: {'vint-hill': 'id', 'new-york': 'idReplica'}};
    let connection = registry.connectStreaming(account, storage);
    await connection.connect();
    (connection instanceof StreamingMetaApiConnectionInstance).should.be.true();
    sinon.assert.match(registry._streamingConnections, sinon.match.has('id', connection._metaApiConnection));
  });

  /**
   * @test {ConnectionRegistry#removeStreaming}
   */
  it('should disconnect streaming connection', async () => {
    let account = {id: 'id', region: 'vint-hill', accountRegions: {'vint-hill': 'id', 'new-york': 'idReplica'}};
    registry.connectStreaming(account, storage);
    await registry.removeStreaming(account);
    sinon.assert.calledWith(unsubscribeStub, 'id');
    sinon.assert.calledWith(unsubscribeStub, 'idReplica');
  });

  /**
   * @test {ConnectionRegistry#removeStreaming}
   */
  it('should not disconnect until both streaming and rpc connections are closed', async () => {
    let account = {id: 'id', region: 'vint-hill', accountRegions: {'vint-hill': 'id', 'new-york': 'idReplica'}};
    registry.connectStreaming(account, storage);
    registry.connectStreaming(account, storage);
    registry.connectRpc(account);
    await registry.removeStreaming(account);
    sinon.assert.notCalled(unsubscribeStub);
    await registry.removeStreaming(account);
    sinon.assert.notCalled(unsubscribeStub);
    await registry.removeRpc(account);
    sinon.assert.calledWith(unsubscribeStub, 'id');
    sinon.assert.calledWith(unsubscribeStub, 'idReplica');
  });

  /**
   * @test {ConnectionRegistry#connectRpc}
   */
  it('should create rpc connection', async () => {
    let account = {id: 'id', region: 'vint-hill', accountRegions: {'vint-hill': 'id', 'new-york': 'idReplica'}};
    let connection = registry.connectRpc(account);
    (connection instanceof RpcMetaApiConnectionInstance).should.be.true();
    sinon.assert.match(registry._rpcConnections, sinon.match.has('id', connection._metaApiConnection));
  });

  /**
   * @test {ConnectionRegistry#removeRpc}
   */
  it('should disconnect rpc connection', async () => {
    let account = {id: 'id', region: 'vint-hill', accountRegions: {'vint-hill': 'id', 'new-york': 'idReplica'}};
    registry.connectRpc(account, storage);
    await registry.removeRpc(account);
    sinon.assert.calledWith(unsubscribeStub, 'id');
    sinon.assert.calledWith(unsubscribeStub, 'idReplica');
  });

  /**
   * @test {ConnectionRegistry#removeRpc}
   */
  it('should not disconnect until both rpc and streaming connections are closed', async () => {
    let account = {id: 'id', region: 'vint-hill', accountRegions: {'vint-hill': 'id', 'new-york': 'idReplica'}};
    registry.connectRpc(account);
    registry.connectRpc(account);
    registry.connectStreaming(account);
    await registry.removeRpc(account);
    sinon.assert.notCalled(unsubscribeStub);
    await registry.removeRpc(account);
    sinon.assert.notCalled(unsubscribeStub);
    await registry.removeStreaming(account);
    sinon.assert.calledWith(unsubscribeStub, 'id');
    sinon.assert.calledWith(unsubscribeStub, 'idReplica');
  });

});
