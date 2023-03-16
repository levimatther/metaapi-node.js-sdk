'use strict';

import sinon from 'sinon';
import EquityChartListener from './equityChartListener';
import EquityChartStreamManager from './equityChartStreamManager';
import TimeoutError from '../../../clients/timeoutError';

/**
 * @test {EquityChartStreamManager}
 */
describe('EquityChartStreamManager', () => {

  let equityChartStreamManager;
  let domainClient;
  let equityTrackingClient;
  let callStub;
  let finishStub;
  let connectedStub;
  let disconnectedStub;
  let errorStub;
  let listener;
  let sandbox;
  let account;
  let connection;
  let clock;
  let getEquityChartStub;
  let syncListeners;
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
    syncListeners = [];
    clock = sandbox.useFakeTimers({shouldAdvanceTime: true});
    callStub = sinon.stub();
    finishStub = sinon.stub();
    connectedStub = sinon.stub();
    disconnectedStub = sinon.stub();
    errorStub = sinon.stub();

    class Listener extends EquityChartListener {
      async onEquityRecordUpdated(equityChartEvent) {
        callStub(equityChartEvent);
      }

      async onEquityRecordCompleted(equityChartEvent) {
        finishStub(equityChartEvent);
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

    listener = new Listener('accountId');
    domainClient = {
      domain, token
    };
    equityTrackingClient = {
      getEquityChart: () => {}
    };
    getEquityChartStub = sandbox.stub(equityTrackingClient, 'getEquityChart');
    equityChartStreamManager = new EquityChartStreamManager(domainClient, equityTrackingClient, metaApi);
    account = {
      waitDeployed: () => {},
      getStreamingConnection: () => {}
    };
    connection = {
      addSynchronizationListener: (l) => {
        syncListeners.push(l);
      },
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
      }
    };
    sandbox.stub(metaApi.metatraderAccountApi, 'getAccount').resolves(account);
    sandbox.stub(account, 'getStreamingConnection').returns(connection);

    results = [
      {
        minBalance: 10000,
        averageBalance: 10100,
        maxBalance: 10200,
        minEquity: 11000,
        averageEquity: 11100,
        maxEquity: 11200,
        balanceSum: 50000,
        duration: 2000000,
        brokerTime: '2020-05-10 12:50:50.000',
        endBrokerTime: '2020-05-10 12:59:59.999',
        equitySum: 6000000000,
        startBrokerTime: '2020-05-10 12:00:00.000',
        lastBalance: 10100,
        lastEquity: 11100
      },
      {
        minBalance: 10000,
        averageBalance: 10100,
        maxBalance: 10200,
        minEquity: 11000,
        averageEquity: 11100,
        maxEquity: 11200,
        balanceSum: 50000,
        duration: 2000000,
        brokerTime: '2020-05-10 13:50:50.000',
        endBrokerTime: '2020-05-10 13:59:59.999',
        equitySum: 6000000000,
        startBrokerTime: '2020-05-10 13:00:00.000',
        lastBalance: 10100,
        lastEquity: 11100
      }
    ];
    getEquityChartStub.resolves(results);
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
  });

  /**
   * @test {EquityChartStreamManager#addEquityChartListener}
   */
  it('should add listener and request events', async () => {
    const listenerId = equityChartStreamManager.addEquityChartListener(listener, 'accountId');
    await clock.tickAsync(100);
    equityChartStreamManager.removeEquityChartListener(listenerId);
    sinon.assert.calledWith(callStub, results);
  });

  /**
   * @test {EquityChartStreamManager#addEquityChartListener}
   */
  it('should process price events', async () => {
    const listenerId = equityChartStreamManager.addEquityChartListener(listener, 'accountId');
    await clock.tickAsync(100);
    await syncListeners[0].onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {equity: 10600, balance: 9000});
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-10 13:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    getEquityChartStub.resolves([results[1], {
      minBalance: 11000,
      averageBalance: 11500,
      maxBalance: 12000,
      minEquity: 12000,
      averageEquity: 12100,
      maxEquity: 12200,
      balanceSum: 50000,
      duration: 2000000,
      brokerTime: '2020-05-10 14:01:00.000',
      endBrokerTime: '2020-05-10 14:59:59.999',
      equitySum: 6000000000,
      startBrokerTime: '2020-05-10 14:00:00.000',
      lastBalance: 12000,
      lastEquity: 12000
    }]);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-10 14:01:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.calledOnce(finishStub);
    sinon.assert.calledWith(callStub, [{
      averageBalance: 10100,
      averageEquity: 11100,
      balanceSum: 50000,
      brokerTime: '2020-05-10 13:50:50.000',
      duration: 2000000,
      endBrokerTime: '2020-05-10 13:59:59.999',
      equitySum: 6000000000,
      maxBalance: 10200,
      maxEquity: 11200,
      minBalance: 10000,
      minEquity: 11000,
      startBrokerTime: '2020-05-10 13:00:00.000',
      lastBalance: 10100,
      lastEquity: 11100
    }, {
      minBalance: 11000,
      averageBalance: 11500,
      maxBalance: 12000,
      minEquity: 12000,
      averageEquity: 12100,
      maxEquity: 12200,
      balanceSum: 50000,
      duration: 2000000,
      brokerTime: '2020-05-10 14:01:00.000',
      endBrokerTime: '2020-05-10 14:59:59.999',
      equitySum: 6000000000,
      startBrokerTime: '2020-05-10 14:00:00.000',
      lastBalance: 12000,
      lastEquity: 12000
    }]);
    equityChartStreamManager.removeEquityChartListener(listenerId);
  });

  /**
   * @test {EquityChartStreamManager#addEquityChartListener}
   */
  it('should not process price events if new period not received yet', async () => {
    const listenerId = equityChartStreamManager.addEquityChartListener(listener, 'accountId');
    await clock.tickAsync(100);
    await syncListeners[0].onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {equity: 10600, balance: 9000});
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-10 13:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    getEquityChartStub.resolves([results[1]]);
    syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-10 14:01:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.calledWith(callStub, results);
    sinon.assert.calledWith(callStub, [{
      startBrokerTime: '2020-05-10 13:00:00.000',
      endBrokerTime: '2020-05-10 13:59:59.999',
      averageBalance: 1000.0222222222222,
      minBalance: 9000,
      maxBalance: 11000,
      averageEquity: 3478,
      minEquity: 10500,
      maxEquity: 11200,
      lastBalance: 11000,
      lastEquity: 10500
    }]);
    sinon.assert.callCount(callStub, 2);
    syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-10 14:02:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-10 14:03:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10500
    });
    await clock.tickAsync(1000);
    sinon.assert.callCount(callStub, 2);
    equityChartStreamManager.removeEquityChartListener(listenerId);
  });

  /**
   * @test {EquityChartStreamManager#addEquityChartListener}
   */
  it('should retry on synchronization error', async () => {
    sandbox.stub(account, 'waitDeployed')
      .onFirstCall().rejects(new TimeoutError())
      .onSecondCall().rejects(new TimeoutError())
      .onThirdCall().resolves();
    const listenerId = equityChartStreamManager.addEquityChartListener(listener, 'accountId');
    await clock.tickAsync(5000);
    equityChartStreamManager.removeEquityChartListener(listenerId);
    sinon.assert.calledWith(callStub, results);
    sinon.assert.calledTwice(errorStub);
  });

  /**
   * @test {EquityChartStreamManager#addEquityChartListener}
   */
  it('should retry on get equity chart error', async () => {
    getEquityChartStub
      .onFirstCall().rejects(new TimeoutError())
      .onSecondCall().rejects(new TimeoutError())
      .onThirdCall().resolves(results);
    const listenerId = equityChartStreamManager.addEquityChartListener(listener, 'accountId');
    await clock.tickAsync(35000);
    equityChartStreamManager.removeEquityChartListener(listenerId);
    sinon.assert.calledWith(callStub, results);
    sinon.assert.calledTwice(errorStub);
  });

  /**
   * @test {EquityChartStreamManager#addEquityChartListener}
   */
  it('should initialize two listeners', async () => {
    sandbox.stub(connection, 'close');
    const listenerId = await equityChartStreamManager.addEquityChartListener(listener, 'accountId');
    await clock.tickAsync(1000);
    sinon.assert.calledWith(callStub, results);

    let callStub2 = sinon.stub();
    let finishStub2 = sinon.stub();

    class Listener2 extends EquityChartListener {
      async onEquityRecordUpdated(equityChartEvent) {
        callStub2(equityChartEvent);
      }

      async onEquityRecordCompleted(equityChartEvent) {
        finishStub2(equityChartEvent);
      }
    }

    let listener2 = new Listener2('accountId');
    const listenerId2 = await equityChartStreamManager.addEquityChartListener(listener2, 'accountId');
    await clock.tickAsync(100);
    sinon.assert.calledWith(callStub2, results);
    equityChartStreamManager.removeEquityChartListener(listenerId);
    await clock.tickAsync(1000);
    sinon.assert.notCalled(connection.close);
    equityChartStreamManager.removeEquityChartListener(listenerId2);
    await clock.tickAsync(1000);
    sinon.assert.calledOnce(connection.close);
    sinon.assert.match(syncListeners.length, 1);
  });

  /**
   * @test {EquityChartStreamManager#addEquityChartListener}
   */
  it('should handle several listeners simultaneously', async () => {
    sandbox.stub(connection, 'close');
    let callStub2 = sinon.stub();
    let finishStub2 = sinon.stub();
    let connectedStub2 = sinon.stub();
    let disconnectedStub2 = sinon.stub();
    let errorStub2 = sinon.stub();

    class Listener2 extends EquityChartListener {
      async onEquityRecordUpdated(equityChartEvent) {
        callStub2(equityChartEvent);
      }

      async onEquityRecordCompleted(equityChartEvent) {
        finishStub2(equityChartEvent);
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

    let listener2 = new Listener2('accountId');
    const [listenerId, listenerId2] =  await Promise.all([
      equityChartStreamManager.addEquityChartListener(listener, 'accountId'),
      equityChartStreamManager.addEquityChartListener(listener2, 'accountId')
    ]);
    await clock.tickAsync(100);
    sinon.assert.calledWith(callStub, results);
    sinon.assert.calledWith(callStub2, results);
    sinon.assert.match(syncListeners.length, 1);
    await syncListeners[0].onDealsSynchronized('vint-hill:1:ps-mpa-1');
    sinon.assert.calledOnce(connectedStub);
    sinon.assert.calledOnce(connectedStub2);
    equityChartStreamManager.removeEquityChartListener(listenerId);
    await clock.tickAsync(1000);
    sinon.assert.notCalled(connection.close);
    equityChartStreamManager.removeEquityChartListener(listenerId2);
    await clock.tickAsync(1000);
    sinon.assert.calledOnce(connection.close);
  });

  /**
   * @test {EquityChartStreamManager#addEquityChartListener}
   */
  it('should wait until synchronization for second listener', async () => {
    connection.healthMonitor.healthStatus.synchronized = false;
    sandbox.stub(connection, 'close');
    const listenerId = await equityChartStreamManager.addEquityChartListener(listener, 'accountId');
    await clock.tickAsync(100);
    await clock.tickAsync(1000);
    sinon.assert.calledWith(callStub, results);

    let callStub2 = sinon.stub();
    let finishStub2 = sinon.stub();
    let connectedStub2 = sinon.stub();
    let disconnectedStub2 = sinon.stub();

    class Listener2 extends EquityChartListener {
      async onEquityRecordUpdated(equityChartEvent) {
        callStub2(equityChartEvent);
      }

      async onEquityRecordCompleted(equityChartEvent) {
        finishStub2(equityChartEvent);
      }

      async onConnected(instanceIndex) {
        connectedStub2(instanceIndex);
      }
    
      async onDisconnected(instanceIndex) {
        disconnectedStub2(instanceIndex);
      }
    }

    let listener2 = new Listener2('accountId');
    const listenerPromise = equityChartStreamManager.addEquityChartListener(listener2, 'accountId');
    await clock.tickAsync(100);
    sinon.assert.notCalled(callStub2);
    syncListeners[0].onDealsSynchronized('new-york:0:ps-mpa-1');
    const listenerId2 = await listenerPromise;
    sinon.assert.calledWith(callStub2, results);
    equityChartStreamManager.removeEquityChartListener(listenerId);
    await clock.tickAsync(1000);
    sinon.assert.notCalled(connection.close);
    equityChartStreamManager.removeEquityChartListener(listenerId2);
    await clock.tickAsync(1000);
    sinon.assert.calledOnce(connection.close);
  });

  /**
   * @test {EquityChartStreamManager#addEquityChartListener}
   */
  it('should track connection state', async () => {
    equityChartStreamManager.addEquityChartListener(listener, 'accountId');
    await clock.tickAsync(100);
    await syncListeners[0].onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {equity: 10600, balance: 9000});
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

});