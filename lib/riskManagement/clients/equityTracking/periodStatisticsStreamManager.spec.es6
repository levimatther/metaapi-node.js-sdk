'use strict';

import sinon from 'sinon';
import PeriodStatisticsListener from './periodStatisticsListener';
import PeriodStatisticsStreamManager from './periodStatisticsStreamManager';
import TimeoutError from '../../../clients/timeoutError';
import { NotFoundError } from '../../../clients/errorHandler';
import MemoryHistoryStorage from '../../../metaApi/memoryHistoryStorage';

/**
 * @test {PeriodStatisticsStreamManager}
 */
// eslint-disable-next-line max-statements
describe('PeriodStatisticsStreamManager', () => {

  let periodStatisticsStreamManager;
  let domainClient;
  let equityTrackingClient;
  let updatedStub;
  let completedStub;
  let trackerCompletedStub;
  let connectedStub;
  let disconnectedStub;
  let errorStub;
  let listener;
  let sandbox;
  let getAccountStub;
  let account;
  let connection;
  let clock;
  let getPeriodStatisticsStub;
  let getTrackerStub;
  let syncListeners = [];
  const token = 'token';
  const domain = 'agiliumtrade.agiliumtrade.ai';
  let results; 
  let accountInformation = {
    broker: 'True ECN Trading Ltd',
    currency: 'USD',
    server: 'ICMarketsSC-Demo',
    balance: 11000,
    equity: 7306.649913200001,
    margin: 184.1,
    freeMargin: 7120.22,
    leverage: 100,
    marginLevel: 3967.58283542
  };
  let metaApi = {
    metatraderAccountApi: {
      getAccount: () => {}
    }
  };

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    clock = sandbox.useFakeTimers({shouldAdvanceTime: true});
    updatedStub = sinon.stub();
    completedStub = sinon.stub();
    trackerCompletedStub = sinon.stub();
    connectedStub = sinon.stub();
    disconnectedStub = sinon.stub();
    errorStub = sinon.stub();
    syncListeners = [];

    class Listener extends PeriodStatisticsListener {
      async onPeriodStatisticsUpdated(periodStatisticsEvent) {
        updatedStub(periodStatisticsEvent);
      }

      async onPeriodStatisticsCompleted(periodStatisticsEvent) {
        completedStub(periodStatisticsEvent);
      }

      async onTrackerCompleted(){
        trackerCompletedStub();
      }

      async onConnected(instanceIndex) {
        connectedStub(instanceIndex);
      }
    
      async onDisconnected(instanceIndex) {
        disconnectedStub(instanceIndex);
      }

      async onError(error) {
        errorStub(error);
      }

    }

    listener = new Listener('accountId', 'tracker1');
    domainClient = {
      domain, token
    };
    equityTrackingClient = {
      getTrackingStatistics: () => {},
      getTracker: () => {}
    };
    getPeriodStatisticsStub = sandbox.stub(equityTrackingClient, 'getTrackingStatistics');
    getTrackerStub = sandbox.stub(equityTrackingClient, 'getTracker');
    getTrackerStub.resolves({
      name: 'trackerName2',
      _id: 'tracker2',
      startBrokerTime: '2020-05-11 12:00:00.000',
      endBrokerTime: '2020-05-12 11:57:59.999'
    });
    periodStatisticsStreamManager = new PeriodStatisticsStreamManager(domainClient, equityTrackingClient, metaApi);
    account = {
      waitDeployed: () => {},
      getStreamingConnection: () => {}
    };
    connection = {
      addSynchronizationListener: (l) => {
        syncListeners.push(l);
      },
      removeSynchronizationListener: () => {},
      connect: () => {},
      waitSynchronized: () => {},
      close: () => {},
      terminalState: {
        accountInformation
      },
      healthMonitor: {
        healthStatus: {
          synchronized: true
        }
      },
      historyStorage: new MemoryHistoryStorage()
    };
    getAccountStub = sandbox.stub(metaApi.metatraderAccountApi,
      'getAccount').resolves(account);
    sandbox.stub(account, 'getStreamingConnection').returns(connection);
    sandbox.stub(connection, 'close').resolves();

    results = [
      {
        endBrokerTime: '2020-05-12 11:59:59.999',
        initialBalance: 10000,
        maxAbsoluteDrawdown: 200,
        maxAbsoluteProfit: 500,
        maxDrawdownTime: '2020-05-11 14:00:00.000',
        maxProfitTime: '2020-05-11 14:00:00.000',
        maxRelativeDrawdown: 0.05,
        maxRelativeProfit: 0.1,
        period: 'day',
        startBrokerTime: '2020-05-11 12:00:00.000',
        thresholdExceeded: false,
        tradeDayCount: 0
      },
      {
        endBrokerTime: '2020-05-11 11:59:59.999',
        initialBalance: 10000,
        maxAbsoluteDrawdown: 200,
        maxAbsoluteProfit: 500,
        maxDrawdownTime: '2020-05-10 14:00:00.000',
        maxProfitTime: '2020-05-10 14:00:00.000',
        maxRelativeDrawdown: 0.05,
        maxRelativeProfit: 0.1,
        period: 'day',
        startBrokerTime: '2020-05-10 12:00:00.000',
        thresholdExceeded: false,
        tradeDayCount: 0
      }
    ];
    getPeriodStatisticsStub.resolves(results);
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should add listener and request events', async () => {
    const listenerId = periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    await clock.tickAsync(100);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
    sinon.assert.calledWith(updatedStub, results);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should process price events if new data received', async () => {
    const listenerId = periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    await clock.tickAsync(100);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledOnce(updatedStub);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.calledOnce(updatedStub);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    await clock.tickAsync(1000);
    sinon.assert.calledWith(updatedStub, [{
      startBrokerTime: '2020-05-11 12:00:00.000',
      endBrokerTime: '2020-05-12 11:59:59.999',
      period: 'day',
      initialBalance: 10000,
      maxDrawdownTime: '2020-05-12 11:55:00.000',
      maxAbsoluteDrawdown: 1000,
      maxRelativeDrawdown: 0.1,
      maxProfitTime: '2020-05-11 14:00:00.000',
      maxAbsoluteProfit: 500,
      maxRelativeProfit: 0.1,
      thresholdExceeded: false,
      exceededThresholdType: undefined,
      tradeDayCount: 0
    }]);
    sinon.assert.calledTwice(updatedStub);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should process price events within tracker limits', async () => {
    const listenerId = periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker2');
    await clock.tickAsync(100);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledOnce(updatedStub);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-09 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledOnce(updatedStub);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledTwice(updatedStub);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:58:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledTwice(updatedStub);
    sinon.assert.calledOnce(trackerCompletedStub);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should process balance deals', async () => {
    const listenerId = periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    await clock.tickAsync(100);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledOnce(updatedStub);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledTwice(updatedStub);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledTwice(updatedStub);
    sinon.assert.calledWith(updatedStub, [{
      endBrokerTime: '2020-05-12 11:59:59.999',
      exceededThresholdType: undefined,
      initialBalance: 10000,
      maxAbsoluteDrawdown: 1000,
      maxAbsoluteProfit: 500,
      maxDrawdownTime: '2020-05-12 11:55:00.000',
      maxProfitTime: '2020-05-11 14:00:00.000',
      maxRelativeDrawdown: 0.1,
      maxRelativeProfit: 0.1,
      period: 'day',
      startBrokerTime: '2020-05-11 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }]);
    await syncListeners[0].onDealAdded('vint-hill:1:ps-mpa-1', {
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      commission: -0.25,
      entryType: 'DEAL_ENTRY_IN',
      id: '33230099',
      magic: 1000,
      platform: 'mt5',
      orderId: '46214692',
      positionId: '46214692',
      price: 1.26101,
      profit: 500,
      swap: 0,
      symbol: 'GBPUSD',
      time: new Date('2020-04-15T02:45:06.521Z'),
      type: 'DEAL_TYPE_BALANCE',
      volume: 0.07
    });
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:05.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledThrice(updatedStub);
    sinon.assert.calledWith(updatedStub, [{
      endBrokerTime: '2020-05-12 11:59:59.999',
      exceededThresholdType: undefined,
      initialBalance: 10000,
      maxAbsoluteDrawdown: 1500,
      maxAbsoluteProfit: 500,
      maxDrawdownTime: '2020-05-12 11:55:05.000',
      maxProfitTime: '2020-05-11 14:00:00.000',
      maxRelativeDrawdown: 0.15,
      maxRelativeProfit: 0.1,
      period: 'day',
      startBrokerTime: '2020-05-11 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }]);
    await clock.tickAsync(1000);
    getPeriodStatisticsStub.resolves([{
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false
    }, results[0]]);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 12:01:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.callCount(updatedStub, 4);
    sinon.assert.calledOnce(completedStub);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 12:02:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 11000
    });
    sinon.assert.callCount(updatedStub, 4);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  // eslint-disable-next-line max-statements
  it('should process balance deals on multiple trackers', async () => {
    const updatedStub2 = sinon.stub();
    const completedStub2 = sinon.stub();
    const trackerCompletedStub2 = sinon.stub();
    const connectedStub2 = sinon.stub();
    const disconnectedStub2 = sinon.stub();
    const errorStub2 = sinon.stub();

    const updatedStub3 = sinon.stub();
    const completedStub3 = sinon.stub();
    const trackerCompletedStub3 = sinon.stub();
    const connectedStub3 = sinon.stub();
    const disconnectedStub3 = sinon.stub();
    const errorStub3 = sinon.stub();

    class Listener2 extends PeriodStatisticsListener {
      async onPeriodStatisticsUpdated(periodStatisticsEvent) {
        updatedStub2(periodStatisticsEvent);
      }

      async onPeriodStatisticsCompleted(periodStatisticsEvent) {
        completedStub2(periodStatisticsEvent);
      }

      async onTrackerCompleted(){
        trackerCompletedStub2();
      }

      async onConnected(instanceIndex) {
        connectedStub2(instanceIndex);
      }
    
      async onDisconnected(instanceIndex) {
        disconnectedStub2(instanceIndex);
      }

      async onError(error) {
        errorStub2(error);
      }

    }

    class Listener3 extends PeriodStatisticsListener {
      async onPeriodStatisticsUpdated(periodStatisticsEvent) {
        updatedStub3(periodStatisticsEvent);
      }

      async onPeriodStatisticsCompleted(periodStatisticsEvent) {
        completedStub3(periodStatisticsEvent);
      }

      async onTrackerCompleted(){
        trackerCompletedStub3();
      }

      async onConnected(instanceIndex) {
        connectedStub3(instanceIndex);
      }
    
      async onDisconnected(instanceIndex) {
        disconnectedStub3(instanceIndex);
      }

      async onError(error) {
        errorStub3(error);
      }

    }
    const listener2 = new Listener2('accountId', 'tracker2');
    const listener3 = new Listener3('accountId', 'tracker1');
    const [listenerId, listenerId2, listenerId3] = await Promise.all([
      periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1'),
      periodStatisticsStreamManager.addPeriodStatisticsListener(listener2, 'accountId', 'tracker2'),
      periodStatisticsStreamManager.addPeriodStatisticsListener(listener3, 'accountId', 'tracker1')
    ]);
    await clock.tickAsync(100);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledOnce(updatedStub);
    const trackerListeners = periodStatisticsStreamManager.getTrackerListeners('accountId', 'tracker1');
    sinon.assert.match(trackerListeners, {
      [listenerId]: listener,
      [listenerId3]: listener3
    });
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledOnce(updatedStub2);
    sinon.assert.calledTwice(updatedStub);
    sinon.assert.calledTwice(updatedStub3);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledOnce(updatedStub2);
    sinon.assert.calledTwice(updatedStub);
    sinon.assert.calledTwice(updatedStub3);
    sinon.assert.calledWith(updatedStub, [{
      endBrokerTime: '2020-05-12 11:59:59.999',
      exceededThresholdType: undefined,
      initialBalance: 10000,
      maxAbsoluteDrawdown: 1000,
      maxAbsoluteProfit: 500,
      maxDrawdownTime: '2020-05-12 11:55:00.000',
      maxProfitTime: '2020-05-11 14:00:00.000',
      maxRelativeDrawdown: 0.1,
      maxRelativeProfit: 0.1,
      period: 'day',
      startBrokerTime: '2020-05-11 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }]);
    await syncListeners[0].onDealAdded('vint-hill:1:ps-mpa-1', {
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      commission: -0.25,
      entryType: 'DEAL_ENTRY_IN',
      id: '33230099',
      magic: 1000,
      platform: 'mt5',
      orderId: '46214692',
      positionId: '46214692',
      price: 1.26101,
      profit: 500,
      swap: 0,
      symbol: 'GBPUSD',
      time: new Date('2020-04-15T02:45:06.521Z'),
      type: 'DEAL_TYPE_BALANCE',
      volume: 0.07
    });
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:05.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledOnce(updatedStub2);
    sinon.assert.calledThrice(updatedStub);
    sinon.assert.calledThrice(updatedStub3);
    sinon.assert.calledWith(updatedStub, [{
      endBrokerTime: '2020-05-12 11:59:59.999',
      exceededThresholdType: undefined,
      initialBalance: 10000,
      maxAbsoluteDrawdown: 1500,
      maxAbsoluteProfit: 500,
      maxDrawdownTime: '2020-05-12 11:55:05.000',
      maxProfitTime: '2020-05-11 14:00:00.000',
      maxRelativeDrawdown: 0.15,
      maxRelativeProfit: 0.1,
      period: 'day',
      startBrokerTime: '2020-05-11 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }]);
    await clock.tickAsync(1000);
    getPeriodStatisticsStub.resolves([{
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false
    }, results[0]]);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 12:01:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.calledOnce(updatedStub2);
    sinon.assert.notCalled(completedStub2);
    sinon.assert.callCount(updatedStub, 4);
    sinon.assert.calledOnce(completedStub);
    sinon.assert.callCount(updatedStub3, 4);
    sinon.assert.calledOnce(completedStub3);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 12:02:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 11000
    });
    await syncListeners[1].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledTwice(updatedStub2);
    sinon.assert.callCount(updatedStub, 4);
    sinon.assert.callCount(updatedStub3, 4);
    await syncListeners[1].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledTwice(updatedStub2);
    sinon.assert.callCount(updatedStub, 4);
    sinon.assert.callCount(updatedStub3, 4);
    sinon.assert.calledWith(updatedStub, [{
      endBrokerTime: '2020-05-12 11:59:59.999',
      exceededThresholdType: undefined,
      initialBalance: 10000,
      maxAbsoluteDrawdown: 1000,
      maxAbsoluteProfit: 500,
      maxDrawdownTime: '2020-05-12 11:55:00.000',
      maxProfitTime: '2020-05-11 14:00:00.000',
      maxRelativeDrawdown: 0.1,
      maxRelativeProfit: 0.1,
      period: 'day',
      startBrokerTime: '2020-05-11 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }]);
    await syncListeners[1].onDealAdded('vint-hill:1:ps-mpa-1', {
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      commission: -0.25,
      entryType: 'DEAL_ENTRY_IN',
      id: '33230099',
      magic: 1000,
      platform: 'mt5',
      orderId: '46214692',
      positionId: '46214692',
      price: 1.26101,
      profit: 500,
      swap: 0,
      symbol: 'GBPUSD',
      time: new Date('2020-04-15T02:45:06.521Z'),
      type: 'DEAL_TYPE_BALANCE',
      volume: 0.07
    });
    await syncListeners[1].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:05.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledThrice(updatedStub2);
    sinon.assert.callCount(updatedStub, 4);
    sinon.assert.callCount(updatedStub3, 4);
    sinon.assert.calledWith(updatedStub, [{
      endBrokerTime: '2020-05-12 11:59:59.999',
      exceededThresholdType: undefined,
      initialBalance: 10000,
      maxAbsoluteDrawdown: 1500,
      maxAbsoluteProfit: 500,
      maxDrawdownTime: '2020-05-12 11:55:05.000',
      maxProfitTime: '2020-05-11 14:00:00.000',
      maxRelativeDrawdown: 0.15,
      maxRelativeProfit: 0.1,
      period: 'day',
      startBrokerTime: '2020-05-11 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }]);
    await clock.tickAsync(1000);
    getPeriodStatisticsStub.resolves([{
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false
    }, results[0]]);
    await syncListeners[1].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 12:01:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.callCount(updatedStub2, 4);
    sinon.assert.calledOnce(completedStub2);
    sinon.assert.callCount(updatedStub, 4);
    sinon.assert.calledOnce(completedStub);
    sinon.assert.callCount(updatedStub3, 4);
    sinon.assert.calledOnce(completedStub3);
    await syncListeners[1].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 12:02:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 11000
    });
    sinon.assert.match(syncListeners.length, 2);
    sinon.assert.calledOnce(connection.close);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should remove sync listeners when all tracker listeners are removed', async () => {
    sandbox.stub(connection, 'removeSynchronizationListener').returns();
    const updatedStub2 = sinon.stub();
    const completedStub2 = sinon.stub();
    const trackerCompletedStub2 = sinon.stub();
    const connectedStub2 = sinon.stub();
    const disconnectedStub2 = sinon.stub();
    const errorStub2 = sinon.stub();

    const updatedStub3 = sinon.stub();
    const completedStub3 = sinon.stub();
    const trackerCompletedStub3 = sinon.stub();
    const connectedStub3 = sinon.stub();
    const disconnectedStub3 = sinon.stub();
    const errorStub3 = sinon.stub();

    class Listener2 extends PeriodStatisticsListener {
      async onPeriodStatisticsUpdated(periodStatisticsEvent) {
        updatedStub2(periodStatisticsEvent);
      }

      async onPeriodStatisticsCompleted(periodStatisticsEvent) {
        completedStub2(periodStatisticsEvent);
      }

      async onTrackerCompleted(){
        trackerCompletedStub2();
      }

      async onConnected(instanceIndex) {
        connectedStub2(instanceIndex);
      }
    
      async onDisconnected(instanceIndex) {
        disconnectedStub2(instanceIndex);
      }

      async onError(error) {
        errorStub2(error);
      }

    }

    class Listener3 extends PeriodStatisticsListener {
      async onPeriodStatisticsUpdated(periodStatisticsEvent) {
        updatedStub3(periodStatisticsEvent);
      }

      async onPeriodStatisticsCompleted(periodStatisticsEvent) {
        completedStub3(periodStatisticsEvent);
      }

      async onTrackerCompleted(){
        trackerCompletedStub3();
      }

      async onConnected(instanceIndex) {
        connectedStub3(instanceIndex);
      }
    
      async onDisconnected(instanceIndex) {
        disconnectedStub3(instanceIndex);
      }

      async onError(error) {
        errorStub3(error);
      }

    }
    const listener2 = new Listener2('accountId', 'tracker2');
    const listener3 = new Listener3('accountId', 'tracker1');
    const listenerId = await periodStatisticsStreamManager.addPeriodStatisticsListener(listener,
      'accountId', 'tracker1');
    const listenerId2 = await periodStatisticsStreamManager.addPeriodStatisticsListener(listener2,
      'accountId', 'tracker2');
    const listenerId3 = await periodStatisticsStreamManager.addPeriodStatisticsListener(listener3,
      'accountId', 'tracker1');
    await clock.tickAsync(100);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledOnce(updatedStub);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9000
    });
    sinon.assert.calledOnce(updatedStub2);
    sinon.assert.calledTwice(updatedStub);
    sinon.assert.calledTwice(updatedStub3);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
    sinon.assert.notCalled(connection.removeSynchronizationListener);
    sinon.assert.notCalled(connection.close);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId3);
    sinon.assert.calledOnce(connection.removeSynchronizationListener);
    sinon.assert.notCalled(connection.close);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId2);
    sinon.assert.calledTwice(connection.removeSynchronizationListener);
    sinon.assert.calledOnce(connection.close);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should process price events if period completed', async () => {
    const listenerId = periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    await clock.tickAsync(100);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    getPeriodStatisticsStub.resolves([{
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }, results[0]]);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 12:01:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledOnce(completedStub);
    sinon.assert.calledWith(updatedStub, [results[0], {
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }]);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should retry on synchronization error', async () => {
    sandbox.stub(account, 'waitDeployed')
      .onFirstCall().rejects(new TimeoutError())
      .onSecondCall().rejects(new TimeoutError())
      .onThirdCall().resolves();
    const listenerId = periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    await clock.tickAsync(5000);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledTwice(errorStub);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should retry on get period statistics error', async () => {
    getPeriodStatisticsStub
      .onFirstCall().rejects(new TimeoutError())
      .onSecondCall().rejects(new TimeoutError())
      .onThirdCall().resolves(results);
    const listenerId = periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    await clock.tickAsync(400000);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledTwice(errorStub);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should return error if account not found', async () => {
    getAccountStub.rejects(new NotFoundError());
    try {
      await periodStatisticsStreamManager.addPeriodStatisticsListener(listener,
        'accountId', 'tracker1');
      sinon.assert.fail();
    } catch (err) {
      err.name.should.equal('NotFoundError');
    }
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should return error if failed to return trackers', async () => {
    getTrackerStub.rejects(new TimeoutError());
    try {
      await periodStatisticsStreamManager.addPeriodStatisticsListener(listener,
        'accountId', 'tracker1');
      sinon.assert.fail();
    } catch (err) {
      err.name.should.equal('TimeoutError');
    }
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should return error if tracker not found', async () => {
    getTrackerStub.rejects(new NotFoundError());
    try {
      await periodStatisticsStreamManager.addPeriodStatisticsListener(listener,
        'accountId', 'tracker1');
      sinon.assert.fail();
    } catch (err) {
      err.name.should.equal('NotFoundError');
    }
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should record if absolute drawdown threshold exceeded', async () => {
    getTrackerStub.resolves({name: 'trackerName1', _id: 'tracker1', absoluteDrawdownThreshold: 500});
    const listenerId = periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    await clock.tickAsync(100);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9400
    });
    await clock.tickAsync(1000);
    getPeriodStatisticsStub.resolves([{
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }, results[0]]);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 12:01:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledWith(updatedStub, [{
      endBrokerTime: '2020-05-12 11:59:59.999',
      initialBalance: 10000,
      maxAbsoluteDrawdown: 600,
      maxAbsoluteProfit: 500,
      maxDrawdownTime: '2020-05-12 11:55:00.000',
      maxProfitTime: '2020-05-11 14:00:00.000',
      maxRelativeDrawdown: 0.06,
      maxRelativeProfit: 0.1,
      period: 'day',
      startBrokerTime: '2020-05-11 12:00:00.000',
      exceededThresholdType: 'drawdown',
      thresholdExceeded: true,
      tradeDayCount: 0
    }]);
    sinon.assert.calledWith(updatedStub, [results[0], {
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }]);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should record if relative drawdown threshold exceeded', async () => {
    getTrackerStub.resolves({name: 'trackerName1', _id: 'tracker1', relativeDrawdownThreshold: 0.05});
    const listenerId = periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    await clock.tickAsync(100);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9400
    });
    await clock.tickAsync(1000);
    getPeriodStatisticsStub.resolves([{
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }, results[0]]);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 12:01:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledWith(updatedStub, [{
      endBrokerTime: '2020-05-12 11:59:59.999',
      initialBalance: 10000,
      maxAbsoluteDrawdown: 600,
      maxAbsoluteProfit: 500,
      maxDrawdownTime: '2020-05-12 11:55:00.000',
      maxProfitTime: '2020-05-11 14:00:00.000',
      maxRelativeDrawdown: 0.06,
      maxRelativeProfit: 0.1,
      period: 'day',
      startBrokerTime: '2020-05-11 12:00:00.000',
      exceededThresholdType: 'drawdown',
      thresholdExceeded: true,
      tradeDayCount: 0
    }]);
    sinon.assert.calledWith(updatedStub, [results[0], {
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }]);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should record if absolute profit threshold exceeded', async () => {
    getTrackerStub.resolves({name: 'trackerName1', _id: 'tracker1', absoluteProfitThreshold: 500});
    const listenerId = periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    await clock.tickAsync(100);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10600
    });
    await clock.tickAsync(1000);
    getPeriodStatisticsStub.resolves([{
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }, results[0]]);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 12:01:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledWith(updatedStub, [{
      endBrokerTime: '2020-05-12 11:59:59.999',
      initialBalance: 10000,
      maxAbsoluteDrawdown: 200,
      maxAbsoluteProfit: 600,
      maxProfitTime: '2020-05-12 11:55:00.000',
      maxDrawdownTime: '2020-05-11 14:00:00.000',
      maxRelativeDrawdown: 0.05,
      maxRelativeProfit: 0.06,
      period: 'day',
      startBrokerTime: '2020-05-11 12:00:00.000',
      exceededThresholdType: 'profit',
      thresholdExceeded: true,
      tradeDayCount: 0
    }]);
    sinon.assert.calledWith(updatedStub, [results[0], {
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }]);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should record if relative profit threshold exceeded', async () => {
    getTrackerStub.resolves({name: 'trackerName1', _id: 'tracker1', relativeProfitThreshold: 0.05});
    const listenerId = periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    await clock.tickAsync(100);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10600
    });
    await clock.tickAsync(1000);
    getPeriodStatisticsStub.resolves([{
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }, results[0]]);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 12:01:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledWith(updatedStub, [{
      endBrokerTime: '2020-05-12 11:59:59.999',
      initialBalance: 10000,
      maxAbsoluteDrawdown: 200,
      maxAbsoluteProfit: 600,
      maxProfitTime: '2020-05-12 11:55:00.000',
      maxDrawdownTime: '2020-05-11 14:00:00.000',
      maxRelativeDrawdown: 0.05,
      maxRelativeProfit: 0.06,
      period: 'day',
      startBrokerTime: '2020-05-11 12:00:00.000',
      exceededThresholdType: 'profit',
      thresholdExceeded: true,
      tradeDayCount: 0
    }]);
    sinon.assert.calledWith(updatedStub, [results[0], {
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }]);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should not rewrite record exceeded event', async () => {
    getTrackerStub.resolves({name: 'trackerName1', _id: 'tracker1',
      absoluteDrawdownThreshold: 500, absoluteProfitThreshold: 500});
    const listenerId = periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    await clock.tickAsync(100);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 9400
    });
    await clock.tickAsync(1000);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 11:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10600
    });
    await clock.tickAsync(1000);
    getPeriodStatisticsStub.resolves([{
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }, results[0]]);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-12 12:01:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.calledWith(updatedStub, results);
    sinon.assert.calledWith(updatedStub, [{
      endBrokerTime: '2020-05-12 11:59:59.999',
      initialBalance: 10000,
      maxAbsoluteDrawdown: 600,
      maxAbsoluteProfit: 500,
      maxDrawdownTime: '2020-05-12 11:55:00.000',
      maxProfitTime: '2020-05-11 14:00:00.000',
      maxRelativeDrawdown: 0.06,
      maxRelativeProfit: 0.1,
      period: 'day',
      startBrokerTime: '2020-05-11 12:00:00.000',
      exceededThresholdType: 'drawdown',
      thresholdExceeded: true,
      tradeDayCount: 0
    }]);
    sinon.assert.calledWith(updatedStub, [results[0], {
      endBrokerTime: '2020-05-13 11:59:59.999',
      initialBalance: 10000,
      period: 'day',
      startBrokerTime: '2020-05-12 12:00:00.000',
      thresholdExceeded: false,
      tradeDayCount: 0
    }]);
    periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should track connection state', async () => {
    periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    await clock.tickAsync(100);
    await syncListeners[0].onDealsSynchronized('vint-hill:1:ps-mpa-1');
    sinon.assert.calledOnce(connectedStub);
    await syncListeners[0].onDealsSynchronized('vint-hill:1:ps-mpa-1');
    sinon.assert.calledOnce(connectedStub);
    await syncListeners[0].onDisconnected('vint-hill:1:ps-mpa-1');
    sinon.assert.notCalled(disconnectedStub);
    await syncListeners[0].onDisconnected('vint-hill:1:ps-mpa-1');
    sinon.assert.notCalled(disconnectedStub);
    connection.healthMonitor.healthStatus.synchronized = false;
    await syncListeners[0].onDisconnected('vint-hill:1:ps-mpa-1');
    sinon.assert.calledOnce(disconnectedStub);
    await syncListeners[0].onDealsSynchronized('vint-hill:1:ps-mpa-1');
    sinon.assert.calledTwice(connectedStub);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should send an update event if a new deal arrived', async () => {
    periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    const dealBalance = {
      id: '200745237',
      platform: 'mt5',
      type: 'DEAL_TYPE_BALANCE',
      time: new Date('2022-05-11T13:00:00.000Z'),
      brokerTime: '2020-05-11 16:00:00.000',
      commission: -3.5,
      swap: 0,
      profit: 0,
      symbol: 'EURUSD',
      magic: 0,
      orderId: '281184743',
      positionId: '281184743',
      volume: 1,
      price: 0.97062,
      entryType: 'DEAL_ENTRY_IN',
      reason: 'DEAL_REASON_EXPERT',
      accountCurrencyExchangeRate: 1,
      updateSequenceNumber: 1665435250622040
    };
    const deal = {
      id: '200745237',
      platform: 'mt5',
      type: 'DEAL_TYPE_BUY',
      time: new Date('2022-05-11T13:00:00.000Z'),
      brokerTime: '2020-05-11 16:00:00.000',
      commission: -3.5,
      swap: 0,
      profit: 0,
      symbol: 'EURUSD',
      magic: 0,
      orderId: '281184743',
      positionId: '281184743',
      volume: 1,
      price: 0.97062,
      entryType: 'DEAL_ENTRY_IN',
      reason: 'DEAL_REASON_EXPERT',
      accountCurrencyExchangeRate: 1,
      updateSequenceNumber: 1665435250622040
    };
    const deal2 = {
      id: '200745238',
      platform: 'mt5',
      type: 'DEAL_TYPE_BUY',
      time: new Date('2022-05-11T14:00:00.000Z'),
      brokerTime: '2020-05-11 17:00:00.000',
      commission: -3.5,
      swap: 0,
      profit: 0,
      symbol: 'EURUSD',
      magic: 0,
      orderId: '281184743',
      positionId: '281184743',
      volume: 1,
      price: 0.97062,
      entryType: 'DEAL_ENTRY_IN',
      reason: 'DEAL_REASON_EXPERT',
      accountCurrencyExchangeRate: 1,
      updateSequenceNumber: 1665435250622040
    };
    const deal3 = {
      id: '200745239',
      platform: 'mt5',
      type: 'DEAL_TYPE_BUY',
      time: new Date('2022-05-12T02:00:00.000Z'),
      brokerTime: '2020-05-12 05:00:00.000',
      commission: -3.5,
      swap: 0,
      profit: 0,
      symbol: 'EURUSD',
      magic: 0,
      orderId: '281184743',
      positionId: '281184743',
      volume: 1,
      price: 0.97062,
      entryType: 'DEAL_ENTRY_IN',
      reason: 'DEAL_REASON_EXPERT',
      accountCurrencyExchangeRate: 1,
      updateSequenceNumber: 1665435250622040
    };
    await clock.tickAsync(100);
    await Promise.all([
      syncListeners[0].onDealAdded('vint-hill:1:ps-mpa-1', dealBalance),
      connection.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', dealBalance)
    ]);
    sinon.assert.calledOnce(updatedStub);
    await Promise.all([
      syncListeners[0].onDealAdded('vint-hill:1:ps-mpa-1', deal),
      connection.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', deal)
    ]);
    sinon.assert.calledTwice(updatedStub);
    sinon.assert.calledWith(updatedStub, [
      {
        startBrokerTime: '2020-05-11 12:00:00.000',
        endBrokerTime: '2020-05-12 11:59:59.999',
        initialBalance: 10000,
        maxAbsoluteDrawdown: 200,
        maxAbsoluteProfit: 500,
        maxDrawdownTime: '2020-05-11 14:00:00.000',
        maxProfitTime: '2020-05-11 14:00:00.000',
        maxRelativeDrawdown: 0.05,
        maxRelativeProfit: 0.1,
        period: 'day',
        exceededThresholdType: undefined,
        thresholdExceeded: false,
        tradeDayCount: 1
      }
    ]);
    await clock.tickAsync(100);
    await Promise.all([
      syncListeners[0].onDealAdded('vint-hill:1:ps-mpa-1', deal2),
      connection.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', deal2)
    ]);
    sinon.assert.calledTwice(updatedStub);
    await Promise.all([
      syncListeners[0].onDealAdded('vint-hill:1:ps-mpa-1', deal3),
      connection.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', deal3)
    ]);
    sinon.assert.calledThrice(updatedStub);
    sinon.assert.calledWith(updatedStub, [
      {
        startBrokerTime: '2020-05-11 12:00:00.000',
        endBrokerTime: '2020-05-12 11:59:59.999',
        initialBalance: 10000,
        maxAbsoluteDrawdown: 200,
        maxAbsoluteProfit: 500,
        maxDrawdownTime: '2020-05-11 14:00:00.000',
        maxProfitTime: '2020-05-11 14:00:00.000',
        maxRelativeDrawdown: 0.05,
        maxRelativeProfit: 0.1,
        period: 'day',
        exceededThresholdType: undefined,
        thresholdExceeded: false,
        tradeDayCount: 2
      }
    ]);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should account for deals already in the database', async () => {
    periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    const deal = {
      id: '200745237',
      platform: 'mt5',
      type: 'DEAL_TYPE_BUY',
      time: new Date('2022-05-11T13:00:00.000Z'),
      brokerTime: '2020-05-11 16:00:00.000',
      commission: -3.5,
      swap: 0,
      profit: 0,
      symbol: 'EURUSD',
      magic: 0,
      orderId: '281184743',
      positionId: '281184743',
      volume: 1,
      price: 0.97062,
      entryType: 'DEAL_ENTRY_IN',
      reason: 'DEAL_REASON_EXPERT',
      accountCurrencyExchangeRate: 1,
      updateSequenceNumber: 1665435250622040
    };
    const deal2 = {
      id: '200745239',
      platform: 'mt5',
      type: 'DEAL_TYPE_BUY',
      time: new Date('2022-05-12T02:00:00.000Z'),
      brokerTime: '2020-05-12 05:00:00.000',
      commission: -3.5,
      swap: 0,
      profit: 0,
      symbol: 'EURUSD',
      magic: 0,
      orderId: '281184743',
      positionId: '281184743',
      volume: 1,
      price: 0.97062,
      entryType: 'DEAL_ENTRY_IN',
      reason: 'DEAL_REASON_EXPERT',
      accountCurrencyExchangeRate: 1,
      updateSequenceNumber: 1665435250622040
    };
    await clock.tickAsync(100);
    connection.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', deal);
    sinon.assert.calledOnce(updatedStub);
    await Promise.all([
      syncListeners[0].onDealAdded('vint-hill:1:ps-mpa-1', deal2),
      connection.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', deal2)
    ]);
    sinon.assert.calledTwice(updatedStub);
    sinon.assert.calledWith(updatedStub, [
      {
        startBrokerTime: '2020-05-11 12:00:00.000',
        endBrokerTime: '2020-05-12 11:59:59.999',
        initialBalance: 10000,
        maxAbsoluteDrawdown: 200,
        maxAbsoluteProfit: 500,
        maxDrawdownTime: '2020-05-11 14:00:00.000',
        maxProfitTime: '2020-05-11 14:00:00.000',
        maxRelativeDrawdown: 0.05,
        maxRelativeProfit: 0.1,
        period: 'day',
        exceededThresholdType: undefined,
        thresholdExceeded: false,
        tradeDayCount: 2
      }
    ]);
  });

  /**
   * @test {PeriodStatisticsStreamManager#addPeriodStatisticsListener}
   */
  it('should filter deals according to timezone offset', async () => {
    periodStatisticsStreamManager.addPeriodStatisticsListener(listener, 'accountId', 'tracker1');
    const deal = {
      id: '200745237',
      platform: 'mt5',
      type: 'DEAL_TYPE_BUY',
      time: new Date('2022-05-11T10:00:00.000Z'),
      brokerTime: '2020-05-11 11:00:00.000',
      commission: -3.5,
      swap: 0,
      profit: 0,
      symbol: 'EURUSD',
      magic: 0,
      orderId: '281184743',
      positionId: '281184743',
      volume: 1,
      price: 0.97062,
      entryType: 'DEAL_ENTRY_IN',
      reason: 'DEAL_REASON_EXPERT',
      accountCurrencyExchangeRate: 1,
      updateSequenceNumber: 1665435250622040
    };
    const deal2 = {
      id: '200745239',
      platform: 'mt5',
      type: 'DEAL_TYPE_BUY',
      time: new Date('2022-05-12T02:00:00.000Z'),
      brokerTime: '2020-05-12 03:00:00.000',
      commission: -3.5,
      swap: 0,
      profit: 0,
      symbol: 'EURUSD',
      magic: 0,
      orderId: '281184743',
      positionId: '281184743',
      volume: 1,
      price: 0.97062,
      entryType: 'DEAL_ENTRY_IN',
      reason: 'DEAL_REASON_EXPERT',
      accountCurrencyExchangeRate: 1,
      updateSequenceNumber: 1665435250622040
    };
    await clock.tickAsync(100);
    connection.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', deal);
    sinon.assert.calledOnce(updatedStub);
    await Promise.all([
      syncListeners[0].onDealAdded('vint-hill:1:ps-mpa-1', deal2),
      connection.historyStorage.onDealAdded('vint-hill:1:ps-mpa-1', deal2)
    ]);
    sinon.assert.calledTwice(updatedStub);
    sinon.assert.calledWith(updatedStub, [
      {
        startBrokerTime: '2020-05-11 12:00:00.000',
        endBrokerTime: '2020-05-12 11:59:59.999',
        initialBalance: 10000,
        maxAbsoluteDrawdown: 200,
        maxAbsoluteProfit: 500,
        maxDrawdownTime: '2020-05-11 14:00:00.000',
        maxProfitTime: '2020-05-11 14:00:00.000',
        maxRelativeDrawdown: 0.05,
        maxRelativeProfit: 0.1,
        period: 'day',
        exceededThresholdType: undefined,
        thresholdExceeded: false,
        tradeDayCount: 1
      }
    ]);
  });

});