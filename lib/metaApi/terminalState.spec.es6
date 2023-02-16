'use strict';

import should from 'should';
import sinon from 'sinon';
import TerminalState from './terminalState';

/**
 * @test {TerminalState}
 */
describe('TerminalState', () => {

  let state, sandbox, account, terminalHashManager, 
    specificationsStub, positionsStub, ordersStub, clock;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    account = {
      server: 'ICMarkets-Demo1',
      id: 'accountId',
      type: 'cloud-g1'
    };
    terminalHashManager = {
      getSpecificationsByHash: () => {},
      getPositionsByHash: () => {},
      getOrdersByHash: () => {},
      recordSpecifications: () => {},
      recordOrders: () => {},
      recordPositions: () => {},
      updateOrders: () => {},
      updatePositions: () => {},
      updateSpecifications: () => {},
      getLastUsedOrderHashes: () => {},
      getLastUsedPositionHashes: () => {},
      getLastUsedSpecificationHashes: () => {},
      removeConnectionReferences: () => {},
      addSpecificationReference: () => {},
      removeSpecificationReference: () => {},
      addPositionReference: () => {},
      removePositionReference: () => {},
      addOrderReference: () => {},
      removeOrderReference: () => {}
    };
    positionsStub = sandbox.stub(terminalHashManager, 'getPositionsByHash').returns({1: {id: '1', profit: 10}});
    ordersStub = sandbox.stub(terminalHashManager, 'getOrdersByHash').returns({1: {id: '1', openPrice: 10}});
    specificationsStub = sandbox.stub(terminalHashManager, 'getSpecificationsByHash')
      .returns({EURUSD: {symbol: 'EURUSD', tickSize: 0.00001}});
    state = new TerminalState(account, terminalHashManager);
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
  });

  /**
   * @test {TerminalState#onConnected}
   * @test {TerminalState#onDisconnected}
   * @test {TerminalState#connected}
   */
  it('should return connection state', () => {
    state.connected.should.be.false();
    state.onConnected('vint-hill:1:ps-mpa-1');
    state.connected.should.be.true();
    state.onDisconnected('vint-hill:1:ps-mpa-1');
    state.connected.should.be.false();
  });

  /**
   * @test {TerminalState#onBrokerConnectionStatus}
   * @test {TerminalState#connectedToBroker}
   */
  it('should return broker connection state', async () => {
    state.connectedToBroker.should.be.false();
    state.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', true);
    state.connectedToBroker.should.be.true();
    state.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', false);
    state.connectedToBroker.should.be.false();
    state.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', true);
    state.onDisconnected('vint-hill:1:ps-mpa-1');
    state.connectedToBroker.should.be.false();
    await clock.tickAsync(65000);
  });

  /**
   * @test {TerminalState#onBrokerConnectionStatus}
   * @test {TerminalState#connectedToBroker}
   */
  it('should clear combined state if account has been disconnected for a long time', async () => {
    let callStub = sandbox.stub(terminalHashManager, 'removeConnectionReferences').returns();
    state.onAccountInformationUpdated(1, {balance: 1000});
    state.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', false);
    
    await clock.tickAsync(29 * 60 * 1000);
    state.accountInformation.should.deepEqual({balance: 1000});
    sinon.assert.notCalled(callStub);

    await clock.tickAsync(7 * 60 * 1000);
    should(state.accountInformation).be.undefined();
    sinon.assert.calledWith(callStub, 'ICMarkets-Demo1', 'accountId', state.id, 'combined');
  });

  /**
   * @test {TerminalState#onBrokerConnectionStatus}
   * @test {TerminalState#connectedToBroker}
   */
  it('should not clear combined state if connection status changed recently', async () => {
    let callStub = sandbox.stub(terminalHashManager, 'removeConnectionReferences').returns();
    state.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', true);
    state.onAccountInformationUpdated(1, {balance: 1000});

    await clock.tickAsync(29 * 60 * 1000);
    state.accountInformation.should.deepEqual({balance: 1000});
    sinon.assert.notCalled(callStub);
  });

  /**
   * @test {TerminalState#onBrokerConnectionStatus}
   * @test {TerminalState#connectedToBroker}
   */
  it('should not clear combined state if account has been connected for a long time', async () => {
    let callStub = sandbox.stub(terminalHashManager, 'removeConnectionReferences').returns();
    state.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', true);
    state.onAccountInformationUpdated(1, {balance: 1000});

    await clock.tickAsync(60 * 60 * 1000);
    state.accountInformation.should.deepEqual({balance: 1000});
    sinon.assert.notCalled(callStub);
  });

  /**
   * @test {TerminalState#onAccountInformationUpdated}
   * @test {TerminalState#accountInformation}
   */
  it('should return account information', () => {
    should.not.exist(state.accountInformation);
    state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {balance: 1000});
    state.accountInformation.should.match({balance: 1000});
  });

  /**
   * @test {TerminalState#onPositionUpdated}
   * @test {TerminalState#onPositionRemoved}
   * @test {TerminalState#positions}
   */
  it('should return positions', () => {
    state.positions.length.should.equal(0);
    state._combinedState.positionsHash = 'hash1';
    state.positions.length.should.equal(1);
    state.positions.should.match([{id: '1', profit: 10}]);
  });

  /**
   * @test {TerminalState#onPendingOrderUpdated}
   * @test {TerminalState#onPendingOrderCompleted}
   * @test {TerminalState#orders}
   */
  it('should return orders', async () => {
    state.orders.length.should.equal(0);
    state._combinedState.ordersHash = 'hash1';
    state.orders.length.should.equal(1);
    state.orders.should.match([{id: '1', openPrice: 10}]);
  });

  /**
   * @test {TerminalState#onSymbolSpecificationsUpdated}
   * @test {TerminalState#specifications}
   * @test {TerminalState#specification}
   */
  it('should return specifications', () => {
    state.specifications.length.should.equal(0);
    state._combinedState.specificationsHash = 'hash1';
    state.specifications.length.should.equal(1);
    state.specifications.should.match([{symbol: 'EURUSD', tickSize: 0.00001}]);
  });

  /**
   * @test {TerminalState#onPositionsReplaced}
   * @test {TerminalState#onPositionRemoved}
   * @test {TerminalState#specification}
   */
  it('should update positions', async () => {
    const positions = [{
      id: '1',
      symbol: 'EURUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 9,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    }];
    const changedPosition = {
      id: '1',
      symbol: 'EURUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 9,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 1
    };
    const recordStub = sandbox.stub(terminalHashManager, 'recordPositions').resolves('phash1');
    const updateStub = sandbox.stub(terminalHashManager, 'updatePositions').resolves('phash2');
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    sinon.assert.calledWith(recordStub, 'accountId', 'cloud-g1', state.id, 'vint-hill:1:ps-mpa-1', positions);
    await state.onPositionsUpdated('vint-hill:1:ps-mpa-1', [changedPosition], []);
    sinon.assert.calledWith(updateStub, 'accountId', 'cloud-g1', state.id,
      'vint-hill:1:ps-mpa-1', [changedPosition], [], 'phash1');
    sinon.assert.calledTwice(updateStub);
    await state.onPositionsUpdated('vint-hill:1:ps-mpa-1', [], ['1']);
    sinon.assert.calledWith(updateStub, 'accountId', 'cloud-g1', state.id,
      'vint-hill:1:ps-mpa-1', [], ['1'], 'phash2');
    sinon.assert.callCount(updateStub, 4);
  });

  /**
   * @test {TerminalState#onPositionsReplaced}
   */
  it('should only record positions if theyre expected', async () => {
    const positions = [{
      id: '1',
      symbol: 'EURUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 9,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    }];
    const recordStub = sandbox.stub(terminalHashManager, 'recordPositions').resolves('phash1');
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, 'phash1', undefined);
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    sinon.assert.notCalled(recordStub);
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined, undefined);
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    sinon.assert.calledWith(recordStub, 'accountId', 'cloud-g1', state.id, 'vint-hill:1:ps-mpa-1', positions);
  });

  /**
   * @test {TerminalState#onPendingOrdersReplaced}
   * @test {TerminalState#onPendingOrdersUpdated}
   */
  it('should update orders', async () => {
    const orders = [{
      id: '1',
      symbol: 'EURUSD',
      type: 'ORDER_TYPE_BUY_LIMIT',
      currentPrice: 9
    }];
    const changedOrder = {
      id: '1',
      symbol: 'EURUSD',
      type: 'ORDER_TYPE_BUY_LIMIT',
      currentPrice: 10
    };
    const recordStub = sandbox.stub(terminalHashManager, 'recordOrders').resolves('ohash1');
    const updateStub = sandbox.stub(terminalHashManager, 'updateOrders').resolves('ohash2');
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    sinon.assert.calledWith(recordStub, 'accountId', 'cloud-g1', state.id, 'vint-hill:1:ps-mpa-1', orders);
    await state.onPendingOrdersUpdated('vint-hill:1:ps-mpa-1', [changedOrder], []);
    sinon.assert.calledWith(updateStub, 'accountId', 'cloud-g1', state.id,
      'vint-hill:1:ps-mpa-1', [changedOrder], [], 'ohash1');
    sinon.assert.calledTwice(updateStub);
    await state.onPendingOrdersUpdated('vint-hill:1:ps-mpa-1', [], ['1']);
    sinon.assert.calledWith(updateStub, 'accountId', 'cloud-g1', state.id,
      'vint-hill:1:ps-mpa-1', [], ['1'], 'ohash2');
    sinon.assert.callCount(updateStub, 4);
  });

  /**
   * @test {TerminalState#onPendingOrdersReplaced}
   */
  it('should only record orders if theyre expected', async () => {
    const orders = [{
      id: '1',
      symbol: 'EURUSD',
      type: 'ORDER_TYPE_BUY_LIMIT',
      currentPrice: 9
    }];
    const recordStub = sandbox.stub(terminalHashManager, 'recordOrders').resolves('ohash1');
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined, 'ohash1');
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    sinon.assert.notCalled(recordStub);
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined, undefined);
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    sinon.assert.calledWith(recordStub, 'accountId', 'cloud-g1', state.id, 'vint-hill:1:ps-mpa-1', orders);
  });

  /**
   * @test {TerminalState#onSymbolPricesUpdated}
   * @test {TerminalState#price}
   * @test {TerminalState#lastQuoteTime}
   */
  it('should return price', () => {
    should.not.exist(state.price('EURUSD'));
    state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: new Date('2022-01-01T00:00:00.000Z'),
      brokerTime: '2022-01-01 02:00:00.000', symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: new Date('2022-01-01T00:00:01.000Z'),
      brokerTime: '2022-01-01 02:00:01.000', symbol: 'GBPUSD'}]);
    state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: new Date('2022-01-01T00:00:02.000Z'),
      brokerTime: '2022-01-01 02:00:02.000', symbol: 'EURUSD', bid: 1, ask: 1.2}]);
    state.price('EURUSD').should.match({symbol: 'EURUSD', bid: 1, ask: 1.2});
    state.lastQuoteTime.should.match({time: new Date('2022-01-01T00:00:02.000Z'),
      brokerTime: '2022-01-01 02:00:02.000'});
  });

  /**
   * @test {TerminalState#onSymbolPricesUpdated}
   * @test {TerminalState#price}
   */
  it('should wait for price', async () => {
    should.not.exist(state.price('EURUSD'));
    let promise = state.waitForPrice('EURUSD');
    state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: new Date(), symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    (await promise).should.match({symbol: 'EURUSD', bid: 1, ask: 1.1});
  });

  /**
   * @test {TerminalState#onSymbolPricesUpdated}
   * @test {TerminalState#accountInformation}
   * @test {TerminalState#positions}
   */
  it('should update account equity and position profit on price update', () => {
    state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {equity: 1000, balance: 800});
    const positions = [{
      id: '1',
      symbol: 'EURUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 9,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    }, {
      id: '2',
      symbol: 'AUDUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 9,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    }];
    state._combinedState.positionsHash = 'hash1';
    state._combinedState.specificationsHash = 'hash1';
    positionsStub.returns({1: positions[0], 2: positions[1]});
    specificationsStub.returns({EURUSD: {symbol: 'EURUSD', tickSize: 0.01, digits: 5},
      AUDUSD: {symbol: 'AUDUSD', tickSize: 0.01, digits: 5}});
    state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [
      {
        time: new Date(),
        symbol: 'EURUSD',
        profitTickValue: 0.5,
        lossTickValue: 0.5,
        bid: 10,
        ask: 11
      },
      {
        time: new Date(),
        symbol: 'AUDUSD',
        profitTickValue: 0.5,
        lossTickValue: 0.5,
        bid: 10,
        ask: 11
      }
    ]);
    state.positions.map(p => p.profit).should.match([200, 200]);
    state.positions.map(p => p.unrealizedProfit).should.match([200, 200]);
    state.positions.map(p => p.currentPrice).should.match([10, 10]);
    state.accountInformation.equity.should.equal(1200);
  });

  /**
   * @test {TerminalState#onSymbolPricesUpdated}
   * @test {TerminalState#accountInformation}
   * @test {TerminalState#positions}
   */
  it('should update margin fields on price update', () => {
    state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {equity: 1000, balance: 800});
    state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: new Date(), symbol: 'EURUSD', bid: 1, ask: 1.1}], 
      100, 200, 400, 40000);
    state.accountInformation.equity.should.equal(100);
    state.accountInformation.margin.should.equal(200);
    state.accountInformation.freeMargin.should.equal(400);
    state.accountInformation.marginLevel.should.equal(40000);
  });

  /**
   * @test {TerminalState#onSymbolPriceUpdated}
   * @test {TerminalState#orders}
   */
  it('should update order currentPrice on price update', () => {
    ordersStub.returns({
      1: {
        id: '1',
        symbol: 'EURUSD',
        type: 'ORDER_TYPE_BUY_LIMIT',
        currentPrice: 9
      },
      2: {
        id: '2',
        symbol: 'AUDUSD',
        type: 'ORDER_TYPE_SELL_LIMIT',
        currentPrice: 9
      }
    });
    state._combinedState.ordersHash = 'hash1';
    state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{
      time: new Date(),
      symbol: 'EURUSD',
      profitTickValue: 0.5,
      lossTickValue: 0.5,
      bid: 10,
      ask: 11
    }]);
    state.orders.map(o => o.currentPrice).should.match([11, 9]);
  });

  /**
   * @test {TerminalState#onDisconnected}
   */
  it('should remove state on closed stream', async () => {
    const date = new Date();
    sinon.assert.match(state.price('EURUSD'), undefined);
    await state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: date, symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    sinon.assert.match(state.price('EURUSD'), {time: date, symbol: 'EURUSD', bid: 1, ask: 1.1});
    await state.onDisconnected('vint-hill:1:ps-mpa-1');
  });

  /**
   * @test {TerminalState#onSynchronizationStarted}
   */
  // eslint-disable-next-line max-statements
  it('should process sync started and sync finished event', async () => {
    const recordSpecificationsStub = sandbox.stub(terminalHashManager, 'recordSpecifications').resolves();
    const recordOrdersStub = sandbox.stub(terminalHashManager, 'recordOrders').resolves();
    const recordPositionsStub = sandbox.stub(terminalHashManager, 'recordPositions').resolves();
    sandbox.stub(terminalHashManager, 'addSpecificationReference').returns();
    sandbox.stub(terminalHashManager, 'removeSpecificationReference').returns();
    sandbox.stub(terminalHashManager, 'addPositionReference').returns();
    sandbox.stub(terminalHashManager, 'removePositionReference').returns();
    sandbox.stub(terminalHashManager, 'addOrderReference').returns();
    sandbox.stub(terminalHashManager, 'removeOrderReference').returns();
    const specification = {symbol: 'EURUSD', tickSize: 0.01};
    const positions = [{
      id: '1',
      symbol: 'EURUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 9,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    }];
    const orders = [{
      id: '1',
      symbol: 'EURUSD',
      type: 'ORDER_TYPE_BUY_LIMIT',
      currentPrice: 9
    }];
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined, undefined);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    sinon.assert.notCalled(recordSpecificationsStub);
    sinon.assert.notCalled(recordOrdersStub);
    sinon.assert.notCalled(recordPositionsStub);
    sinon.assert.notCalled(terminalHashManager.addSpecificationReference);
    sinon.assert.notCalled(terminalHashManager.removeSpecificationReference);
    sinon.assert.notCalled(terminalHashManager.addPositionReference);
    sinon.assert.notCalled(terminalHashManager.removePositionReference);
    sinon.assert.notCalled(terminalHashManager.addOrderReference);
    sinon.assert.notCalled(terminalHashManager.removeOrderReference);
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined, undefined);
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', [specification], []);
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    sinon.assert.calledWith(recordSpecificationsStub, 'ICMarkets-Demo1', 'cloud-g1',
      state.id, 'vint-hill:1:ps-mpa-1', [specification]);
    sinon.assert.calledWith(recordOrdersStub, 'accountId', 'cloud-g1',
      state.id, 'vint-hill:1:ps-mpa-1', orders);
    sinon.assert.calledWith(recordPositionsStub, 'accountId', 'cloud-g1',
      state.id, 'vint-hill:1:ps-mpa-1', positions);
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined, undefined);
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', [specification], []);
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    sinon.assert.calledTwice(recordSpecificationsStub);
    sinon.assert.calledTwice(recordOrdersStub);
    sinon.assert.calledTwice(recordPositionsStub);
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', 'shash1', 'phash1', 'ohash1');
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    sinon.assert.calledTwice(recordSpecificationsStub);
    sinon.assert.calledTwice(recordOrdersStub);
    sinon.assert.calledTwice(recordPositionsStub);
    sinon.assert.calledWith(terminalHashManager.addSpecificationReference, 'ICMarkets-Demo1',
      'shash1', state.id, 'vint-hill:1:ps-mpa-1');
    sinon.assert.calledWith(terminalHashManager.addSpecificationReference, 'ICMarkets-Demo1',
      'shash1', state.id, 'combined');
    sinon.assert.calledWith(terminalHashManager.removeSpecificationReference, 'ICMarkets-Demo1',
      state.id, 'vint-hill:1:ps-mpa-1');
    sinon.assert.calledWith(terminalHashManager.removeSpecificationReference, 'ICMarkets-Demo1',
      state.id, 'combined');
    sinon.assert.calledWith(terminalHashManager.addPositionReference, 'accountId',
      'phash1', state.id, 'vint-hill:1:ps-mpa-1');
    sinon.assert.calledWith(terminalHashManager.addPositionReference, 'accountId',
      'phash1', state.id, 'combined');
    sinon.assert.calledWith(terminalHashManager.removePositionReference, 'accountId',
      state.id, 'vint-hill:1:ps-mpa-1');
    sinon.assert.calledWith(terminalHashManager.removePositionReference, 'accountId',
      state.id, 'combined');
    sinon.assert.calledWith(terminalHashManager.addOrderReference, 'accountId',
      'ohash1', state.id, 'vint-hill:1:ps-mpa-1');
    sinon.assert.calledWith(terminalHashManager.addOrderReference, 'accountId',
      'ohash1', state.id, 'combined');
    sinon.assert.calledWith(terminalHashManager.removeOrderReference, 'accountId',
      state.id, 'vint-hill:1:ps-mpa-1');
    sinon.assert.calledWith(terminalHashManager.removeOrderReference, 'accountId',
      state.id, 'combined');
  });
  
  /**
   * @test {TerminalState#specification}
   */
  it('should return hashes', async () => {
    sandbox.stub(terminalHashManager, 'getLastUsedSpecificationHashes').returns(['shash1', 'shash2']);
    sandbox.stub(terminalHashManager, 'getLastUsedPositionHashes').returns(['phash1', 'phash2']);
    sandbox.stub(terminalHashManager, 'getLastUsedOrderHashes').returns(['ohash1', 'ohash2']);
    const hashes = state.getHashes();
    sinon.assert.match(hashes, {
      specificationsHashes: ['shash1', 'shash2'],
      positionsHashes: ['phash1', 'phash2'],
      ordersHashes: ['ohash1', 'ohash2']
    });
    sinon.assert.calledWith(terminalHashManager.getLastUsedSpecificationHashes, 'ICMarkets-Demo1');
    sinon.assert.calledWith(terminalHashManager.getLastUsedPositionHashes, 'accountId');
    sinon.assert.calledWith(terminalHashManager.getLastUsedOrderHashes, 'accountId');
  });

  /**
   * @test {TerminalState#specification}
   */
  it('should return specification by symbol', async () => {
    sandbox.stub(terminalHashManager, 'recordSpecifications').resolves('shash1');
    const expectedSpec = {symbol: 'EURUSD', tickSize: 0.00001};
    let specification = state.specification('EURUSD');
    sinon.assert.match(specification, null);
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', [expectedSpec], []);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    specification = state.specification('EURUSD');
    sinon.assert.match(specification, {symbol: 'EURUSD', tickSize: 0.00001});
  });

  /**
   * @test {TerminalState#specification}
   */
  it('should update specifications if theyre recorded with existing hash', async () => {
    const expectedSpec = {symbol: 'EURUSD', tickSize: 0.00001};
    const expectedSpec2 = {symbol: 'AUDUSD', tickSize: 0.00001};
    const recordStub = sandbox.stub(terminalHashManager, 'recordSpecifications').resolves('shash1');
    const updateStub = sandbox.stub(terminalHashManager, 'updateSpecifications').resolves('shash1');
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined, undefined);
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', [expectedSpec], []);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    sinon.assert.calledWith(recordStub, 'ICMarkets-Demo1', 'cloud-g1',
      state.id, 'vint-hill:1:ps-mpa-1', [expectedSpec]);
    sinon.assert.notCalled(updateStub);
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-2', 'shash1', undefined, undefined);
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-2', [expectedSpec2], []);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-2', 'synchronizationId');
    sinon.assert.calledWith(updateStub, 'ICMarkets-Demo1', 'cloud-g1',
      state.id, 'vint-hill:1:ps-mpa-2', [expectedSpec2], [], 'shash1');
  });

  /**
   * @test {TerminalState#onSynchronizationStarted}
   */
  it('delete all unfinished states except for the latest on sync started', async () => {
    await state.onAccountInformationUpdated('vint-hill:2:ps-mpa-3', {'balance': 1000});
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-2', {'balance': 1000});
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-4', true, true, true);
    should(state._stateByInstanceIndex['vint-hill:1:ps-mpa-1']).not.eql(undefined);
    should(state._stateByInstanceIndex['vint-hill:1:ps-mpa-2']).eql(undefined);
    should(state._stateByInstanceIndex['vint-hill:2:ps-mpa-3']).not.eql(undefined);
  });

  /**
   * @test {TerminalState#onPendingOrdersSynchronized}
   */
  it('should delete all disconnected states on sync finished', async () => {
    await state.onAccountInformationUpdated('vint-hill:2:ps-mpa-3', {'balance': 1000});
    await state.onPendingOrdersSynchronized('vint-hill:2:ps-mpa-3', 'synchronizationId');
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onConnected('vint-hill:1:ps-mpa-1');
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-2', {'balance': 1000});
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-2', 'synchronizationId2');
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-4', {'balance': 1000});
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-4', 'synchronizationId2');
    should(state._stateByInstanceIndex['vint-hill:1:ps-mpa-1']).not.eql(undefined);
    should(state._stateByInstanceIndex['vint-hill:1:ps-mpa-2']).eql(undefined);
    should(state._stateByInstanceIndex['vint-hill:2:ps-mpa-3']).not.eql(undefined);
  });

  /**
   * @test {TerminalState#onDisconnected}
   */
  it('should delete state on disconnected if there is another synced state', async () => {
    sandbox.stub(terminalHashManager, 'removeConnectionReferences').returns();
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onConnected('vint-hill:1:ps-mpa-1');
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId2');
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-2', {'balance': 1000});
    await state.onConnected('vint-hill:1:ps-mpa-2');
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-2', 'synchronizationId2');
    await state.onStreamClosed('vint-hill:1:ps-mpa-2');
    sinon.assert.calledWith(terminalHashManager.removeConnectionReferences, 'ICMarkets-Demo1',
      'accountId', state.id, 'vint-hill:1:ps-mpa-2');
    should(state._stateByInstanceIndex['vint-hill:1:ps-mpa-1']).not.eql(undefined);
    should(state._stateByInstanceIndex['vint-hill:1:ps-mpa-2']).eql(undefined);
  });

  /**
   * @test {TerminalState#onDisconnected}
   */
  it('should delete partially synced state on disconnected if there is another fresher state', async () => {
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onConnected('vint-hill:1:ps-mpa-1');
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-2', {'balance': 1000});
    await state.onConnected('vint-hill:1:ps-mpa-2');
    await state.onStreamClosed('vint-hill:1:ps-mpa-1');
    should(state._stateByInstanceIndex['vint-hill:1:ps-mpa-1']).eql(undefined);
    should(state._stateByInstanceIndex['vint-hill:1:ps-mpa-2']).not.eql(undefined);
  });

  /**
   * @test {TerminalState#onDisconnected}
   */
  it('should not delete partially synced state on disconnected if there is no fresher state', async () => {
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', 'shash1', 'phash1', 'ohash1');
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onConnected('vint-hill:1:ps-mpa-1');
    await clock.tickAsync(50);
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-2', 'shash1', 'phash1', 'ohash1');
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-2', {'balance': 1000});
    await state.onConnected('vint-hill:1:ps-mpa-2');
    await state.onDisconnected('vint-hill:1:ps-mpa-2');
    should(state._stateByInstanceIndex['vint-hill:1:ps-mpa-1']).not.eql(undefined);
    should(state._stateByInstanceIndex['vint-hill:1:ps-mpa-2']).not.eql(undefined);
  });

});
