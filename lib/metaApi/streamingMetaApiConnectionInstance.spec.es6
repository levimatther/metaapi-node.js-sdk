'use strict';

import should from 'should';
import sinon from 'sinon';
import StreamingMetaApiConnectionInstance from './streamingMetaApiConnectionInstance';
import TerminalState from './terminalState';
import MemoryHistoryStorage from './memoryHistoryStorage';
import {ValidationError} from '../clients/errorHandler';
import ConnectionHealthMonitor from './connectionHealthMonitor';

/**
 * @test {MetaApiConnection}
 */
// eslint-disable-next-line max-statements
describe('StreamingMetaApiConnectionInstance', () => {
  let sandbox;
  let api;
  let account;
  let clock;
  let connection;
  let subscribedSymbols;
  let terminalState;
  let historyStorage;
  let healthMonitor;
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
    subscribedSymbols = ['EURUSD', 'AUDUSD'];
    terminalState = new TerminalState('accountId', {});
    historyStorage = new MemoryHistoryStorage();
    healthMonitor = new ConnectionHealthMonitor({});
    connection = {
      account,
      terminalState,
      healthMonitor,
      historyStorage,
      subscribedSymbols,
      synchronized: true,
      removeApplication: () => {},
      subscribeToMarketData: () => {},
      unsubscribeFromMarketData: () => {},
      waitSynchronized: () => {},
      subscriptions: () => {},
      connect: () => {},
      close: () => {}
    };
  
    api = new StreamingMetaApiConnectionInstance(client, connection);
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
    sandbox.stub(connection, 'removeApplication').resolves();
    await api.removeApplication();
    sinon.assert.calledOnce(connection.removeApplication);
  });

  /**
   * @test {MetaApiConnection#createMarketBuyOrder}
   */
  it('should create market buy order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createMarketBuyOrder('GBPUSD', 0.07, 0.9, 2.0, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_BUY', symbol: 'GBPUSD',
      volume: 0.07, stopLoss: 0.9, takeProfit: 2.0, comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#createMarketBuyOrder}
   */
  it('should create market buy order with relative SL/TP', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createMarketBuyOrder('GBPUSD', 0.07, {value: 0.1, units: 'RELATIVE_PRICE'},
      {value: 2000, units: 'RELATIVE_POINTS'}, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_BUY', symbol: 'GBPUSD',
      volume: 0.07, stopLoss: 0.1, stopLossUnits: 'RELATIVE_PRICE', takeProfit: 2000,
      takeProfitUnits: 'RELATIVE_POINTS', comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#createMarketSellOrder}
   */
  it('should create market sell order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createMarketSellOrder('GBPUSD', 0.07, 2.0, 0.9, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_SELL', symbol: 'GBPUSD',
      volume: 0.07, stopLoss: 2.0, takeProfit: 0.9, comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#createLimitBuyOrder}
   */
  it('should create limit buy order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createLimitBuyOrder('GBPUSD', 0.07, 1.0, 0.9, 2.0, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_BUY_LIMIT',
      symbol: 'GBPUSD', volume: 0.07, openPrice: 1.0, stopLoss: 0.9, takeProfit: 2.0, comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#createLimitSellOrder}
   */
  it('should create limit sell order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createLimitSellOrder('GBPUSD', 0.07, 1.5, 2.0, 0.9, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_SELL_LIMIT',
      symbol: 'GBPUSD', volume: 0.07, openPrice: 1.5, stopLoss: 2.0, takeProfit: 0.9, comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#createStopBuyOrder}
   */
  it('should create stop buy order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createStopBuyOrder('GBPUSD', 0.07, 1.5, 0.9, 2.0, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_BUY_STOP',
      symbol: 'GBPUSD', volume: 0.07, openPrice: 1.5, stopLoss: 0.9, takeProfit: 2.0, comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#createStopSellOrder}
   */
  it('should create stop sell order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createStopSellOrder('GBPUSD', 0.07, 1.0, 2.0, 0.9, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_SELL_STOP',
      symbol: 'GBPUSD', volume: 0.07, openPrice: 1.0, stopLoss: 2.0, takeProfit: 0.9, comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#createStopLimitBuyOrder}
   */
  it('should create stop limit buy order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createStopLimitBuyOrder('GBPUSD', 0.07, 1.5, 1.4, 0.9, 2.0, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_BUY_STOP_LIMIT',
      symbol: 'GBPUSD', volume: 0.07, openPrice: 1.5, stopLimitPrice: 1.4, stopLoss: 0.9, takeProfit: 2.0,
      comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#createStopLimitSellOrder}
   */
  it('should create stop limit sell order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createStopLimitSellOrder('GBPUSD', 0.07, 1.0, 1.1, 2.0, 0.9, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_SELL_STOP_LIMIT',
      symbol: 'GBPUSD', volume: 0.07, openPrice: 1.0, stopLimitPrice: 1.1, stopLoss: 2.0, takeProfit: 0.9,
      comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#modifyPosition}
   */
  it('should modify position', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      positionId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.modifyPosition('46870472', 2.0, 0.9);
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'POSITION_MODIFY',
      positionId: '46870472', stopLoss: 2.0, takeProfit: 0.9}));
  });

  /**
   * @test {MetaApiConnection#closePositionPartially}
   */
  it('should close position partially', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      positionId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.closePositionPartially('46870472', 0.9, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'POSITION_PARTIAL',
      positionId: '46870472', volume: 0.9, comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#closePosition}
   */
  it('should close position', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      positionId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.closePosition('46870472', {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'POSITION_CLOSE_ID',
      positionId: '46870472', comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#closeBy}
   */
  it('should close position by an opposite one', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      positionId: '46870472',
      closeByPositionId: '46870482'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.closeBy('46870472', '46870482', {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'POSITION_CLOSE_BY',
      positionId: '46870472', closeByPositionId: '46870482', comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#closePositionsBySymbol}
   */
  it('should close positions by symbol', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      positionId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.closePositionsBySymbol('EURUSD', {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'POSITIONS_CLOSE_SYMBOL',
      symbol: 'EURUSD', comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}));
  });

  /**
   * @test {MetaApiConnection#modifyOrder}
   */
  it('should modify order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.modifyOrder('46870472', 1.0, 2.0, 0.9);
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_MODIFY', orderId: '46870472',
      openPrice: 1.0, stopLoss: 2.0, takeProfit: 0.9}));
  });

  /**
   * @test {MetaApiConnection#cancelOrder}
   */
  it('should cancel order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.cancelOrder('46870472');
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_CANCEL', orderId: '46870472'}));
  });

  /**
   * @test {MetaApiConnection#calculateMargin}
   */
  it('should calculate margin', async () => {
    await api.connect();
    let margin = {
      margin: 110
    };
    let order = {
      symbol: 'EURUSD',
      type: 'ORDER_TYPE_BUY',
      volume: 0.1,
      openPrice: 1.1
    };
    sandbox.stub(client, 'calculateMargin').resolves(margin);
    let actual = await api.calculateMargin(order);
    actual.should.match(margin);
    sinon.assert.calledWith(client.calculateMargin, 'accountId', undefined, undefined, sinon.match(order));
  });

  /**
   * @test {MetaApiConnection#saveUptime}
   */
  it('should save uptime stats to the server', async () => {
    await api.connect();
    sandbox.stub(client, 'saveUptime').resolves();
    await api.saveUptime({'1h': 100});
    sinon.assert.calledWith(client.saveUptime, 'accountId', {'1h': 100});
  });

  /**
   * @test {MetaApiConnection#connect}
   */
  it('should connect connection', async () => {
    sandbox.stub(connection, 'connect').resolves();
    await api.connect();
    sinon.assert.calledWith(connection.connect, api.instanceId);
    await api.connect();
    sinon.assert.calledOnce(connection.connect);
  });

  /**
   * @test {MetaApiConnection#connect}
   */
  it('should close if connect failed', async () => {
    sandbox.stub(connection, 'connect').rejects(new ValidationError('test'));
    sandbox.stub(connection, 'close').resolves();
    try {
      await api.connect();
    } catch (err) {
      err.name.should.equal('ValidationError');
    }
    sinon.assert.calledOnce(connection.close);
  });

  /**
   * @test {MetaApiConnection#addSynchronizationListener}
   */
  it('should add synchronization listeners', async () => {
    sandbox.stub(client, 'addSynchronizationListener').returns();
    await api.connect();
    let listener = {};
    api.addSynchronizationListener(listener);
    sinon.assert.calledWith(client.addSynchronizationListener, 'accountId', listener);
  });

  /**
   * @test {MetaApiConnection#removeSynchronizationListener}
   */
  it('should remove synchronization listeners', async () => {
    sandbox.stub(client, 'removeSynchronizationListener').returns();
    await api.connect();
    let listener = {};
    api.removeSynchronizationListener(listener);
    sinon.assert.calledWith(client.removeSynchronizationListener, 'accountId', listener);
  });

  /**
   * @test {MetaApiConnection#close}
   */
  it('should remove synchronization listeners on close', async () => {
    sandbox.stub(connection, 'close').resolves();
    sandbox.stub(client, 'removeSynchronizationListener').resolves();
    let listener = {};
    await api.connect();
    api.addSynchronizationListener(listener);
    await api.close();
    sinon.assert.calledWith(client.removeSynchronizationListener, 'accountId', listener);
    sinon.assert.calledWith(connection.close, api.instanceId);
  });

  /**
   * @test {MetaApiConnection#waitSynchronized}
   */
  it('should wait util synchronization complete', async () => {
    await api.connect();
    sandbox.stub(connection, 'waitSynchronized').resolves();
    const opts = {applicationPattern: 'app.*', synchronizationId: 'synchronizationId',
      timeoutInSeconds: 1, intervalInMilliseconds: 10};
    await api.waitSynchronized(opts);
    sinon.assert.calledWith(connection.waitSynchronized, opts);
  });

  /**
   * @test {MetaApiConnection#subscribeToMarketData}
   */
  it('should subscribe to market data', async () => {
    await api.connect();
    sandbox.stub(connection, 'subscribeToMarketData').resolves();
    await api.subscribeToMarketData('EURUSD', undefined);
    sinon.assert.calledWith(connection.subscribeToMarketData, 'EURUSD', undefined);
  });

  /**
   * @test {MetaApiConnection#unsubscribeFromMarketData}
   */
  it('should unsubscribe from market data', async () => {
    await api.connect();
    sandbox.stub(connection, 'unsubscribeFromMarketData').resolves();
    await api.unsubscribeFromMarketData('EURUSD', [{type: 'quotes'}]);
    sinon.assert.calledWith(connection.unsubscribeFromMarketData, 'EURUSD', [{type: 'quotes'}]);
  });

  /**
   * @test {MetaApiConnection#subscribedSymbols}
   */
  it('should return subscribed symbols', async () => {
    sinon.assert.match(api.subscribedSymbols, subscribedSymbols);
  });

  /**
   * @test {MetaApiConnection#subscriptions}
   */
  it('should return subscriptions', async () => {
    const expected = [{type: 'books'}, {type: 'candles', timeframe: '1m'}];
    sandbox.stub(connection, 'subscriptions').resolves(expected);
    const subscriptions = await api.subscriptions('EURUSD');
    sinon.assert.calledWith(connection.subscriptions, 'EURUSD');
    sinon.assert.match(subscriptions, [{type: 'books'}, {type: 'candles', timeframe: '1m'}]);
  });

  /**
   * @test {MetaApiConnection#terminalState}
   */
  it('should return terminal state', async () => {
    sinon.assert.match(api.terminalState, terminalState);
  });

  /**
   * @test {MetaApiConnection#historyStorage}
   */
  it('should return history storage', async () => {
    sinon.assert.match(api.historyStorage, historyStorage);
  });

  /**
   * @test {MetaApiConnection#synchronized}
   */
  it('should return synchronized flag', async () => {
    sinon.assert.match(api.synchronized, true);
  });

  /**
   * @test {MetaApiConnection#account}
   */
  it('should return account', async () => {
    sinon.assert.match(api.account, account);
  });

  /**
   * @test {MetaApiConnection#healthMonitor}
   */
  it('should return health monitor', async () => {
    api.healthMonitor.should.equal(healthMonitor);
  });

  /**
   * @test {MetaApiConnection#queueEvent}
   */
  it('should queue events', () => {
    sandbox.stub(client, 'queueEvent').returns();
    let eventCallable = () => {};
    api.queueEvent('test', eventCallable);
    sinon.assert.calledOnceWithExactly(client.queueEvent, 'accountId', 'test', eventCallable);
  });

});
