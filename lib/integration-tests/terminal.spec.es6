import TerminalHashManager from '../metaApi/terminalHashManager';
import TerminalState from '../metaApi/terminalState';
import sinon from 'sinon';

describe('Terminal integration tests', () => {

  let sandbox, clock, accounts, terminalHashManager, state,
    specifications, updatedSpecifications, updatedSpecifications2,
    positions, updatedPositions, updatedPositions2,
    orders, updatedOrders, updatedOrders2;
  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(async () => {
    clock = sinon.useFakeTimers({shouldAdvanceTime: true});
    accounts = [{
      server: 'ICMarkets-Demo1',
      id: 'accountId',
      type: 'cloud-g1'
    }, {
      server: 'ICMarkets-Demo1',
      id: 'accountId2',
      type: 'cloud-g1'
    }, {
      server: 'ICMarkets-Demo2',
      id: 'accountId3',
      type: 'cloud-g2'
    }, {
      server: 'FXChoice',
      id: 'accountId4',
      type: 'cloud-g2'
    }, {
      server: 'FXChoice',
      id: 'accountId5',
      type: 'cloud-g2'
    }];
    const clientApiClient = {
      getHashingIgnoredFieldLists: () => ({
        g1: {
          specification: [
            'description',
            'expirationTime',
            'expirationBrokerTime',
            'startTime',
            'startBrokerTime',
            'pipSize'
          ],
          position: [
            'time',
            'updateTime',
            'comment',
            'brokerComment',
            'originalComment',
            'clientId',
            'profit',
            'realizedProfit',
            'unrealizedProfit',
            'currentPrice',
            'currentTickValue',
            'accountCurrencyExchangeRate',
            'updateSequenceNumber'
          ],
          order: [
            'time',
            'expirationTime',
            'comment',
            'brokerComment',
            'originalComment',
            'clientId',
            'currentPrice',
            'accountCurrencyExchangeRate',
            'updateSequenceNumber'
          ]
        },
        g2: {
          specification: [
            'pipSize'
          ],
          position: [
            'comment',
            'brokerComment',
            'originalComment',
            'clientId',
            'profit',
            'realizedProfit',
            'unrealizedProfit',
            'currentPrice',
            'currentTickValue',
            'accountCurrencyExchangeRate',
            'updateSequenceNumber'
          ],
          order: [
            'comment',
            'brokerComment',
            'originalComment',
            'clientId',
            'currentPrice',
            'accountCurrencyExchangeRate',
            'updateSequenceNumber'
          ]
        }
      })
    };
    terminalHashManager = new TerminalHashManager(clientApiClient);
    state = new TerminalState(accounts[0], terminalHashManager);
    specifications = [{symbol: 'EURUSD', tickSize: 0.00001}];
    positions = [{
      id: '1',
      symbol: 'EURUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 9,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    }];
    orders = [{
      id: '1',
      symbol: 'EURUSD',
      type: 'ORDER_TYPE_BUY_LIMIT',
      currentPrice: 9
    }];
    updatedSpecifications = [{symbol: 'XAUUSD', tickSize: 0.001}];
    updatedSpecifications2 = [{symbol: 'AUDUSD', tickSize: 0.002}];
    updatedPositions = [{
      id: '2',
      symbol: 'EURUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 10,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    }];
    updatedPositions2 = [{
      id: '4',
      symbol: 'EURUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 12,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    }];
    updatedOrders = [{
      id: '2',
      symbol: 'EURUSD',
      type: 'ORDER_TYPE_BUY_LIMIT',
      currentPrice: 10
    }];
    updatedOrders2 = [{
      id: '4',
      symbol: 'EURUSD',
      type: 'ORDER_TYPE_BUY_LIMIT',
      currentPrice: 10
    }];
  });

  afterEach(() => {
    clock.restore();
    sandbox.restore();
  });

  const checkState = (specificationsValue = [], positionsValue = [], ordersValue = [], terminal = state) => {
    sinon.assert.match(terminal.specifications, specificationsValue);
    sinon.assert.match(terminal.positions, positionsValue);
    sinon.assert.match(terminal.orders, ordersValue);
  };

  const optimizeTrees = async () => {
    await clock.tickAsync(25 * 1000 * 60);
  };

  it('should synchronize for the first time and modify account state', async () => {
    checkState();
    sinon.assert.match(state.specification('EURUSD'), null);
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined,
      undefined, 'synchronizationId');
    checkState();
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', specifications, []);
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    checkState();
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    checkState();
    await state.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    checkState();
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    checkState();
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    checkState(specifications, positions, orders);
    await state.onPositionsUpdated('vint-hill:1:ps-mpa-1', updatedPositions, []);
    checkState(specifications, [positions[0], updatedPositions[0]], orders);
    await state.onPendingOrdersUpdated('vint-hill:1:ps-mpa-1', updatedOrders, []);
    checkState(specifications, [positions[0], updatedPositions[0]], [orders[0], updatedOrders[0]]);
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', updatedSpecifications, []);
    checkState([specifications[0], updatedSpecifications[0]], [positions[0], updatedPositions[0]],
      [orders[0], updatedOrders[0]]);
    await state.onPositionsUpdated('vint-hill:1:ps-mpa-1', [], ['1']);
    checkState([specifications[0], updatedSpecifications[0]], [updatedPositions[0]],
      [orders[0], updatedOrders[0]]);
    await optimizeTrees();
    checkState([specifications[0], updatedSpecifications[0]], [updatedPositions[0]],
      [orders[0], updatedOrders[0]]);
  });

  it('should synchronize with empty state and then modify', async () => {
    checkState();
    sinon.assert.match(state.specification('EURUSD'), null);
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined,
      undefined, 'synchronizationId');
    checkState();
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', [], []);
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    checkState();
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', []);
    checkState();
    await state.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    checkState();
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', []);
    checkState();
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    checkState();
    await state.onPositionsUpdated('vint-hill:1:ps-mpa-1', updatedPositions, []);
    checkState([], updatedPositions, []);
    await state.onPendingOrdersUpdated('vint-hill:1:ps-mpa-1', updatedOrders, []);
    checkState([], updatedPositions, updatedOrders);
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', updatedSpecifications, []);
    checkState(updatedSpecifications, updatedPositions, updatedOrders);
    await state.onPositionsUpdated('vint-hill:1:ps-mpa-1', [], ['1']);
    checkState(updatedSpecifications, [updatedPositions[0]],
      updatedOrders);
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', [], ['1']);
    checkState([updatedSpecifications[0]], [updatedPositions[0]],
      updatedOrders);
    await state.onPendingOrdersUpdated('vint-hill:1:ps-mpa-1', [], ['1']);
    checkState([updatedSpecifications[0]], [updatedPositions[0]],
      [updatedOrders[0]]);
  });

  it('should synchronize two accounts using the same data and then diverge', async () => {
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined,
      undefined, 'synchronizationId');
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', specifications, []);
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    await state.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    checkState(specifications, positions, orders);
    const state2 = new TerminalState(accounts[1], terminalHashManager);
    await state2.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined,
      undefined, 'synchronizationId');
    await state2.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', specifications, []);
    await state2.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state2.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    await state2.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    await state2.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    await state2.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    checkState(specifications, positions, orders);
    checkState(specifications, positions, orders, state2);
    await state.onPositionsUpdated('vint-hill:1:ps-mpa-1', updatedPositions, []);
    await state.onPendingOrdersUpdated('vint-hill:1:ps-mpa-1', updatedOrders, []);
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', updatedSpecifications, []);
    await state.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', true);
    await state2.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', true);
    checkState([specifications[0], updatedSpecifications[0]], [positions[0], updatedPositions[0]],
      [orders[0], updatedOrders[0]]);
    checkState(specifications, positions, orders, state2);
    await optimizeTrees();
    checkState([specifications[0], updatedSpecifications[0]], [positions[0], updatedPositions[0]],
      [orders[0], updatedOrders[0]]);
    checkState(specifications, positions, orders, state2);
    await state2.onPositionsUpdated('vint-hill:1:ps-mpa-1', updatedPositions2, []);
    checkState(specifications, [positions[0], updatedPositions2[0]], orders, state2);
    await state2.onPendingOrdersUpdated('vint-hill:1:ps-mpa-1', updatedOrders2, []);
    checkState(specifications, [positions[0], updatedPositions2[0]], [orders[0], updatedOrders2[0]], state2);
    await state2.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', updatedSpecifications2, []);
    await state.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', true);
    await state2.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', true);
    checkState([specifications[0], updatedSpecifications[0]], [positions[0], updatedPositions[0]],
      [orders[0], updatedOrders[0]]);
    checkState([specifications[0], updatedSpecifications2[0]], [positions[0], updatedPositions2[0]],
      [orders[0], updatedOrders2[0]], state2);
    await optimizeTrees();
    checkState([specifications[0], updatedSpecifications[0]], [positions[0], updatedPositions[0]],
      [orders[0], updatedOrders[0]]);
    checkState([specifications[0], updatedSpecifications2[0]], [positions[0], updatedPositions2[0]],
      [orders[0], updatedOrders2[0]], state2);
  });

  it('should synchronize two accounts on different hashes', async () => {
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined,
      undefined, 'synchronizationId');
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', specifications, []);
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    await state.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    checkState(specifications, positions, orders);
    const specifications2 = [{symbol: 'AUDUSD', tickSize: 0.00001}];
    const positions2 = [{
      id: '3',
      symbol: 'EURUSD',
      type: 'POSITION_TYPE_BUY',
      currentPrice: 10,
      currentTickValue: 0.5,
      openPrice: 8,
      profit: 100,
      volume: 2
    }];
    const orders2 = [{
      id: '3',
      symbol: 'EURUSD',
      type: 'ORDER_TYPE_BUY_LIMIT',
      currentPrice: 9
    }];
    const state2 = new TerminalState(accounts[1], terminalHashManager);
    await state2.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined,
      undefined, 'synchronizationId');
    await state2.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', specifications2, []);
    await state2.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state2.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions2);
    await state2.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    await state2.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders2);
    await state2.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    checkState(specifications, positions, orders);
    checkState(specifications2, positions2, orders2, state2);
  });

  it('should synchronize account after long disconnect', async () => {
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined,
      undefined, 'synchronizationId');
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', specifications, []);
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    await state.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    checkState(specifications, positions, orders);
    await state.onStreamClosed('vint-hill:1:ps-mpa-1');
    await state.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', false);
    checkState(specifications, positions, orders);
    await optimizeTrees();
    await optimizeTrees();
    checkState([], [], []);
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined,
      undefined, 'synchronizationId2');
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', updatedSpecifications, []);
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', updatedPositions);
    await state.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId2');
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', updatedOrders);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId2');
    checkState(updatedSpecifications, updatedPositions, updatedOrders);
  });

  it('should synchronize account after long disconnect with existing data', async () => {
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined,
      undefined, 'synchronizationId');
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', specifications, []);
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    await state.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    checkState(specifications, positions, orders);
    await state.onStreamClosed('vint-hill:1:ps-mpa-1');
    await state.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', false);
    checkState(specifications, positions, orders);
    await optimizeTrees();
    await optimizeTrees();
    const lastSpecsHashes = terminalHashManager.getLastUsedSpecificationHashes('ICMarkets-Demo1');
    const lastPositionsHashes = terminalHashManager.getLastUsedPositionHashes('accountId');
    const lastOrdersHashes = terminalHashManager.getLastUsedOrderHashes('accountId');
    checkState([], [], []);
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', lastSpecsHashes[0], lastPositionsHashes[0],
      lastOrdersHashes[0], 'synchronizationId2');
    await state.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId2');
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId2');
    checkState(specifications, positions, orders);
  });

  it('should synchronize account with empty state and then send data', async () => {
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined,
      undefined, 'synchronizationId');
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    checkState([], [], []);
    await state.onPositionsUpdated('vint-hill:1:ps-mpa-1', positions, []);
    await state.onPendingOrdersUpdated('vint-hill:1:ps-mpa-1', orders, []);
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', specifications, []);
    checkState(specifications, positions, orders);
  });

  it('should call events before sync finishes', async () => {
    const date = new Date();
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined,
      undefined, 'synchronizationId');
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: date, symbol: 'EURUSD', bid: 1, ask: 1.1}]);
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    await state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: new Date(date.getTime() + 100),
      symbol: 'EURUSD', bid: 1.1, ask: 1.1}]);
    await state.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    await state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: new Date(date.getTime() + 200),
      symbol: 'EURUSD', bid: 1.2, ask: 1.1}]);
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    await state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: new Date(date.getTime() + 300),
      symbol: 'EURUSD', bid: 1.2, ask: 1.1}]);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    await state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: new Date(date.getTime() + 400),
      symbol: 'EURUSD', bid: 1.3, ask: 1.1}]);
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', specifications, []);
    await state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: new Date(date.getTime() + 500),
      symbol: 'EURUSD', bid: 1.3, ask: 1.1}]);
    checkState(specifications, positions, orders);
  });

  it('should process events on a disconnected account', async () => {
    const date = new Date();
    await state.onSynchronizationStarted('vint-hill:1:ps-mpa-1', undefined, undefined,
      undefined, 'synchronizationId');
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', specifications, []);
    await state.onAccountInformationUpdated('vint-hill:1:ps-mpa-1', {'balance': 1000});
    await state.onPositionsReplaced('vint-hill:1:ps-mpa-1', positions);
    await state.onPositionsSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    await state.onPendingOrdersReplaced('vint-hill:1:ps-mpa-1', orders);
    await state.onPendingOrdersSynchronized('vint-hill:1:ps-mpa-1', 'synchronizationId');
    checkState(specifications, positions, orders);
    await state.onStreamClosed('vint-hill:1:ps-mpa-1');
    await state.onBrokerConnectionStatusChanged('vint-hill:1:ps-mpa-1', false);
    checkState(specifications, positions, orders);
    await optimizeTrees();
    await optimizeTrees();
    checkState([], [], []);
    await state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: new Date(date.getTime() + 500),
      symbol: 'EURUSD', bid: 1.3, ask: 1.1}]);
    await state.onPositionsUpdated('vint-hill:1:ps-mpa-1', updatedPositions, []);
    await state.onPendingOrdersUpdated('vint-hill:1:ps-mpa-1', updatedOrders, []);
    await state.onSymbolSpecificationsUpdated('vint-hill:1:ps-mpa-1', updatedSpecifications, []);
    await state.onSymbolPricesUpdated('vint-hill:1:ps-mpa-1', [{time: new Date(date.getTime() + 500),
      symbol: 'EURUSD', bid: 1.4, ask: 1.1}]);
  });

  // eslint-disable-next-line complexity
  it('should call random events', async () => {
    const date = new Date();
    const terminalStates = [];
    const eventLogs = [];
    const accountCount = 100;
    const eventCount = 1000;
    for(let i = 0; i < accountCount; i++) {
      eventLogs.push([]);
      const account = Object.assign({}, accounts[i % 5], {id: 'accountId' + i});
      terminalStates.push(new TerminalState(account, terminalHashManager));
    }
    for(let k = 0; k < eventCount; k++) {
      const optimizeSeed = Math.random();
      if(optimizeSeed < 0.2) {
        for(let i = 0; i < accountCount; i++) {
          eventLogs[i].push('optimize trees');
        }
        await optimizeTrees();
      }
      for(let i = 0; i < accountCount; i++) {
        const terminalState = terminalStates[i];
        const number = Math.floor(Math.random() * 17);
        const instanceIndexNumber = Math.floor(Math.random() * 5);
        const instanceIndex = 'vint-hill:1:ps-mpa-' + instanceIndexNumber;
        const eventLog = eventLogs[i];
        try {
          switch(number) {
          case 0:
            eventLog.push('onConnected');
            await terminalState.onConnected(instanceIndex);
            break;
          case 1:
            eventLog.push('onDisconnected');
            await terminalState.onDisconnected(instanceIndex);
            break;
          case 2:
            eventLog.push('onBrokerConnectionStatusChanged-true');
            await terminalState.onBrokerConnectionStatusChanged(instanceIndex, true);
            break;
          case 15:
            eventLog.push('onBrokerConnectionStatusChanged-false');
            await terminalState.onBrokerConnectionStatusChanged(instanceIndex, false);
            break;
          case 3:
            eventLog.push('onSynchronizationStarted');
            await terminalState.onSynchronizationStarted(instanceIndex, undefined,
              undefined, undefined, 'syncId');
            break;
          case 4:
            eventLog.push('onAccountInformationUpdated');
            await terminalState.onAccountInformationUpdated(instanceIndex, {'balance': 1000});
            break;
          case 5:
            eventLog.push('onPositionsReplaced');
            await terminalState.onPositionsReplaced(instanceIndex, positions);
            break;
          case 6:
            eventLog.push('onPositionsSynchronized');
            await terminalState.onPositionsSynchronized(instanceIndex, 'syncId');
            break;
          case 7:
            eventLog.push('onPositionsUpdated');
            await terminalState.onPositionsUpdated(instanceIndex, updatedPositions, []);
            break;
          case 8:
            eventLog.push('onPositionsUpdated-remove');
            await terminalState.onPositionsUpdated(instanceIndex, [], ['1']);
            break;
          case 9:
            eventLog.push('onPendingOrdersReplaced');
            await terminalState.onPendingOrdersReplaced(instanceIndex, orders);
            break;
          case 10:
            eventLog.push('onPendingOrdersSynchronized');
            await terminalState.onPendingOrdersSynchronized(instanceIndex, 'syncId');
            break;
          case 11:
            eventLog.push('onPendingOrdersUpdated');
            await terminalState.onPendingOrdersUpdated(instanceIndex, updatedOrders, []);
            break;
          case 12:
            eventLog.push('onPendingOrdersUpdated-remove');
            await terminalState.onPendingOrdersUpdated(instanceIndex, [], ['1']);
            break;
          case 13:
            eventLog.push('onSymbolSpecificationsUpdated');
            await terminalState.onSymbolSpecificationsUpdated(instanceIndex, updatedSpecifications, []);
            break;
          case 14:
            eventLog.push('onSymbolPricesUpdated');
            await terminalState.onSymbolPricesUpdated(instanceIndex, [{time: new Date(date.getTime() + k * 100),
              symbol: 'EURUSD', bid: 1 + Math.random().toPrecision(2), ask: 1.1}]);
            break;
          case 16:
            eventLog.push('on synchronize');
            await terminalState.onSynchronizationStarted(instanceIndex, undefined,
              undefined, undefined, 'syncId');
            await terminalState.onPositionsReplaced(instanceIndex, positions);
            await terminalState.onPositionsSynchronized(instanceIndex, 'syncId');
            await terminalState.onPendingOrdersReplaced(instanceIndex, orders);
            await terminalState.onPendingOrdersSynchronized(instanceIndex, 'syncId');
            break;
          default:
            break;
          }
        } catch (error) {
          console.log(eventLog.slice(-50), terminalState._account.id, error);
          throw error;
        }
      }
    }
  }).timeout(200000);

});
