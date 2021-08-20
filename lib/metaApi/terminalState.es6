'use strict';

import crypto from 'crypto-js';
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
    this._waitForPriceResolves = {};
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
    return Object.values(this._getBestState().specificationsBySymbol);
  }

  /**
   * Returns hashes of terminal state data for incremental synchronization
   * @param {String} accountType account type
   * @returns {Object} hashes of terminal state data
   */
  getHashes(accountType) {

    const sortByKey = (obj1, obj2, key) => {
      if(obj1[key] < obj2[key]) {
        return -1;
      }
      if(obj1[key] > obj2[key]) {
        return 1;
      }
      return 0;
    };
    const specifications = JSON.parse(JSON.stringify(this.specifications));
    specifications.sort((a,b) => sortByKey(a, b, 'symbol'));
    if(accountType === 'cloud-g1') {
      specifications.forEach(specification => {
        delete specification.description;
      });
    }
    const specificationsHash = this._getHash(specifications, accountType, ['digits']);

    const positions = JSON.parse(JSON.stringify(this.positions));
    positions.sort((a,b) => sortByKey(a, b, 'id'));
    positions.forEach(position => {
      delete position.profit;
      delete position.unrealizedProfit;
      delete position.realizedProfit;
      delete position.currentPrice;
      delete position.currentTickValue;
      delete position.updateSequenceNumber;
      delete position.accountCurrencyExchangeRate;
      delete position.comment;
      delete position.originalComment;
      delete position.clientId;
      if(accountType === 'cloud-g1') {
        delete position.time;
        delete position.updateTime;
      }
    });
    const positionsHash = this._getHash(positions, accountType, ['magic']);

    const orders = JSON.parse(JSON.stringify(this.orders));
    orders.sort((a,b) => sortByKey(a, b, 'id'));
    orders.forEach(order => {
      delete order.currentPrice;
      delete order.updateSequenceNumber;
      delete order.accountCurrencyExchangeRate;
      delete order.comment;
      delete order.originalComment;
      delete order.clientId;
      if(accountType === 'cloud-g1') {
        delete order.time;
      }
    });
    const ordersHash = this._getHash(orders, accountType, ['magic']);

    return {
      specificationsMd5: specificationsHash,
      positionsMd5: positionsHash,
      ordersMd5: ordersHash
    };
  }

  /**
   * Returns MetaTrader symbol specification by symbol
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolSpecification} MetatraderSymbolSpecification found or undefined if specification for a
   * symbol is not found
   */
  specification(symbol) {
    return this._getBestState(symbol, 'specification').specificationsBySymbol[symbol];
  }

  /**
   * Returns MetaTrader symbol price by symbol
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolPrice} MetatraderSymbolPrice found or undefined if price for a symbol is not found
   */
  price(symbol) {
    return this._getBestState(symbol, 'price').pricesBySymbol[symbol];
  }

  /**
   * Waits for price to be received
   * @param {string} symbol symbol (e.g. currency pair or an index)
   * @param {number} [timeoutInSeconds] timeout in seconds, default is 30
   * @return {Promise<MetatraderSymbolPrice>} promise resolving with price or undefined if price has not been received
   */
  async waitForPrice(symbol, timeoutInSeconds = 30) {
    this._waitForPriceResolves[symbol] = this._waitForPriceResolves[symbol] || [];
    if (!this.price(symbol)) {
      await Promise.race([
        new Promise(res => this._waitForPriceResolves[symbol].push(res)),
        new Promise(res => setTimeout(res, timeoutInSeconds * 1000))
      ]);
    }
    return this.price(symbol);
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {String} instanceIndex index of an account instance connected
   */
  onConnected(instanceIndex) {
    this._getState(instanceIndex).connected = true;
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} instanceIndex index of an account instance connected
   */
  onDisconnected(instanceIndex) {
    let state = this._getState(instanceIndex);
    state.connected = false;
    state.connectedToBroker = false;
  }

  /**
   * Invoked when broker connection status have changed
   * @param {String} instanceIndex index of an account instance connected
   * @param {Boolean} connected is MetaTrader terminal is connected to broker
   */
  onBrokerConnectionStatusChanged(instanceIndex, connected) {
    this._getState(instanceIndex).connectedToBroker = connected;
  }

  /**
   * Invoked when MetaTrader terminal state synchronization is started
   * @param {String} instanceIndex index of an account instance connected
   * @param {Boolean} specificationsUpdated whether specifications are going to be updated during synchronization
   * @param {Boolean} positionsUpdated whether positions are going to be updated during synchronization
   * @param {Boolean} ordersUpdated whether orders are going to be updated during synchronization
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSynchronizationStarted(instanceIndex, specificationsUpdated, positionsUpdated, ordersUpdated) {
    let state = this._getState(instanceIndex);
    state.accountInformation = undefined;
    state.pricesBySymbol = {};
    if(positionsUpdated) {
      state.positions = [];
      state.removedPositions = {};
      state.positionsInitialized = false;
    }
    if(ordersUpdated) {
      state.orders = [];
      state.completedOrders = {};
      state.ordersInitialized = false;
    }
    if(specificationsUpdated) {
      state.specificationsBySymbol = {};
    }
  }

  /**
   * Invoked when MetaTrader account information is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderAccountInformation} accountInformation updated MetaTrader account information
   */
  onAccountInformationUpdated(instanceIndex, accountInformation) {
    let state = this._getState(instanceIndex);
    state.accountInformation = accountInformation;
    state.initializationCounter = 1;
  }

  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderPosition>} positions updated array of positions
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsReplaced(instanceIndex, positions) {
    let state = this._getState(instanceIndex);
    state.positions = positions;
  }

  /**
   * Invoked when position synchronization fnished to indicate progress of an initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsSynchronized(instanceIndex, synchronizationId) {
    let state = this._getState(instanceIndex);
    state.removedPositions = {};
    state.positionsInitialized = true;
    state.initializationCounter = 2;
  }

  /**
   * Invoked when MetaTrader position is updated
   * @param {String} instanceIndex index of an account instance connected
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
   * @param {String} instanceIndex index of an account instance connected
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
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderOrder>} orders updated array of pending orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrdersReplaced(instanceIndex, orders) {
    let state = this._getState(instanceIndex);
    state.orders = orders;
  }

  /**
   * Invoked when pending order synchronization fnished to indicate progress of an initial terminal state
   * synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPendingOrdersSynchronized(instanceIndex, synchronizationId) {
    let state = this._getState(instanceIndex);
    state.completedOrders = {};
    state.ordersInitialized = true;
    state.initializationCounter = 3;
  }

  /**
   * Invoked when MetaTrader pending order is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} order updated MetaTrader pending order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrderUpdated(instanceIndex, order) {
    let state = this._getState(instanceIndex);
    let index = state.orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      state.orders[index] = order;
    } else if (!state.completedOrders[order.id]) {
      state.orders.push(order);
    }
  }

  /**
   * Invoked when MetaTrader pending order is completed (executed or canceled)
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} orderId completed MetaTrader pending order id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrderCompleted(instanceIndex, orderId) {
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
   * @param {String} instanceIndex index of account instance connected
   * @param {Array<MetatraderSymbolSpecification>} specifications updated specifications
   * @param {Array<String>} removedSymbols removed symbols
   */
  onSymbolSpecificationsUpdated(instanceIndex, specifications, removedSymbols) {
    let state = this._getState(instanceIndex);
    for (let specification of specifications) {
      state.specificationsBySymbol[specification.symbol] = specification;
    }
    for (let symbol of removedSymbols) {
      delete state.specificationsBySymbol[symbol];
    }
    state.specificationCount = Object.keys(state.specificationsBySymbol).length;
  }

  /**
   * Invoked when prices for several symbols were updated
   * @param {String} instanceIndex index of an account instance connected
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
      let priceResolves = this._waitForPriceResolves[price.symbol] || [];
      if (priceResolves.length) {
        for (let resolve of priceResolves) {
          resolve();
        }
        delete this._waitForPriceResolves[price.symbol];
      }
    }
    if (state.accountInformation) {
      if (state.positionsInitialized && pricesInitialized) {
        if (state.accountInformation.platform === 'mt5') {
          state.accountInformation.equity = equity !== undefined ? equity : state.accountInformation.balance +
            state.positions.reduce((acc, p) => acc +
              Math.round((p.unrealizedProfit || 0) * 100) / 100 + Math.round((p.swap || 0) * 100) / 100, 0);
        } else {
          state.accountInformation.equity = equity !== undefined ? equity : state.accountInformation.balance +
            state.positions.reduce((acc, p) => acc + Math.round((p.swap || 0) * 100) / 100 +
              Math.round((p.commission || 0) * 100) / 100 + Math.round((p.unrealizedProfit || 0) * 100) / 100, 0);
        }
        state.accountInformation.equity = Math.round(state.accountInformation.equity * 100) / 100;
      } else {
        state.accountInformation.equity = equity !== undefined ? equity : state.accountInformation.equity;
      }
      state.accountInformation.margin = margin !== undefined ? margin : state.accountInformation.margin;
      state.accountInformation.freeMargin = freeMargin !== undefined ? freeMargin : state.accountInformation.freeMargin;
      state.accountInformation.marginLevel = freeMargin !== undefined ? marginLevel :
        state.accountInformation.marginLevel;
    }
  }

  /**
   * Invoked when a stream for an instance index is closed
   * @param {String} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onStreamClosed(instanceIndex) {
    delete this._stateByInstanceIndex[instanceIndex];
  }

  // eslint-disable-next-line complexity
  _updatePositionProfits(position, price) {
    let specification = this.specification(position.symbol);
    if (specification) {
      let multiplier = Math.pow(10, specification.digits);
      if (position.profit !== undefined) {
        position.profit = Math.round(position.profit * multiplier) / multiplier;
      }
      if (position.unrealizedProfit === undefined || position.realizedProfit === undefined) {
        position.unrealizedProfit = (position.type === 'POSITION_TYPE_BUY' ? 1 : -1) *
          (position.currentPrice - position.openPrice) * position.currentTickValue *
          position.volume / specification.tickSize;
        position.unrealizedProfit = Math.round(position.unrealizedProfit * multiplier) / multiplier;
        position.realizedProfit = position.profit - position.unrealizedProfit;
      }
      let newPositionPrice = position.type === 'POSITION_TYPE_BUY' ? price.bid : price.ask;
      let isProfitable = (position.type === 'POSITION_TYPE_BUY' ? 1 : -1) * (newPositionPrice - position.openPrice);
      let currentTickValue = (isProfitable > 0 ? price.profitTickValue : price.lossTickValue);
      let unrealizedProfit = (position.type === 'POSITION_TYPE_BUY' ? 1 : -1) *
        (newPositionPrice - position.openPrice) * currentTickValue *
        position.volume / specification.tickSize;
      unrealizedProfit = Math.round(unrealizedProfit * multiplier) / multiplier;
      position.unrealizedProfit = unrealizedProfit;
      position.profit = position.unrealizedProfit + position.realizedProfit;
      position.profit = Math.round(position.profit * multiplier) / multiplier;
      position.currentPrice = newPositionPrice;
      position.currentTickValue = currentTickValue;
    }
  }
  
  _getState(instanceIndex) {
    if (!this._stateByInstanceIndex['' + instanceIndex]) {
      this._stateByInstanceIndex['' + instanceIndex] = this._constructTerminalState(instanceIndex);
    }
    return this._stateByInstanceIndex['' + instanceIndex];
  }

  _constructTerminalState(instanceIndex) {
    return {
      instanceIndex,
      connected: false,
      connectedToBroker: false,
      accountInformation: undefined,
      positions: [],
      orders: [],
      specificationsBySymbol: {},
      pricesBySymbol: {},
      completedOrders: {},
      removedPositions: {},
      ordersInitialized: false,
      positionsInitialized: false,
      lastUpdateTime: 0,
      initializationCounter: 0,
      specificationCount: 0
    };
  }

  // eslint-disable-next-line complexity
  _getBestState(symbol, mode = 'default') {
    let result;
    let maxUpdateTime = -1;
    let maxInitializationCounter = -1;
    let maxSpecificationCount = -1;
    for (let state of Object.values(this._stateByInstanceIndex)) {
      if (maxInitializationCounter < state.initializationCounter ||
        maxInitializationCounter === state.initializationCounter && maxInitializationCounter === 3 &&
        maxUpdateTime < state.lastUpdateTime ||
        maxInitializationCounter === state.initializationCounter && maxInitializationCounter === 0 &&
        maxSpecificationCount < state.specificationCount) {
        if (!symbol || (mode === 'specification' && state.specificationsBySymbol[symbol]) ||
          (mode === 'price' && state.pricesBySymbol[symbol])) {
          maxUpdateTime = state.lastUpdateTime;
          maxInitializationCounter = state.initializationCounter;
          maxSpecificationCount = state.specificationCount;
          result = state;
        }
      }
    }
    return result || this._constructTerminalState();
  }

  _getHash(obj, accountType, integerKeys) {
    let jsonItem = '';
    if(accountType === 'cloud-g1') {
      const stringify = (objFromJson, key) => {
        if(typeof objFromJson === 'number') {
          if(integerKeys.includes(key)) {
            return objFromJson;
          } else {
            return objFromJson.toFixed(8);
          }
        } else if(Array.isArray(objFromJson)) {
          return `[${objFromJson.map(item => stringify(item)).join(',')}]`; 
        } else if (typeof objFromJson !== 'object' || objFromJson.getTime){
          return JSON.stringify(objFromJson);
        }
    
        let props = Object
          .keys(objFromJson)
          .map(keyItem => `"${keyItem}":${stringify(objFromJson[keyItem], keyItem)}`)
          .join(',');
        return `{${props}}`;
      };
    
      jsonItem = stringify(obj);
    } else if(accountType === 'cloud-g2') {
      jsonItem = JSON.stringify(obj);
    }
    return crypto.MD5(jsonItem).toString();
  }
  
}
