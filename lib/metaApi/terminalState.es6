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
    this._connected = false;
    this._connectedToBroker = false;
    this._positions = [];
    this._orders = [];
    this._specifications = [];
    this._specificationsBySymbol = {};
    this._pricesBySymbol = {};
    this._completedOrders = {};
    this._removedPositions = {};
  }

  /**
   * Returns true if MetaApi have connected to MetaTrader terminal
   * @return {Boolean} true if MetaApi have connected to MetaTrader terminal
   */
  get connected() {
    return this._connected;
  }

  /**
   * Returns true if MetaApi have connected to MetaTrader terminal and MetaTrader terminal is connected to broker
   * @return {Boolean} true if MetaApi have connected to MetaTrader terminal and MetaTrader terminal is connected to
   * broker
   */
  get connectedToBroker() {
    return this._connectedToBroker;
  }

  /**
   * Returns a local copy of account information
   * @returns {MetatraderAccountInformation} local copy of account information
   */
  get accountInformation() {
    return this._accountInformation;
  }

  /**
   * Returns a local copy of MetaTrader positions opened
   * @returns {Array<MetatraderPosition>} a local copy of MetaTrader positions opened
   */
  get positions() {
    return this._positions;
  }

  /**
   * Returns a local copy of MetaTrader orders opened
   * @returns {Array<MetatraderOrder>} a local copy of MetaTrader orders opened
   */
  get orders() {
    return this._orders;
  }

  /**
   * Returns a local copy of symbol specifications available in MetaTrader trading terminal
   * @returns {Array<MetatraderSymbolSpecification>} a local copy of symbol specifications available in MetaTrader
   * trading terminal
   */
  get specifications() {
    return this._specifications;
  }

  /**
   * Returns MetaTrader symbol specification by symbol
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolSpecification} MetatraderSymbolSpecification found or undefined if specification for a
   * symbol is not found
   */
  specification(symbol) {
    return this._specificationsBySymbol[symbol];
  }

  /**
   * Returns MetaTrader symbol price by symbol
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolPrice} MetatraderSymbolPrice found or undefined if price for a symbol is not found
   */
  price(symbol) {
    return this._pricesBySymbol[symbol];
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   */
  onConnected() {
    this._connected = true;
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   */
  onDisconnected() {
    this._connected = false;
    this._connectedToBroker = false;
  }

  /**
   * Invoked when broker connection status have changed
   * @param {Boolean} connected is MetaTrader terminal is connected to broker
   */
  onBrokerConnectionStatusChanged(connected) {
    this._connectedToBroker = connected;
    if (this._statusTimer) {
      clearTimeout(this._statusTimer);
    }
    this._statusTimer = setTimeout(() => {
      this.onDisconnected();
    }, 60000);
  }

  /**
   * Invoked when MetaTrader terminal state synchronization is started
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSynchronizationStarted() {
    this._accountInformation = undefined;
    this._positions = [];
    this._orders = [];
    this._specifications = [];
    this._specificationsBySymbol = {};
    this._pricesBySymbol = {};
    this._completedOrders = {};
    this._removedPositions = {};
    this._ordersInitialized = false;
    this._positionsInitialized = false;
  }

  /**
   * Invoked when MetaTrader account information is updated
   * @param {MetatraderAccountInformation} accountInformation updated MetaTrader account information
   */
  onAccountInformationUpdated(accountInformation) {
    this._accountInformation = accountInformation;
  }

  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization
   * @param {Array<MetatraderPosition>} positions updated array of positions
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsReplaced(positions) {
    this._positions = positions;
    this._removedPositions = {};
    this._positionsInitialized = true;
  }

  /**
   * Invoked when MetaTrader position is updated
   * @param {MetatraderPosition} position updated MetaTrader position
   */
  onPositionUpdated(position) {
    let index = this._positions.findIndex(p => p.id === position.id);
    if (index !== -1) {
      this._positions[index] = position;
    } else if (!this._removedPositions[position.id]) {
      this._positions.push(position);
    }
  }

  /**
   * Invoked when MetaTrader position is removed
   * @param {String} positionId removed MetaTrader position id
   */
  onPositionRemoved(positionId) {
    let position = this._positions.find(p => p.id !== positionId);
    if (!position) {
      for (let e of Object.entries(this._removedPositions)) {
        if (e[1] + 5 * 60 * 1000 < Date.now()) {
          delete this._removedPositions[e[0]];
        }
      }
      this._removedPositions[positionId] = Date.now();
    } else {
      this._positions = this._positions.filter(p => p.id !== positionId);
    }
  }

  /**
   * Invoked when the orders are replaced as a result of initial terminal state synchronization
   * @param {Array<MetatraderOrder>} orders updated array of orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onOrdersReplaced(orders) {
    this._orders = orders;
    this._completedOrders = {};
    this._ordersInitialized = true;
  }

  /**
   * Invoked when MetaTrader order is updated
   * @param {MetatraderOrder} order updated MetaTrader order
   */
  onOrderUpdated(order) {
    let index = this._orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      this._orders[index] = order;
    } else if (!this._completedOrders[order.id]) {
      this._orders.push(order);
    }
  }

  /**
   * Invoked when MetaTrader order is completed (executed or canceled)
   * @param {String} orderId completed MetaTrader order id
   */
  onOrderCompleted(orderId) {
    let order = this._orders.find(o => o.id !== orderId);
    if (!order) {
      for (let e of Object.entries(this._completedOrders)) {
        if (e[1] + 5 * 60 * 1000 < Date.now()) {
          delete this._completedOrders[e[0]];
        }
      }
      this._completedOrders[orderId] = Date.now();
    } else {
      this._orders = this._orders.filter(o => o.id !== orderId);
    }
  }

  /**
   * Invoked when a symbol specification was updated
   * @param {MetatraderSymbolSpecification} specification updated MetaTrader symbol specification
   */
  onSymbolSpecificationUpdated(specification) {
    let index = this._specifications.findIndex(s => s.symbol === specification.symbol);
    if (index !== -1) {
      this._specifications[index] = specification;
    } else {
      this._specifications.push(specification);
    }
    this._specificationsBySymbol[specification.symbol] = specification;
  }

  /**
   * Invoked when prices for several symbols were updated
   * @param {Array<MetatraderSymbolPrice>} prices updated MetaTrader symbol prices
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   */
  // eslint-disable-next-line complexity
  onSymbolPricesUpdated(prices, equity, margin, freeMargin, marginLevel) {
    let pricesInitialized = false;
    for (let price of prices || []) {
      this._pricesBySymbol[price.symbol] = price;
      let positions = this._positions.filter(p => p.symbol === price.symbol);
      let otherPositions = this._positions.filter(p => p.symbol !== price.symbol);
      let orders = this._orders.filter(o => o.symbol === price.symbol);
      pricesInitialized = true;
      for (let position of otherPositions) {
        let p = this._pricesBySymbol[position.symbol];
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
    if (this._accountInformation) {
      if (this._positionsInitialized && pricesInitialized) {
        this._accountInformation.equity = this._accountInformation.balance +
          this._positions.reduce((acc, p) => acc + p.unrealizedProfit, 0);
      } else {
        this._accountInformation.equity = equity !== undefined ? equity : this._accountInformation.equity;
      }
      this._accountInformation.margin = margin !== undefined ? margin : this._accountInformation.margin;
      this._accountInformation.freeMargin = freeMargin !== undefined ? freeMargin : this._accountInformation.freeMargin;
      this._accountInformation.marginLevel = freeMargin !== undefined ? marginLevel :
        this._accountInformation.marginLevel;
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

}
