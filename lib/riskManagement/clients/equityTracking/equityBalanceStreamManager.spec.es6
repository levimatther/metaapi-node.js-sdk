'use strict';

import sinon from 'sinon';
import EquityBalanceListener from './equityBalanceListener';
import EquityBalanceStreamManager from './equityBalanceStreamManager';
import TimeoutError from '../../../clients/timeoutError';

/**
 * @test {EquityBalanceStreamManager}
 */
describe('EquityBalanceStreamManager', () => {

  let equityBalanceStreamManager;
  let domainClient;
  let callStub;
  let connectedStub;
  let disconnectedStub;
  let errorStub;
  let listener;
  let sandbox;
  let account;
  let connection;
  let clock;
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
    connectedStub = sinon.stub();
    disconnectedStub = sinon.stub();
    errorStub = sinon.stub();

    class Listener extends EquityBalanceListener {
      async onEquityOrBalanceUpdated(equityBalanceEvent) {
        callStub(equityBalanceEvent);
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
    equityBalanceStreamManager = new EquityBalanceStreamManager(domainClient, metaApi);
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

    results = {equity: 10600, balance: 9000};
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
  });

  /**
   * @test {EquityBalanceStreamManager#addEquityBalanceListener}
   */
  it('should process price events', async () => {
    const listenerId = equityBalanceStreamManager.addEquityBalanceListener(listener, 'accountId');
    await clock.tickAsync(100);
    await syncListeners[0].onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', {
      symbol: 'EURUSD',
      bid: 1.02273,
      ask: 1.02274,
      brokerTime: '2020-05-10 13:55:00.000',
      profitTickValue: 1,
      lossTickValue: 1,
      accountCurrencyExchangeRate: 1,
      equity: 10200
    });
    sinon.assert.notCalled(callStub);
    await syncListeners[0].onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {equity: 10600, balance: 9000});
    sinon.assert.calledWith(callStub, results);
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
    sinon.assert.calledWith(callStub, {equity: 10500, balance: 9000});
    equityBalanceStreamManager.removeEquityBalanceListener(listenerId);
  });

  /**
   * @test {EquityBalanceStreamManager#addEquityBalanceListener}
   */
  it('should retry on synchronization error', async () => {
    sandbox.stub(account, 'waitDeployed')
      .onFirstCall().rejects(new TimeoutError())
      .onSecondCall().rejects(new TimeoutError())
      .onThirdCall().resolves();
    const listenerId = equityBalanceStreamManager.addEquityBalanceListener(listener, 'accountId');
    await clock.tickAsync(5000);
    await syncListeners[0].onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {equity: 10600, balance: 9000});
    sinon.assert.calledWith(callStub, results);
    sinon.assert.calledTwice(errorStub);
    equityBalanceStreamManager.removeEquityBalanceListener(listenerId);
  });

  /**
   * @test {EquityBalanceStreamManager#addEquityBalanceListener}
   */
  it('should initialize two listeners', async () => {
    sandbox.stub(connection, 'close');
    const listenerId = await equityBalanceStreamManager.addEquityBalanceListener(listener, 'accountId');
    await clock.tickAsync(1000);
    await syncListeners[0].onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {equity: 10600, balance: 9000});
    sinon.assert.calledWith(callStub, results);

    let callStub2 = sinon.stub();

    class Listener2 extends EquityBalanceListener {
      async onEquityOrBalanceUpdated(equityBalanceEvent) {
        callStub2(equityBalanceEvent);
      }
    }

    let listener2 = new Listener2('accountId');
    const listenerId2 = await equityBalanceStreamManager.addEquityBalanceListener(listener2, 'accountId');
    await clock.tickAsync(100);
    await syncListeners[0].onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {equity: 10500, balance: 9000});
    sinon.assert.calledWith(callStub2, {equity: 10500, balance: 9000});
    equityBalanceStreamManager.removeEquityBalanceListener(listenerId);
    await clock.tickAsync(1000);
    sinon.assert.notCalled(connection.close);
    equityBalanceStreamManager.removeEquityBalanceListener(listenerId2);
    await clock.tickAsync(1000);
    sinon.assert.calledOnce(connection.close);
  });

  /**
   * @test {EquityBalanceStreamManager#addEquityBalanceListener}
   */
  it('should handle two listeners at the same time', async () => {
    sandbox.stub(connection, 'close');
    let callStub2 = sinon.stub();

    class Listener2 extends EquityBalanceListener {
      async onEquityOrBalanceUpdated(equityBalanceEvent) {
        callStub2(equityBalanceEvent);
      }
    }

    let listener2 = new Listener2('accountId');
    const [listenerId, listenerId2] = await Promise.all([
      equityBalanceStreamManager.addEquityBalanceListener(listener, 'accountId'),
      equityBalanceStreamManager.addEquityBalanceListener(listener2, 'accountId'),
    ]);
    await clock.tickAsync(100);
    await syncListeners[0].onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {equity: 10500, balance: 9000});
    sinon.assert.calledWith(callStub, {equity: 10500, balance: 9000});
    sinon.assert.calledWith(callStub2, {equity: 10500, balance: 9000});
    equityBalanceStreamManager.removeEquityBalanceListener(listenerId);
    await clock.tickAsync(1000);
    sinon.assert.notCalled(connection.close);
    equityBalanceStreamManager.removeEquityBalanceListener(listenerId2);
    await clock.tickAsync(1000);
    sinon.assert.calledOnce(connection.close);
  });

  /**
   * @test {EquityBalanceStreamManager#addEquityBalanceListener}
   */
  it('should wait until synchronization for second listener', async () => {
    connection.healthMonitor.healthStatus.synchronized = false;
    sandbox.stub(connection, 'close');
    const listenerId = await equityBalanceStreamManager.addEquityBalanceListener(listener, 'accountId');
    await clock.tickAsync(1000);
    await syncListeners[0].onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {equity: 10500, balance: 9000});
    sinon.assert.calledWith(callStub, {equity: 10500, balance: 9000} );

    let callStub2 = sinon.stub();
    let connectedStub2 = sinon.stub();
    let disconnectedStub2 = sinon.stub();

    class Listener2 extends EquityBalanceListener {
      async onEquityOrBalanceUpdated(equityBalanceEvent) {
        callStub2(equityBalanceEvent);
      }

      async onConnected(instanceIndex) {
        connectedStub2(instanceIndex);
      }
    
      async onDisconnected(instanceIndex) {
        disconnectedStub2(instanceIndex);
      }
    }

    let listener2 = new Listener2('accountId');
    const listenerPromise = equityBalanceStreamManager.addEquityBalanceListener(listener2, 'accountId');
    await clock.tickAsync(100);
    await syncListeners[0].onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {equity: 10400, balance: 9000});
    sinon.assert.calledWith(callStub2, {equity: 10400, balance: 9000} );
    syncListeners[0].onDealsSynchronized('new-york:0:ps-mpa-1');
    const listenerId2 = await listenerPromise;
    equityBalanceStreamManager.removeEquityBalanceListener(listenerId);
    await clock.tickAsync(1000);
    sinon.assert.notCalled(connection.close);
    equityBalanceStreamManager.removeEquityBalanceListener(listenerId2);
    await clock.tickAsync(1000);
    sinon.assert.calledOnce(connection.close);
  });

  /**
   * @test {EquityBalanceStreamManager#addEquityBalanceListener}
   */
  it('should track connection state', async () => {
    equityBalanceStreamManager.addEquityBalanceListener(listener, 'accountId');
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