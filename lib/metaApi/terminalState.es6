'use strict';

import SynchronizationListener from '../clients/metaApi/synchronizationListener';

/**
 * Responsible for storing a local copy of remote terminal state
 */
export default class TerminalState extends SynchronizationListener {

  /**
   * Constructs the instance of terminal state class
   */
  constructor() {
    super();
    this._stateByInstanceIndex = {};
    this._statusTimers = {};
  }

  /**
   * Returns true if MetaApi have connected to MetaTrader terminal
   * @return {Boolean} true if MetaApi have connected to MetaTrader terminal
   */
  get connected() {
    return Object.values(this._stateByInstanceIndex).reduce((acc, s) => acc || s.connected, false);
  }

  /**
   * Returns true if MetaApi have connected to MetaTrader terminal and MetaTrader terminal is connected to broker
   * @return {Boolean} true if MetaApi have connected to MetaTrader terminal and MetaTrader terminal is connected to
   * broker
   */
  get connectedToBroker() {
    return Object.values(this._stateByInstanceIndex).reduce((acc, s) => acc || s.connectedToBroker, false);
  }

  /**
   * Returns a local copy of account information
   * @returns {MetatraderAccountInformation} local copy of account information
   */
  get accountInformation() {
    return this._getBestState().accountInformation;
  }

  /**
   * Returns a local copy of MetaTrader positions opened
   * @returns {Array<MetatraderPosition>} a local copy of MetaTrader positions opened
   */
  get positions() {
    return this._getBestState().positions;
  }

  /**
   * Returns a local copy of MetaTrader orders opened
   * @returns {Array<MetatraderOrder>} a local copy of MetaTrader orders opened
   */
  get orders() {
    return this._getBestState().orders;
  }

  /**
   * Returns a local copy of symbol specifications available in MetaTrader trading terminal
   * @returns {Array<MetatraderSymbolSpecification>} a local copy of symbol specifications available in MetaTrader
   * trading terminal
   */
  get specifications() {
    return this._getBestState().specifications;
  }

  /**
   * Returns MetaTrader symbol specification by symbol
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolSpecification} MetatraderSymbolSpecification found or undefined if specification for a
   * symbol is not found
   */
  specification(symbol) {
    return this._getBestState().specificationsBySymbol[symbol];
  }

  /**
   * Returns MetaTrader symbol price by symbol
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolPrice} MetatraderSymbolPrice found or undefined if price for a symbol is not found
   */
  price(symbol) {
    return this._getBestState().pricesBySymbol[symbol];
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {Number} instanceIndex index of an account instance connected
   */
  onConnected(instanceIndex) {
    this._getState(instanceIndex).connected = true;
    this._resetDisconnectTimer(instanceIndex);
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {Number} instanceIndex index of an account instance connected
   */
  onDisconnected(instanceIndex) {
    let state = this._getState(instanceIndex);
    state.connected = false;
    state.connectedToBroker = false;
  }

  _resetDisconnectTimer(instanceIndex) {
    if (this._statusTimers[instanceIndex]) {
      clearTimeout(this._statusTimers[instanceIndex]);
    }
    this._statusTimers[instanceIndex] = setTimeout(() => {
      this.onDisconnected(instanceIndex);
    }, 60000);
  }

  /**
   * Invoked when broker connection status have changed
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Boolean} connected is MetaTrader terminal is connected to broker
   */
  onBrokerConnectionStatusChanged(instanceIndex, connected) {
    this._getState(instanceIndex).connectedToBroker = connected;
    this._resetDisconnectTimer(instanceIndex);
  }

  /**
   * Invoked when MetaTrader terminal state synchronization is started
   * @param {Number} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSynchronizationStarted(instanceIndex) {
    let state = this._getState(instanceIndex);
    state.accountInformation = undefined;
    state.positions = [];
    state.orders = [];
    state.specifications = [];
    state.specificationsBySymbol = {};
    state.pricesBySymbol = {};
    state.completedOrders = {};
    state.removedPositions = {};
    state.ordersInitialized = false;
    state.positionsInitialized = false;
  }

  /**
   * Invoked when MetaTrader account information is updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderAccountInformation} accountInformation updated MetaTrader account information
   */
  onAccountInformationUpdated(instanceIndex, accountInformation) {
    this._getState(instanceIndex).accountInformation = accountInformation;
  }

  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Array<MetatraderPosition>} positions updated array of positions
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsReplaced(instanceIndex, positions) {
    let state = this._getState(instanceIndex);
    state.positions = positions;
    state.removedPositions = {};
    state.positionsInitialized = true;
  }

  /**
   * Invoked when MetaTrader position is updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderPosition} position updated MetaTrader position
   */
  onPositionUpdated(instanceIndex, position) {
    let state = this._getState(instanceIndex);
    let index = state.positions.findIndex(p => p.id === position.id);
    if (index !== -1) {
      state.positions[index] = position;
    } else if (!state.removedPositions[position.id]) {
      state.positions.push(position);
    }
  }

  /**
   * Invoked when MetaTrader position is removed
   * @param {Number} instanceIndex index of an account instance connected
   * @param {String} positionId removed MetaTrader position id
   */
  onPositionRemoved(instanceIndex, positionId) {
    let state = this._getState(instanceIndex);
    let position = state.positions.find(p => p.id === positionId);
    if (!position) {
      for (let e of Object.entries(state.removedPositions)) {
        if (e[1] + 5 * 60 * 1000 < Date.now()) {
          delete state.removedPositions[e[0]];
        }
      }
      state.removedPositions[positionId] = Date.now();
    } else {
      state.positions = state.positions.filter(p => p.id !== positionId);
    }
  }

  /**
   * Invoked when the orders are replaced as a result of initial terminal state synchronization
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Array<MetatraderOrder>} orders updated array of orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onOrdersReplaced(instanceIndex, orders) {
    let state = this._getState(instanceIndex);
    state.orders = orders;
    state.completedOrders = {};
    state.ordersInitialized = true;
  }

  /**
   * Invoked when MetaTrader order is updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} order updated MetaTrader order
   */
  onOrderUpdated(instanceIndex, order) {
    let state = this._getState(instanceIndex);
    let index = state.orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      state.orders[index] = order;
    } else if (!state.completedOrders[order.id]) {
      state.orders.push(order);
    }
  }

  /**
   * Invoked when MetaTrader order is completed (executed or canceled)
   * @param {Number} instanceIndex index of an account instance connected
   * @param {String} orderId completed MetaTrader order id
   */
  onOrderCompleted(instanceIndex, orderId) {
    let state = this._getState(instanceIndex);
    let order = state.orders.find(o => o.id === orderId);
    if (!order) {
      for (let e of Object.entries(state.completedOrders)) {
        if (e[1] + 5 * 60 * 1000 < Date.now()) {
          delete state.completedOrders[e[0]];
        }
      }
      state.completedOrders[orderId] = Date.now();
    } else {
      state.orders = state.orders.filter(o => o.id !== orderId);
    }
  }

  /**
   * Invoked when a symbol specification was updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderSymbolSpecification} specification updated MetaTrader symbol specification
   */
  onSymbolSpecificationUpdated(instanceIndex, specification) {
    let state = this._getState(instanceIndex);
    let index = state.specifications.findIndex(s => s.symbol === specification.symbol);
    if (index !== -1) {
      state.specifications[index] = specification;
    } else {
      state.specifications.push(specification);
    }
    state.specificationsBySymbol[specification.symbol] = specification;
  }

  /**
   * Invoked when prices for several symbols were updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Array<MetatraderSymbolPrice>} prices updated MetaTrader symbol prices
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   */
  // eslint-disable-next-line complexity
  onSymbolPricesUpdated(instanceIndex, prices, equity, margin, freeMargin, marginLevel) {
    let state = this._getState(instanceIndex);
    state.lastUpdateTime = Math.max(prices.map(p => p.time.getTime()));
    let pricesInitialized = false;
    for (let price of prices || []) {
      state.pricesBySymbol[price.symbol] = price;
      let positions = state.positions.filter(p => p.symbol === price.symbol);
      let otherPositions = state.positions.filter(p => p.symbol !== price.symbol);
      let orders = state.orders.filter(o => o.symbol === price.symbol);
      pricesInitialized = true;
      for (let position of otherPositions) {
        let p = state.pricesBySymbol[position.symbol];
        if (p) {
          if (position.unrealizedProfit === undefined) {
            this._updatePositionProfits(position, p);
          }
        } else {
          pricesInitialized = false;
        }
      }
      for (let position of positions) {
        this._updatePositionProfits(position, price);
      }
      for (let order of orders) {
        order.currentPrice = order.type === 'ORDER_TYPE_BUY' || order.type === 'ORDER_TYPE_BUY_LIMIT' ||
          order.type === 'ORDER_TYPE_BUY_STOP' || order.type === 'ORDER_TYPE_BUY_STOP_LIMIT' ? price.ask : price.bid;
      }
    }
    if (state.accountInformation) {
      if (state.positionsInitialized && pricesInitialized) {
        state.accountInformation.equity = state.accountInformation.balance +
          state.positions.reduce((acc, p) => acc + p.unrealizedProfit, 0);
      } else {
        state.accountInformation.equity = equity !== undefined ? equity : state.accountInformation.equity;
      }
      state.accountInformation.margin = margin !== undefined ? margin : state.accountInformation.margin;
      state.accountInformation.freeMargin = freeMargin !== undefined ? freeMargin : state.accountInformation.freeMargin;
      state.accountInformation.marginLevel = freeMargin !== undefined ? marginLevel :
        state.accountInformation.marginLevel;
    }
  }

  // eslint-disable-next-line complexity
  _updatePositionProfits(position, price) {
    let specification = this.specification(position.symbol);
    if (specification) {
      if (position.unrealizedProfit === undefined || position.realizedProfit === undefined) {
        position.unrealizedProfit = (position.type === 'POSITION_TYPE_BUY' ? 1 : -1) *
          (position.currentPrice - position.openPrice) * position.currentTickValue *
          position.volume / specification.tickSize;
        position.realizedProfit = position.profit - position.unrealizedProfit;
      }
      let newPositionPrice = position.type === 'POSITION_TYPE_BUY' ? price.bid : price.ask;
      let isProfitable = (position.type === 'POSITION_TYPE_BUY' ? 1 : -1) * (newPositionPrice - position.openPrice);
      let currentTickValue = (isProfitable > 0 ? price.profitTickValue : price.lossTickValue);
      let unrealizedProfit = (position.type === 'POSITION_TYPE_BUY' ? 1 : -1) *
        (newPositionPrice - position.openPrice) * currentTickValue *
        position.volume / specification.tickSize;
      position.unrealizedProfit = unrealizedProfit;
      position.profit = position.unrealizedProfit + position.realizedProfit;
      position.currentPrice = newPositionPrice;
      position.currentTickValue = currentTickValue;
    }
  }
  
  _getState(instanceIndex) {
    if (!this._stateByInstanceIndex['' + instanceIndex]) {
      this._stateByInstanceIndex['' + instanceIndex] = this._constructTerminalState();
    }
    return this._stateByInstanceIndex['' + instanceIndex];
  }

  _constructTerminalState() {
    return {
      connected: false,
      connectedToBroker: false,
      accountInformation: undefined,
      positions: [],
      orders: [],
      specifications: [],
      specificationsBySymbol: {},
      pricesBySymbol: {},
      completedOrders: {},
      removedPositions: {},
      ordersInitialized: false,
      positionsInitialized: false,
      lastUpdateTime: 0
    };
  }

  _getBestState() {
    let result;
    let maxUpdateTime;
    for (let state of Object.values(this._stateByInstanceIndex)) {
      if (!maxUpdateTime || maxUpdateTime < state.lastUpdateTime) {
        maxUpdateTime = state.lastUpdateTime;
        result = state;
      }
    }
    return result || this._constructTerminalState();
  }
  
}
