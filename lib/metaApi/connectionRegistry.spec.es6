'use strict';

import should from 'should';
import sinon from 'sinon';
import MetaApiConnection from './metaApiConnection';
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
    subscribe: () => {}
  };
  let storage = {
    lastHistoryOrderTime: () => new Date('2020-01-01T00:00:00.000Z'),
    lastDealTime: () => new Date('2020-01-02T00:00:00.000Z'),
    loadDataFromDisk: () => ({deals: [], historyOrders: []})
  };

  before(() => {
    registry = new ConnectionRegistry(metaApiWebsocketClient);
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    sandbox.stub(metaApiWebsocketClient, 'addSynchronizationListener').returns();
    sandbox.stub(metaApiWebsocketClient, 'subscribe').resolves();
    sandbox.stub(MetaApiConnection.prototype, 'initialize').resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {ConnectionRegistry#connect}
   */
  it('should connect and add connection to registry', async () => {
    let account = {id: 'id'};
    let connection = await registry.connect(account, storage);
    (connection instanceof MetaApiConnection).should.be.true();
    connection.historyStorage.should.equal(storage);
    sinon.assert.calledWith(metaApiWebsocketClient.addSynchronizationListener, 'id', storage);
    sinon.assert.calledWith(metaApiWebsocketClient.subscribe, 'id');
    sinon.assert.calledOnce(connection.initialize);
    sinon.assert.match(registry._connections, sinon.match.has('id', connection));
  });

  /**
   * @test {ConnectionRegistry#connect}
   */
  it('should return the same connection on second connect if same account id', async () => {
    let accounts = [{id: 'id0'}, {id: 'id1'}];
    let connection0 = await registry.connect(accounts[0], storage);
    let connection02 = await registry.connect(accounts[0], storage);
    let connection1 = await registry.connect(accounts[1], storage);
    sinon.assert.calledWith(metaApiWebsocketClient.addSynchronizationListener, 'id0', storage);
    sinon.assert.calledWith(metaApiWebsocketClient.addSynchronizationListener, 'id1', storage);
    sinon.assert.calledWith(metaApiWebsocketClient.subscribe, 'id0');
    sinon.assert.calledWith(metaApiWebsocketClient.subscribe, 'id1');
    sinon.assert.calledTwice(metaApiWebsocketClient.subscribe);
    sinon.assert.match(registry._connections, sinon.match.has('id0', connection0));
    sinon.assert.match(registry._connections, sinon.match.has('id1', connection1));
    sinon.assert.match(Object.is(connection0, connection02), true);
  });

  /**
   * @test {ConnectionRegistry#remove}
   */
  it('should remove the account from registry', async () => {
    let accounts = [{id: 'id0'}, {id: 'id1'}];
    let connection0 = await registry.connect(accounts[0], storage);
    let connection1 = await registry.connect(accounts[1], storage);
    sinon.assert.match(registry._connections, sinon.match.has('id0', connection0));
    sinon.assert.match(registry._connections, sinon.match.has('id1', connection1));
    registry.remove(accounts[0].id);
    sinon.assert.match(registry._connections.id0, undefined);
  });

});
