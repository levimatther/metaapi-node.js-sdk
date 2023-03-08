'use strict';

import should from 'should';
import sinon from 'sinon';
import StreamingMetaApiConnection from './streamingMetaApiConnection';
import NotSynchronizedError from '../clients/metaApi/notSynchronizedError';
import randomstring from 'randomstring';

/**
 * @test {MetaApiConnection}
 */
// eslint-disable-next-line max-statements
describe('StreamingMetaApiConnection', () => {

  let sandbox;
  let api;
  let account;
  let clock;
  let client = {
    getAccountInformation: () => {},
    getPositions: () => {},
    getPosition: () => {},
    getOrders: () => {},
    getOrder: () => {},
    getHistoryOrdersByTicket: () => {},
    getHistoryOrdersByPosition: () => {},
    getHistoryOrdersByTimeRange: () => {},
    getDealsByTicket: () => {},
    getDealsByPosition: () => {},
    getDealsByTimeRange: () => {},
    removeApplication: () => {},
    trade: () => {},
    calculateMargin: () => {},
    reconnect: () => {},
    synchronize: () => true,
    ensureSubscribe: () => {},
    subscribeToMarketData: () => {},
    unsubscribeFromMarketData: () => {},
    addSynchronizationListener: () => {},
    addReconnectListener: () => {},
    removeSynchronizationListener: () => {},
    removeReconnectListener: () => {},
    getSymbols: () => {},
    getSymbolSpecification: () => {},
    getSymbolPrice: () => {},
    getCandle: () => {},
    getTick: () => {},
    getBook: () => {},
    saveUptime: () => {},
    waitSynchronized: () => {},
    unsubscribe: () => {},
    refreshMarketDataSubscriptions: () => {},
    regionsByAccounts: {},
    addAccountCache: () => {},
    getAccountRegion: (accountId) => accountId === 'accountIdReplica' ? 'new-york' : 'vint-hill',
    removeAccountCache: () => {},
    queueEvent: () => {}
  };

  let terminalHashManager = {
    refreshIgnoredFieldLists: () => {},
    getSpecificationsByHash: () => {},
    getPositionsByHash: () => {},
    getOrdersByHash: () => {},
    recordSpecifications: () => {},
    recordOrders: () => {},
    updateOrders: () => {},
    getLastUsedOrderHashes: () => {},
    getLastUsedPositionHashes: () => {},
    getLastUsedSpecificationHashes: () => {},
    removeConnectionReferences: () => {}
  };

  let connectionRegistry = {
    connectStreaming: () => {},
    removeStreaming: () => {},
    application: 'MetaApi'
  };

  let accountRegions = {
    'vint-hill': 'accountId',
    'new-york': 'accountIdReplica'
  };

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    account = {
      id: 'accountId', 
      state: 'DEPLOYED',
      region: 'vint-hill',
      accountRegions,
      reload: () => {}
    };
    api = new StreamingMetaApiConnection(client, terminalHashManager, account, undefined, connectionRegistry, 0, {
      minDelayInSeconds: 1,
      maxDelayInSeconds: 1
    });
    sandbox.stub(api._terminalState, 'specification').withArgs('EURUSD').returns({symbol: 'EURUSD'});
    clock = sinon.useFakeTimers({
      shouldAdvanceTime: true
    });
  });

  afterEach(() => {
    clock.restore();
    sandbox.restore();
  });

  /**
   * @test {MetaApiConnection#removeApplication}
   */
  it('should remove application', async () => {
    await api.connect();
    sandbox.stub(client, 'removeApplication').resolves();
    sandbox.stub(api.historyStorage, 'clear').resolves();
    await api.removeApplication();
    sinon.assert.calledWith(client.removeApplication, 'accountId');
    sinon.assert.calledOnce(api.historyStorage.clear);
  });

  /**
   * @test {MetaApiConnection#subscribe}
   */
  describe('ensure subscribe', () => {

    /**
     * @test {MetaApiConnection#subscribe}
     */
    it('should subscribe to terminal', async () => {
      await api.connect();
      sandbox.stub(client, 'ensureSubscribe').resolves();
      await api.subscribe();
      sinon.assert.calledWith(client.ensureSubscribe, 'accountId', 0);
      sinon.assert.calledWith(client.ensureSubscribe, 'accountId', 1);
      sinon.assert.calledWith(client.ensureSubscribe, 'accountIdReplica', 0);
      sinon.assert.calledWith(client.ensureSubscribe, 'accountIdReplica', 1);
    });

  });

  /**
   * @test {MetaApiConnection#synchronize}
   */
  it('should not subscribe if connection is not open', async () => {
    const ensureSubscribeStub = sandbox.stub(client, 'ensureSubscribe').resolves();
    try {
      await api.subscribe();
      throw new Error('Error is expected');
    } catch (err) {
      err.message.should.equal('This connection has not been initialized yet,'+
        ' please invoke await connection.connect()');
    }
    sinon.assert.notCalled(ensureSubscribeStub);
  });

  /**
   * @test {MetaApiConnection#synchronize}
   */
  it('should not subscribe if connection is closed', async () => {
    await api.connect();
    const ensureSubscribeStub = sandbox.stub(client, 'ensureSubscribe').resolves();
    await api.close();
    try {
      await api.subscribe();
      throw new Error('Error is expected');
    } catch (err) {
      err.message.should.equal('This connection has been closed, please create a new connection');
    }
    sinon.assert.notCalled(ensureSubscribeStub);
  });

  /**
   * @test {MetaApiConnection#synchronize}
   */
  it('should synchronize state with terminal', async () => {
    sandbox.stub(client, 'synchronize').resolves();
    sandbox.stub(randomstring, 'generate').returns('synchronizationId');
    api = new StreamingMetaApiConnection(client, terminalHashManager, {id: 'accountId', accountRegions},
      undefined, connectionRegistry);
    await api.connect();
    api.historyStorage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {doneTime: new Date('2020-01-01T00:00:00.000Z')});
    api.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', {time: new Date('2020-01-02T00:00:00.000Z')});
    await api.synchronize('vint-hill:1:ps-mpa-1');
    sinon.assert.calledWith(client.synchronize, 'accountId', 1, 'ps-mpa-1', 'synchronizationId',
      new Date('2020-01-01T00:00:00.000Z'), new Date('2020-01-02T00:00:00.000Z'));
  });

  /**
   * @test {MetaApiConnection#synchronize}
   */
  it('should synchronize state with terminal from specified time', async () => {
    sandbox.stub(client, 'synchronize').resolves();
    sandbox.stub(randomstring, 'generate').returns('synchronizationId');
    api = new StreamingMetaApiConnection(client, terminalHashManager, {id: 'accountId', accountRegions}, undefined,
      connectionRegistry, new Date('2020-10-07T00:00:00.000Z'));
    await api.connect();
    api.historyStorage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {doneTime: new Date('2020-01-01T00:00:00.000Z')});
    api.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', {time: new Date('2020-01-02T00:00:00.000Z')});
    await api.synchronize('vint-hill:1:ps-mpa-1');
    sinon.assert.calledWith(client.synchronize, 'accountId', 1, 'ps-mpa-1', 'synchronizationId',
      new Date('2020-10-07T00:00:00.000Z'), new Date('2020-10-07T00:00:00.000Z'));
  });

  /**
   * @test {MetaApiConnection#subscribeToMarketData}
   */
  it('should subscribe to market data', async () => {
    await api.connect();
    sandbox.stub(client, 'subscribeToMarketData').resolves();
    let promise = api.subscribeToMarketData('EURUSD', undefined);
    api.terminalState.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', 
      [{time: new Date(), symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    await promise;
    sinon.assert.calledWith(client.subscribeToMarketData, 'accountId', 'EURUSD', [{type: 'quotes'}]);
    sinon.assert.match(api.subscriptions('EURUSD'), [{type: 'quotes'}]);
    await api.subscribeToMarketData('EURUSD', [{type: 'books'}, {type: 'candles', timeframe: '1m'}]);
    sinon.assert.match(api.subscriptions('EURUSD'), [{type: 'quotes'}, {type: 'books'},
      {type: 'candles', timeframe: '1m'}]);
    await api.subscribeToMarketData('EURUSD', [{type: 'quotes'}, {type: 'candles', timeframe: '5m'}]);
    sinon.assert.match(api.subscriptions('EURUSD'), [{type: 'quotes'}, {type: 'books'},
      {type: 'candles', timeframe: '1m'}, {type: 'candles', timeframe: '5m'}]);
  });

  /**
   * @test {MetaApiConnection#subscribeToMarketData}
   */
  it('should not subscribe to symbol that has no specification', async () => {
    await api.connect();
    sandbox.stub(client, 'subscribeToMarketData').resolves();
    api.terminalState.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', 
      [{time: new Date(), symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    api.terminalState.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', 
      [{time: new Date(), symbol: 'AAAAA', bid: 1, ask: 1.1}]);
    try {
      await api.subscribeToMarketData('AAAAA');
      throw new Error('ValidationError expected');
    } catch (err) {
      err.name.should.equal('ValidationError');
    }
  });

  /**
   * @test {MetaApiConnection#unsubscribeFromMarketData}
   */
  it('should unsubscribe from market data', async () => {
    await api.connect();
    await api.terminalState.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1',
      [{time: new Date(), symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    sandbox.stub(client, 'unsubscribeFromMarketData').resolves();
    await api.unsubscribeFromMarketData('EURUSD', [{type: 'quotes'}]);
    sinon.assert.calledWith(client.unsubscribeFromMarketData, 'accountId', 'EURUSD', [{type: 'quotes'}]);
    await api.subscribeToMarketData('EURUSD', [{type: 'quotes'}, {type: 'books'},
      {type: 'candles', timeframe: '1m'}, {type: 'candles', timeframe: '5m'}]);
    sinon.assert.match(api.subscriptions('EURUSD'), [{type: 'quotes'}, {type: 'books'},
      {type: 'candles', timeframe: '1m'}, {type: 'candles', timeframe: '5m'}]);
    await api.unsubscribeFromMarketData('EURUSD', [{type: 'quotes'}, {type: 'candles', timeframe: '5m'}]);
    sinon.assert.match(api.subscriptions('EURUSD'), [{type: 'books'}, {type: 'candles', timeframe: '1m'}]);
  });

  describe('onSubscriptionDowngrade', () => {

    /**
     * @test {MetaApiConnection#onSubscriptionDowngrade}
     */
    it('should unsubscribe during market data subscription downgrade', async () => {
      await api.connect();
      sandbox.stub(api, 'subscribeToMarketData').resolves();
      sandbox.stub(api, 'unsubscribeFromMarketData').resolves();
      await api.onSubscriptionDowngraded('vint-hill:1:ps-mpa-1', 'EURUSD', undefined, 
        [{type: 'ticks'}, {type: 'books'}]);
      sinon.assert.calledWith(api.unsubscribeFromMarketData, 'EURUSD', [{type: 'ticks'}, {type: 'books'}]);
      sinon.assert.notCalled(api.subscribeToMarketData);
    });

    /**
     * @test {MetaApiConnection#onSubscriptionDowngrade}
     */
    it('should update market data subscription on downgrade', async () => {
      await api.connect();
      sandbox.stub(api, 'subscribeToMarketData').resolves();
      sandbox.stub(api, 'unsubscribeFromMarketData').resolves();
      await api.onSubscriptionDowngraded('vint-hill:1:ps-mpa-1', 'EURUSD', 
        [{type: 'quotes', intervalInMilliseconds: 30000}]);
      sinon.assert.calledWith(api.subscribeToMarketData, 'EURUSD', [{type: 'quotes', intervalInMilliseconds: 30000}]);
      sinon.assert.notCalled(api.unsubscribeFromMarketData);
    });

  });

  /**
   * @test {MetaApiConnection#terminalState}
   * @test {MetaApiConnection#historyStorage}
   */
  it('should initialize listeners, terminal state and history storage for accounts with user synch mode', async () => {
    sandbox.stub(client, 'addSynchronizationListener').returns();
    api = new StreamingMetaApiConnection(client, terminalHashManager,  {id: 'accountId', accountRegions}, 
      undefined, connectionRegistry);
    await api.connect();
    should.exist(api.terminalState);
    should.exist(api.historyStorage);
    sinon.assert.calledWith(client.addSynchronizationListener, 'accountId', api);
    sinon.assert.calledWith(client.addSynchronizationListener, 'accountId', api.terminalState);
    sinon.assert.calledWith(client.addSynchronizationListener, 'accountId', api.historyStorage);
  });

  /**
   * @test {MetaApiConnection#onConnected}
   */
  it('should sychronize on connection', async () => {
    sandbox.stub(client, 'synchronize').resolves();
    sandbox.stub(terminalHashManager, 'refreshIgnoredFieldLists').resolves();
    sandbox.stub(randomstring, 'generate').returns('synchronizationId');
    api = new StreamingMetaApiConnection(client, terminalHashManager,  {id: 'accountId', accountRegions}, 
      undefined, connectionRegistry);
    await api.connect();
    api.historyStorage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {doneTime: new Date('2020-01-01T00:00:00.000Z')});
    api.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', {time: new Date('2020-01-02T00:00:00.000Z')});
    await api.onConnected('vint-hill:1:ps-mpa-1', 1);
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.calledWith(client.synchronize, 'accountId', 1, 'ps-mpa-1', 'synchronizationId',
      new Date('2020-01-01T00:00:00.000Z'), new Date('2020-01-02T00:00:00.000Z'));
    sinon.assert.calledWith(terminalHashManager.refreshIgnoredFieldLists, 'vint-hill');
  });

  /**
   * @test {MetaApiConnection#onConnected}
   */
  it('should maintain synchronization if connection has failed', async () => {
    let stub = sandbox.stub(client, 'synchronize');
    stub.onFirstCall().throws(new Error('test error'));
    stub.onSecondCall().resolves();
    sandbox.stub(randomstring, 'generate').returns('synchronizationId');
    api = new StreamingMetaApiConnection(client, terminalHashManager,  {id: 'accountId', accountRegions}, 
      undefined, connectionRegistry);
    await api.connect();
    await api.historyStorage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', 
      {doneTime: new Date('2020-01-01T00:00:00.000Z')});
    await api.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', {time: new Date('2020-01-02T00:00:00.000Z')});
    await api.onConnected('vint-hill:1:ps-mpa-1', 1);
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.calledWith(client.synchronize, 'accountId', 1, 'ps-mpa-1', 'synchronizationId',
      new Date('2020-01-01T00:00:00.000Z'), new Date('2020-01-02T00:00:00.000Z'));
  });

  /**
   * @test {MetaApiConnection#onConnected}
   */
  it('should not synchronize if connection is closed', async () => {
    let synchronizeStub = sandbox.stub(client, 'synchronize');
    api = new StreamingMetaApiConnection(client, terminalHashManager,  {id: 'accountId', accountRegions},
      undefined, connectionRegistry);
    await api.connect();
    await api.historyStorage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', 
      {doneTime: new Date('2020-01-01T00:00:00.000Z')});
    await api.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', {time: new Date('2020-01-02T00:00:00.000Z')});
    await api.close();
    await api.onConnected('vint-hill:1:ps-mpa-1', 1);
    sinon.assert.notCalled(synchronizeStub);
  });

  /**
   * @test {MetaApiConnection#close}
   */
  it('should unsubscribe from events on close', async () => {
    let accountData = {id: 'accountId', accountRegions};
    sandbox.stub(client, 'addSynchronizationListener').returns();
    sandbox.stub(client, 'removeSynchronizationListener').returns();
    sandbox.stub(client, 'unsubscribe').resolves();
    sandbox.stub(connectionRegistry, 'removeStreaming').returns();
    api = new StreamingMetaApiConnection(client, terminalHashManager,  accountData, 
      undefined, connectionRegistry);
    sandbox.stub(api._terminalState, 'close').returns();
    await api.connect();
    await api.close();
    sinon.assert.calledWith(client.removeSynchronizationListener, 'accountId', api);
    sinon.assert.calledWith(client.removeSynchronizationListener, 'accountId', api.terminalState);
    sinon.assert.calledWith(client.removeSynchronizationListener, 'accountId', api.historyStorage);
    sinon.assert.calledWith(connectionRegistry.removeStreaming, accountData);
    sinon.assert.calledOnce(api._terminalState.close);
  });

  /**
   * @test {MetaApiConnection#close}
   */
  it('should close connection only if all instances closed', async () => {
    let accountData = {id: 'accountId', accountRegions};
    sandbox.stub(client, 'addSynchronizationListener').returns();
    sandbox.stub(client, 'removeSynchronizationListener').returns();
    sandbox.stub(client, 'unsubscribe').resolves();
    sandbox.stub(connectionRegistry, 'removeStreaming').returns();
    api = new StreamingMetaApiConnection(client, terminalHashManager,  accountData, 
      undefined, connectionRegistry);
    await api.connect('accountId');
    await api.connect('accountId');
    await api.connect('accountId2');
    await api.connect('accountId3');
    await api.close('accountId');
    sinon.assert.notCalled(client.removeSynchronizationListener);
    await api.close('accountId3');
    sinon.assert.notCalled(client.removeSynchronizationListener);
    await api.close('accountId2');
    sinon.assert.calledWith(client.removeSynchronizationListener, 'accountId', api);
    sinon.assert.calledWith(client.removeSynchronizationListener, 'accountId', api.terminalState);
    sinon.assert.calledWith(client.removeSynchronizationListener, 'accountId', api.historyStorage);
    sinon.assert.calledWith(connectionRegistry.removeStreaming, accountData);
  });

  /**
   * @test {MetaApiConnection#close}
   */
  it('should close connection only after it has been opened', async () => {
    let accountData = {id: 'accountId', accountRegions};
    sandbox.stub(client, 'addSynchronizationListener').returns();
    sandbox.stub(client, 'removeSynchronizationListener').returns();
    sandbox.stub(client, 'unsubscribe').resolves();
    sandbox.stub(connectionRegistry, 'removeStreaming').returns();
    api = new StreamingMetaApiConnection(client, terminalHashManager,  accountData, 
      undefined, connectionRegistry);
    await api.close('accountId');
    sinon.assert.notCalled(client.removeSynchronizationListener);
    await api.connect('accountId');
    await api.close('accountId');
    sinon.assert.calledWith(client.removeSynchronizationListener, 'accountId', api);
    sinon.assert.calledWith(client.removeSynchronizationListener, 'accountId', api.terminalState);
    sinon.assert.calledWith(client.removeSynchronizationListener, 'accountId', api.historyStorage);
    sinon.assert.calledWith(connectionRegistry.removeStreaming, accountData);
  });

  describe('waitSynchronized', () => {

    /**
     * @test {MetaApiConnection#waitSynchronized}
     */
    it('should wait util synchronization complete', async () => {
      await api.connect();
      sandbox.stub(client, 'waitSynchronized').resolves();
      sinon.assert.match(await api.isSynchronized('vint-hill:1:ps-mpa-1'), false);
      (await api.isSynchronized()).should.equal(false);
      let promise = api.waitSynchronized({applicationPattern: 'app.*', synchronizationId: 'synchronizationId',
        timeoutInSeconds: 1, intervalInMilliseconds: 10});
      let startTime = Date.now();
      await Promise.race([promise, new Promise(res => setTimeout(res, 50))]);
      (Date.now() - startTime).should.be.approximately(50, 10);
      api.onHistoryOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
      api.onDealsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
      startTime = Date.now();
      await promise;
      (Date.now() - startTime).should.be.approximately(10, 10);
      (await api.isSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId')).should.equal(true);
      sinon.assert.calledWith(client.waitSynchronized, 'accountId', 1, 'app.*', 0.92);
    });

    /**
     * @test {MetaApiConnection#waitSynchronized}
     */
    it('should wait synchronize on a replica', async () => {
      await api.connect();
      sandbox.stub(client, 'waitSynchronized').resolves();
      sinon.assert.match(await api.isSynchronized('new-york:1:ps-mpa-1'), false);
      (await api.isSynchronized()).should.equal(false);
      let promise = api.waitSynchronized({applicationPattern: 'app.*', synchronizationId: 'synchronizationId',
        timeoutInSeconds: 1, intervalInMilliseconds: 10});
      let startTime = Date.now();
      await Promise.race([promise, new Promise(res => setTimeout(res, 50))]);
      (Date.now() - startTime).should.be.approximately(50, 10);
      api.onHistoryOrdersSynchronized('new-york:1:ps-mpa-1', 'synchronizationId');
      api.onDealsSynchronized('new-york:1:ps-mpa-1', 'synchronizationId');
      startTime = Date.now();
      await promise;
      (Date.now() - startTime).should.be.approximately(10, 10);
      (await api.isSynchronized('new-york:1:ps-mpa-1', 'synchronizationId')).should.equal(true);
      sinon.assert.calledWith(client.waitSynchronized, 'accountIdReplica', 1, 'app.*', 0.92);
    });

    /**
     * @test {MetaApiConnection#waitSynchronized}
     */
    it('should time out waiting for synchronization complete', async () => {
      await api.connect();
      try {
        await api.waitSynchronized({applicationPattern: 'app.*', synchronizationId: 'synchronizationId',
          timeoutInSeconds: 1, intervalInMilliseconds: 10});
        throw new Error('TimeoutError is expected');
      } catch (err) {
        err.name.should.equal('TimeoutError');
      }
      (await api.isSynchronized('synchronizationId')).should.equal(false);
    });

  });

  /**
   * @test {MetaApiConnection#initialize}
   */
  it('should initialize connection', async () => {
    const addCacheStub = sandbox.stub(client, 'addAccountCache');
    await api.connect();
    sandbox.stub(api.historyStorage, 'initialize').resolves();
    await api.initialize();
    sinon.assert.calledOnce(api.historyStorage.initialize);
    sinon.assert.calledWith(addCacheStub, 'accountId', { 'new-york': 'accountIdReplica', 'vint-hill': 'accountId' });
  });

  /**
   * @test {MetaApiConnection#onDisconnected}
   */
  it('should set synchronized false on disconnect', async () => {
    await api.connect();
    await api.onConnected('vint-hill:1:ps-mpa-1', 2);
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.match(api.synchronized, true);
    await api.onDisconnected('vint-hill:1:ps-mpa-1');
    sinon.assert.match(api.synchronized, false);
  });

  /**
   * @test {MetaApiConnection#onDisconnected}
   */
  it('should delete state if stream closed', async () => {
    await api.connect();
    await api.onConnected('vint-hill:1:ps-mpa-1', 2);
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.match(api.synchronized, true);
    await api.onStreamClosed('vint-hill:1:ps-mpa-1');
    sinon.assert.match(api.synchronized, false);
  });

  /**
   * @test {MetaApiConnection#onDisconnected}
   */
  it('should create refresh subscriptions job', async () => {
    await api.connect();
    sandbox.stub(client, 'refreshMarketDataSubscriptions').resolves();
    sandbox.stub(client, 'subscribeToMarketData').resolves();
    sandbox.stub(client, 'waitSynchronized').resolves();
    await api.onSynchronizationStarted('vint-hill:1:ps-mpa-1');
    await clock.tickAsync(50);
    sinon.assert.calledWith(client.refreshMarketDataSubscriptions, 'accountId', 1, []);
    api.terminalState.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', 
      [{time: new Date(), symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    await api.subscribeToMarketData('EURUSD', [{type: 'quotes'}], 1);
    await clock.tickAsync(1050);
    sinon.assert.calledWith(client.refreshMarketDataSubscriptions, 'accountId', 1, 
      [{symbol: 'EURUSD', subscriptions: [{type: 'quotes'}]}]);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 2);
    await api.onDisconnected('vint-hill:1:ps-mpa-1');
    await clock.tickAsync(1050);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 2);
    await api.onSynchronizationStarted('vint-hill:1:ps-mpa-1');
    await clock.tickAsync(50);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 3);
    await api.close();
    await clock.tickAsync(1050);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 3);
  });

  /**
   * @test {MetaApiConnection#onDisconnected}
   */
  it('should create refresh subscriptions job with a replica', async () => {
    await api.connect();
    sandbox.stub(client, 'refreshMarketDataSubscriptions').resolves();
    sandbox.stub(client, 'subscribeToMarketData').resolves();
    sandbox.stub(client, 'waitSynchronized').resolves();
    await api.onSynchronizationStarted('new-york:1:ps-mpa-1');
    await clock.tickAsync(50);
    sinon.assert.calledWith(client.refreshMarketDataSubscriptions, 'accountIdReplica', 1, []);
    api.terminalState.onSymbolPricesUpdated('new-york:1:ps-mpa-1', 
      [{time: new Date(), symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    await api.subscribeToMarketData('EURUSD', [{type: 'quotes'}], 1);
    await clock.tickAsync(1050);
    sinon.assert.calledWith(client.refreshMarketDataSubscriptions, 'accountIdReplica', 1, 
      [{symbol: 'EURUSD', subscriptions: [{type: 'quotes'}]}]);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 2);
    await api.onDisconnected('new-york:1:ps-mpa-1');
    await clock.tickAsync(1050);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 2);
    await api.onSynchronizationStarted('new-york:1:ps-mpa-1');
    await clock.tickAsync(50);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 3);
    await api.close();
    await clock.tickAsync(1050);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 3);
  });

  /**
   * @test {MetaApiConnection#onUnsubscribeRegion}
   */
  it('should remove subscription job on region unsubscribe', async () => {
    await api.connect();
    sandbox.stub(client, 'refreshMarketDataSubscriptions').resolves();
    sandbox.stub(client, 'subscribeToMarketData').resolves();
    sandbox.stub(client, 'waitSynchronized').resolves();
    await api.onSynchronizationStarted('vint-hill:1:ps-mpa-1');
    await clock.tickAsync(50);
    sinon.assert.calledWith(client.refreshMarketDataSubscriptions, 'accountId', 1, []);
    await clock.tickAsync(1050);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 2);
    await api.onUnsubscribeRegion('vint-hill');
    await clock.tickAsync(1050);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 2);
  });

  /**
   * @test {StreamingMetaApiConnection#onReconnected}
   */
  it('should clear region states on socket reconnect', async () => {
    await api.connect();
    sandbox.stub(client, 'refreshMarketDataSubscriptions').resolves();
    sandbox.stub(client, 'subscribeToMarketData').resolves();
    sandbox.stub(client, 'waitSynchronized').resolves();
    await api.onSynchronizationStarted('new-york:1:ps-mpa-1');
    await api.onSynchronizationStarted('vint-hill:1:ps-mpa-1');
    await clock.tickAsync(50);
    sinon.assert.calledWith(client.refreshMarketDataSubscriptions, 'accountIdReplica', 1, []);
    sinon.assert.calledWith(client.refreshMarketDataSubscriptions, 'accountId', 1, []);
    api.terminalState.onSymbolPricesUpdated('new-york:1:ps-mpa-1', 
      [{time: new Date(), symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    api.terminalState.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', 
      [{time: new Date(), symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    await api.subscribeToMarketData('EURUSD', [{type: 'quotes'}], 1);
    await clock.tickAsync(1050);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 4);
    await api.onReconnected('new-york', 1);
    await clock.tickAsync(1050);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 5);
    await api.onReconnected('vint-hill', 1);
    await clock.tickAsync(1050);
    sinon.assert.callCount(client.refreshMarketDataSubscriptions, 5);
  });

});
