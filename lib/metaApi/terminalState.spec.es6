'use strict';

import should from 'should';
import sinon from 'sinon';
import TerminalState from './terminalState';
import crypto from 'crypto-js';

/**
 * @test {TerminalState}
 */
describe('TerminalState', () => {

  let state;
  const md5 = (arg) => crypto.MD5(arg).toString();

  beforeEach(() => {
    state = new TerminalState();
  });

  /**
   * @test {TerminalState#onConnected}
   * @test {TerminalState#onDisconnected}
   * @test {TerminalState#connected}
   */
  it('should return connection state', () => {
    state.connected.should.be.false();
    state.onConnected('1:ps-mpa-1');
    state.connected.should.be.true();
    state.onDisconnected('1:ps-mpa-1');
    state.connected.should.be.false();
  });

  /**
   * @test {TerminalState#onBrokerConnectionStatus}
   * @test {TerminalState#connectedToBroker}
   */
  it('should return broker connection state', async () => {
    const clock = sinon.useFakeTimers();
    state.connectedToBroker.should.be.false();
    state.onBrokerConnectionStatusChanged('1:ps-mpa-1', true);
    state.connectedToBroker.should.be.true();
    state.onBrokerConnectionStatusChanged('1:ps-mpa-1', false);
    state.connectedToBroker.should.be.false();
    state.onBrokerConnectionStatusChanged('1:ps-mpa-1', true);
    state.onDisconnected('1:ps-mpa-1');
    state.connectedToBroker.should.be.false();
    await clock.tickAsync(65000);
    clock.restore();
  });

  /**
   * @test {TerminalState#onAccountInformationUpdated}
   * @test {TerminalState#accountInformation}
   */
  it('should return account information', () => {
    should.not.exist(state.accountInformation);
    state.onAccountInformationUpdated('1:ps-mpa-1', {balance: 1000});
    state.accountInformation.should.match({balance: 1000});
  });

  /**
   * @test {TerminalState#onPositionUpdated}
   * @test {TerminalState#onPositionRemoved}
   * @test {TerminalState#positions}
   */
  it('should return positions', () => {
    state.positions.length.should.equal(0);
    state.onPositionUpdated('1:ps-mpa-1', {id: '1', profit: 10});
    state.onPositionUpdated('1:ps-mpa-1', {id: '2'});
    state.onPositionUpdated('1:ps-mpa-1', {id: '1', profit: 11});
    state.onPositionRemoved('1:ps-mpa-1', '2');
    state.positions.length.should.equal(1);
    state.positions.should.match([{id: '1', profit: 11}]);
  });

  /**
   * @test {TerminalState#onPendingOrderUpdated}
   * @test {TerminalState#onPendingOrderCompleted}
   * @test {TerminalState#orders}
   */
  it('should return orders', async () => {
    state.orders.length.should.equal(0);
    await state.onPendingOrderUpdated('1:ps-mpa-1', {id: '1', openPrice: 10});
    await state.onPendingOrderUpdated('1:ps-mpa-1', {id: '2'});
    await state.onPendingOrderUpdated('1:ps-mpa-1', {id: '1', openPrice: 11});
    state.orders.length.should.equal(2);
    await state.onPendingOrderCompleted('1:ps-mpa-1', '2');
    state.orders.length.should.equal(1);
    state.orders.should.match([{id: '1', openPrice: 11}]);
  });

  /**
   * @test {TerminalState#onSymbolSpecificationsUpdated}
   * @test {TerminalState#specifications}
   * @test {TerminalState#specification}
   */
  it('should return specifications', () => {
    state.specifications.length.should.equal(0);
    state.onSymbolSpecificationsUpdated('1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.00001}, {symbol: 'GBPUSD'}], []);
    state.onSymbolSpecificationsUpdated('1:ps-mpa-1', [{symbol: 'AUDNZD'}, {symbol: 'EURUSD', 
      tickSize: 0.0001}], ['AUDNZD']);
    state.specifications.length.should.equal(2);
    state.specifications.should.match([{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}]);
    state.specification('EURUSD').should.match({symbol: 'EURUSD', tickSize: 0.0001});
  });

  /**
   * @test {TerminalState#onSymbolPricesUpdated}
   * @test {TerminalState#price}
   */
  it('should return price', () => {
    should.not.exist(state.price('EURUSD'));
    state.onSymbolPricesUpdated('1:ps-mpa-1', [{time: new Date(), symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    state.onSymbolPricesUpdated('1:ps-mpa-1', [{time: new Date(), symbol: 'GBPUSD'}]);
    state.onSymbolPricesUpdated('1:ps-mpa-1', [{time: new Date(), symbol: 'EURUSD', bid: 1, ask: 1.2}]);
    state.price('EURUSD').should.match({symbol: 'EURUSD', bid: 1, ask: 1.2});
  });

  /**
   * @test {TerminalState#onSymbolPricesUpdated}
   * @test {TerminalState#price}
   */
  it('should wait for price', async () => {
    should.not.exist(state.price('EURUSD'));
    let promise = state.waitForPrice('EURUSD');
    state.onSymbolPricesUpdated('1:ps-mpa-1', [{time: new Date(), symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    (await promise).should.match({symbol: 'EURUSD', bid: 1, ask: 1.1});
  });

  /**
   * @test {TerminalState#onSymbolPricesUpdated}
   * @test {TerminalState#accountInformation}
   * @test {TerminalState#positions}
   */
  it('should update account equity and position profit on price update', () => {
    state.onAccountInformationUpdated('1:ps-mpa-1', {equity: 1000, balance: 800});
    state.onPositionsReplaced('1:ps-mpa-1', [{
      id: '1',
      symbol: 'EURUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 9,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    }]);
    state.onPositionUpdated('1:ps-mpa-1', {
      id: '2',
      symbol: 'AUDUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 9,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    });
    state.onPositionsSynchronized('1:ps-mpa-1', 'synchronizationId');
    state.onSymbolSpecificationsUpdated('1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.01, digits: 5},
      {symbol: 'AUDUSD', tickSize: 0.01, digits: 5}], []);
    state.onSymbolPricesUpdated('1:ps-mpa-1', [
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
    state.onAccountInformationUpdated('1:ps-mpa-1', {equity: 1000, balance: 800});
    state.onSymbolPricesUpdated('1:ps-mpa-1', [], 100, 200, 400, 40000);
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
    state.onPendingOrderUpdated('1:ps-mpa-1', {
      id: '1',
      symbol: 'EURUSD',
      type: 'ORDER_TYPE_BUY_LIMIT',
      currentPrice: 9
    });
    state.onPendingOrderUpdated('1:ps-mpa-1', {
      id: '2',
      symbol: 'AUDUSD',
      type: 'ORDER_TYPE_SELL_LIMIT',
      currentPrice: 9
    });
    state.onSymbolSpecificationsUpdated('1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.01}], []);
    state.onSymbolPricesUpdated('1:ps-mpa-1', [{
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
   * @test {TerminalState#onStreamClosed}
   */
  it('should remove state on closed stream', async () => {
    const date = new Date();
    sinon.assert.match(state.price('EURUSD'), undefined);
    await state.onSymbolPricesUpdated('1:ps-mpa-1', [{time: date, symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    sinon.assert.match(state.price('EURUSD'), {time: date, symbol: 'EURUSD', bid: 1, ask: 1.1});
    await state.onStreamClosed('1:ps-mpa-1');
    sinon.assert.match(state.price('EURUSD'), undefined);
  });

  /**
   * @test {TerminalState#onSynchronizationStarted}
   */
  it('should reset state on synchronization started event', async () => {
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
    await state.onAccountInformationUpdated('1:ps-mpa-1', {'balance': 1000});
    await state.onSymbolSpecificationsUpdated('1:ps-mpa-1', [specification], []);
    await state.onPositionsReplaced('1:ps-mpa-1', positions);
    await state.onPendingOrdersReplaced('1:ps-mpa-1', orders);
    sinon.assert.match(state.accountInformation, {balance: 1000});
    sinon.assert.match(state.specification('EURUSD'), specification);
    await state.onSynchronizationStarted('1:ps-mpa-1', false, false, false);
    sinon.assert.match(state.accountInformation, undefined);
    sinon.assert.match(state.specification('EURUSD'), specification);
    sinon.assert.match(state.orders, orders);
    sinon.assert.match(state.positions, positions);
    await state.onSynchronizationStarted('1:ps-mpa-1', true, false, false);
    sinon.assert.match(state.specification('EURUSD'), undefined);
    sinon.assert.match(state.orders, orders);
    sinon.assert.match(state.positions, positions);
    await state.onSynchronizationStarted('1:ps-mpa-1', true, false, true);
    sinon.assert.match(state.orders, []);
    sinon.assert.match(state.positions, positions);
    await state.onSynchronizationStarted('1:ps-mpa-1', true, true, true);
    sinon.assert.match(state.positions, []);
  });

  /**
   * @test {TerminalState#getHashes}
   */
  it('should return hashes for terminal state data for cloud-g1 accounts', async () => {
    const emptyHash = 'd751713988987e9331980363e24189ce';
    const specificationsHash = md5('[{"symbol":"AUDNZD","tickSize":0.01000000},{"symbol":"EURUSD",' +
      '"tickSize":0.00000100,"contractSize":1.00000000,"maxVolume":30000.00000000,' +
      '"hedgedMarginUsesLargerLeg":false,"digits":3}]');
    const positionsHash = md5('[{"id":"46214692","type":"POSITION_TYPE_BUY","symbol":"GBPUSD","magic":1000,' +
      '"openPrice":1.26101000,"volume":0.07000000,"swap":0.00000000,"commission":-0.25000000,' +
      '"stopLoss":1.17721000}]');
    const ordersHash = md5('[{"id":"46871284","type":"ORDER_TYPE_BUY_LIMIT","state":"ORDER_STATE_PLACED",' +
      '"symbol":"AUDNZD","magic":123456,"platform":"mt5","openPrice":1.03000000,' +
      '"volume":0.01000000,"currentVolume":0.01000000}]');
    let hashes = state.getHashes('cloud-g1');
    sinon.assert.match(hashes.specificationsMd5, emptyHash);
    sinon.assert.match(hashes.positionsMd5, emptyHash);
    sinon.assert.match(hashes.ordersMd5, emptyHash);
    await state.onSymbolSpecificationsUpdated('1:ps-mpa-1', [
      {symbol: 'AUDNZD', tickSize: 0.01, description: 'Test1'},
      {symbol: 'EURUSD', tickSize: 0.000001, contractSize: 1, maxVolume: 30000,
        hedgedMarginUsesLargerLeg: false, digits: 3, description: 'Test2'}], []);
    await state.onPositionsReplaced('1:ps-mpa-1', [{
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
      realizedProfit: -6.536993168992922e-13,
      updateSequenceNumber: 13246,
      accountCurrencyExchangeRate: 1,
      comment: 'test',
      originalComment: 'test2',
    }]);
    await state.onPendingOrdersReplaced('1:ps-mpa-1', [{
      id: '46871284',
      type: 'ORDER_TYPE_BUY_LIMIT',
      state: 'ORDER_STATE_PLACED',
      symbol: 'AUDNZD',
      magic: 123456,
      platform: 'mt5',
      time: '2020-04-20T08:38:58.270Z',
      openPrice: 1.03,
      currentPrice: 1.05206,
      volume: 0.01,
      currentVolume: 0.01,
      comment: 'COMMENT2',
      updateSequenceNumber: 13246,
      accountCurrencyExchangeRate: 1,
      originalComment: 'test2',
      clientId: 'TE_GBPUSD_7hyINWqAlE',
    }]);
    hashes = state.getHashes('cloud-g1');
    sinon.assert.match(hashes.specificationsMd5, specificationsHash);
    sinon.assert.match(hashes.positionsMd5, positionsHash);
    sinon.assert.match(hashes.ordersMd5, ordersHash);
  });

  /**
   * @test {TerminalState#getHashes}
   */
  it('should return hashes for terminal state data for cloud-g2 accounts', async () => {
    const emptyHash = 'd751713988987e9331980363e24189ce';
    const specificationsHash = md5('[{"symbol":"AUDNZD","tickSize":0.01,"description":"Test1"},' +
      '{"symbol":"EURUSD","tickSize":0.000001,"contractSize":1,"maxVolume":30000,' +
      '"hedgedMarginUsesLargerLeg":false,"digits":3,"description":"Test2"}]');
    const positionsHash = md5('[{"id":"46214692","type":"POSITION_TYPE_BUY","symbol":"GBPUSD","magic":1000,' +
      '"time":"2020-04-15T02:45:06.521Z","updateTime":"2020-04-15T02:45:06.521Z","openPrice":1.26101,' + 
      '"volume":0.07,"swap":0,"commission":-0.25,"stopLoss":1.17721}]');
    const ordersHash = md5('[{"id":"46871284","type":"ORDER_TYPE_BUY_LIMIT","state":"ORDER_STATE_PLACED",' +
      '"symbol":"AUDNZD","magic":123456,"platform":"mt5","time":"2020-04-20T08:38:58.270Z","openPrice":1.03,' +
      '"volume":0.01,"currentVolume":0.01}]');
    let hashes = state.getHashes('cloud-g2');
    sinon.assert.match(hashes.specificationsMd5, emptyHash);
    sinon.assert.match(hashes.positionsMd5, emptyHash);
    sinon.assert.match(hashes.ordersMd5, emptyHash);
    await state.onSymbolSpecificationsUpdated('1:ps-mpa-1', [
      {symbol: 'AUDNZD', tickSize: 0.01, description: 'Test1'},
      {symbol: 'EURUSD', tickSize: 0.000001, contractSize: 1, maxVolume: 30000,
        hedgedMarginUsesLargerLeg: false, digits: 3, description: 'Test2'}], []);
    await state.onPositionsReplaced('1:ps-mpa-1', [{
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
      realizedProfit: -6.536993168992922e-13,
      updateSequenceNumber: 13246,
      accountCurrencyExchangeRate: 1,
      comment: 'test',
      originalComment: 'test2',
    }]);
    await state.onPendingOrdersReplaced('1:ps-mpa-1', [{
      id: '46871284',
      type: 'ORDER_TYPE_BUY_LIMIT',
      state: 'ORDER_STATE_PLACED',
      symbol: 'AUDNZD',
      magic: 123456,
      platform: 'mt5',
      time: '2020-04-20T08:38:58.270Z',
      openPrice: 1.03,
      currentPrice: 1.05206,
      volume: 0.01,
      currentVolume: 0.01,
      comment: 'COMMENT2',
      updateSequenceNumber: 13246,
      accountCurrencyExchangeRate: 1,
      originalComment: 'test2',
      clientId: 'TE_GBPUSD_7hyINWqAlE',
    }]);
    hashes = state.getHashes('cloud-g2');
    sinon.assert.match(hashes.specificationsMd5, specificationsHash);
    sinon.assert.match(hashes.positionsMd5, positionsHash);
    sinon.assert.match(hashes.ordersMd5, ordersHash);
  });

});
