'use strict';

import randomstring from 'randomstring';
import SynchronizationListener from '../clients/metaApi/synchronizationListener';
import LoggerManager from '../logger';
import TerminalHashManager from './terminalHashManager';

/**
 * Responsible for storing a local copy of remote terminal state
 */
export default class TerminalState extends SynchronizationListener {

  /**
   * Constructs the instance of terminal state class
   * @param {MetatraderAccount} account mt account
   * @param {TerminalHashManager} terminalHashManager terminal hash manager
   */
  constructor(account, terminalHashManager) {
    super();
    this._id = randomstring.generate(32);
    this._account = account;
    this._terminalHashManager = terminalHashManager;
    this._stateByInstanceIndex = {};
    this._waitForPriceResolves = {};
    this._combinedInstanceIndex = 'combined';
    this._combinedState = {
      accountInformation: undefined,
      positions: [],
      orders: [],
      specificationsBySymbol: null,
      pricesBySymbol: {},
      removedPositions: {},
      specificationsHash: null,
      positionsHash: null,
      ordersHash: null,
      ordersInitialized: false,
      positionsInitialized: false,
      lastUpdateTime: 0,
      lastStatusTime: 0,
      lastQuoteTime: undefined,
      lastQuoteBrokerTime: undefined
    };
    this._logger = LoggerManager.getLogger('TerminalState');
    this._checkCombinedStateActivityJob = this._checkCombinedStateActivityJob.bind(this);
    setInterval(this._checkCombinedStateActivityJob, 5 * 60 * 1000);
  }

  get id(){
    return this._id;
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
    return this._combinedState.accountInformation;
  }

  /**
   * Returns a local copy of MetaTrader positions opened
   * @returns {Array<MetatraderPosition>} a local copy of MetaTrader positions opened
   */
  get positions() {
    const hash = this._combinedState.positionsHash;
    return hash ? Object.values(this._terminalHashManager.getPositionsByHash(this._account.id, hash) || {}) : [];
  }

  /**
   * Returns a local copy of MetaTrader orders opened
   * @returns {Array<MetatraderOrder>} a local copy of MetaTrader orders opened
   */
  get orders() {
    const hash = this._combinedState.ordersHash;
    return hash ? Object.values(this._terminalHashManager.getOrdersByHash(this._account.id, hash) || {}) : [];
  }

  /**
   * Returns a local copy of symbol specifications available in MetaTrader trading terminal
   * @returns {Array<MetatraderSymbolSpecification>} a local copy of symbol specifications available in MetaTrader
   * trading terminal
   */
  get specifications() {
    const hash = this._combinedState.specificationsHash;
    return hash ? Object.values(this._terminalHashManager.getSpecificationsByHash(this._account.server,
      this._combinedState.specificationsHash) || {}) : [];
  }

  /**
   * Returns hashes of terminal state data for incremental synchronization
   * @returns {Promise<Object>} promise resolving with hashes of terminal state data
   */
  // eslint-disable-next-line complexity
  getHashes() {
    const specificationsHashes = this._terminalHashManager.getLastUsedSpecificationHashes(this._account.server);
    const positionsHashes = this._terminalHashManager.getLastUsedPositionHashes(this._account.id);
    const ordersHashes = this._terminalHashManager.getLastUsedOrderHashes(this._account.id);

    return {
      specificationsHashes: specificationsHashes,
      positionsHashes: positionsHashes,
      ordersHashes: ordersHashes
    };
  }

  /**
   * Returns MetaTrader symbol specification by symbol
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolSpecification} MetatraderSymbolSpecification found or undefined if specification for a
   * symbol is not found
   */
  specification(symbol) {
    if(this._combinedState.specificationsHash) {
      const state = this._terminalHashManager.getSpecificationsByHash(this._account.server,
        this._combinedState.specificationsHash);
      return state[symbol];
    } else {
      return null;
    }
  }

  /**
   * Returns MetaTrader symbol price by symbol
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolPrice} MetatraderSymbolPrice found or undefined if price for a symbol is not found
   */
  price(symbol) {
    return this._combinedState.pricesBySymbol[symbol];
  }

  /**
   * Quote time
   * @typdef {Object} QuoteTime
   * @property {Date} time quote time
   * @property {String} brokerTime quote time in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */

  /**
   * Returns time of the last received quote
   * @return {QuoteTime} time of the last received quote
   */
  get lastQuoteTime() {
    if (this._combinedState.lastQuoteTime) {
      return {
        time: this._combinedState.lastQuoteTime,
        brokerTime: this._combinedState.lastQuoteBrokerTime,
      };
    } else {
      return undefined;
    }
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
    this._combinedState.lastStatusTime = Date.now();
    this._getState(instanceIndex).connectedToBroker = connected;
  }

  /**
   * Invoked when MetaTrader terminal state synchronization is started
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} specificationsHash specifications hash
   * @param {string} positionsHash positions hash
   * @param {string} ordersHash orders hash
   * @param {string} synchronizationId synchronization id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSynchronizationStarted(instanceIndex, specificationsHash, positionsHash, ordersHash, synchronizationId) {
    const unsynchronizedStates = this._getStateIndicesOfSameInstanceNumber(instanceIndex)
      .filter(stateIndex => !this._stateByInstanceIndex[stateIndex].ordersInitialized);
    unsynchronizedStates.sort((a,b) => b.lastSyncUpdateTime - a.lastSyncUpdateTime);
    unsynchronizedStates.slice(1).forEach(stateIndex => this._removeState(stateIndex));

    let state = this._getState(instanceIndex);
    state.isSpecificationsExpected = !specificationsHash;
    state.isPositionsExpected = !positionsHash;
    state.isOrdersExpected = !ordersHash;
    state.lastSyncUpdateTime = Date.now();
    state.accountInformation = undefined;
    state.pricesBySymbol = {};
    state.positions = [];
    state.removedPositions = {};
    if(!positionsHash) {
      state.positionsInitialized = false;
      state.positionsHash = null;
    } else {
      state.positionsHash = positionsHash;
    }
    state.orders = [];
    if(!ordersHash) {
      state.ordersInitialized = false;
      state.ordersHash = null;
    } else {
      state.ordersHash = ordersHash;
    }
    state.specificationsBySymbol = {};
    if(!specificationsHash) {
      this._logger.trace(() => `${this._account.id}:${instanceIndex}:${synchronizationId}: cleared specifications ` +
        'on synchronization start');
      state.specificationsHash = null;
    } else {
      this._logger.trace(() => `${this._account.id}:${instanceIndex}:${synchronizationId}: no need to clear ` +
        `specifications on synchronization start, ${Object.keys(state.specificationsBySymbol || {}).length} ` +
        'specifications reused');
      state.specificationsHash = specificationsHash;
    }
  }

  /**
   * Invoked when MetaTrader account information is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderAccountInformation} accountInformation updated MetaTrader account information
   */
  onAccountInformationUpdated(instanceIndex, accountInformation) {
    let state = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    state.accountInformation = accountInformation;
    if (accountInformation) {
      this._combinedState.accountInformation = Object.assign({}, accountInformation);
    }
  }

  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderPosition>} positions updated array of positions
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsReplaced(instanceIndex, positions) {
    let state = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    if(state.isPositionsExpected) {
      state.positions = positions;
    }
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
  }

  /**
   * Invoked when MetaTrader positions are updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderPosition[]} positions updated MetaTrader positions
   * @param {string[]} removedPositionIds removed position ids
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionsUpdated(instanceIndex, positions, removedPositionIds) {
    let instanceState = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);

    const updatePositions = async (state, instance) => {
      const hash = await this._terminalHashManager.updatePositions(this._account.id, this._account.type, this._id,
        instance, positions, removedPositionIds, state.positionsHash);
      state.positionsHash = hash;
    };
    await updatePositions(instanceState, instanceIndex);
    await updatePositions(this._combinedState, this._combinedInstanceIndex);
  }

  /**
   * Invoked when the orders are replaced as a result of initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderOrder>} orders updated array of pending orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrdersReplaced(instanceIndex, orders) {
    let state = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    if(state.isOrdersExpected) {
      state.orders = orders;
    }
  }

  /**
   * Invoked when pending order synchronization fnished to indicate progress of an initial terminal state
   * synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  // eslint-disable-next-line complexity, max-statements
  async onPendingOrdersSynchronized(instanceIndex, synchronizationId) {
    let state = this._getState(instanceIndex);
    state.positionsInitialized = true;
    state.ordersInitialized = true;
    this._combinedState.accountInformation = state.accountInformation ? Object.assign({}, state.accountInformation) :
      undefined;
    if(state.positions.length) {
      const hash = await this._terminalHashManager.recordPositions(this._account.id,
        this._account.type, this._id, instanceIndex, state.positions);
      state.positionsHash = hash;
      this._combinedState.positions = (state.positions || []).map(p => Object.assign({}, p));
      this._combinedState.positionsHash = hash;
    } else if (state.positionsHash) {
      this._terminalHashManager.removePositionReference(this._account.id, this.id, instanceIndex);
      this._terminalHashManager.addPositionReference(this._account.id, state.positionsHash,
        this.id, instanceIndex);
      this._combinedState.positionsHash = state.positionsHash;
      this._terminalHashManager.removePositionReference(this._account.id, this.id, this._combinedInstanceIndex);
      this._terminalHashManager.addPositionReference(this._account.id, state.positionsHash,
        this.id, this._combinedInstanceIndex);
    }
    if(state.orders.length) {
      const hash = await this._terminalHashManager.recordOrders(this._account.id,
        this._account.type, this._id, instanceIndex, state.orders);
      state.ordersHash = hash;
      this._combinedState.orders = (state.orders || []).map(o => Object.assign({}, o));
      this._combinedState.ordersHash = hash;
    } else if (state.ordersHash) {
      this._terminalHashManager.removeOrderReference(this._account.id, this.id, instanceIndex);
      this._terminalHashManager.addOrderReference(this._account.id, state.ordersHash,
        this.id, instanceIndex);
      this._combinedState.ordersHash = state.ordersHash;
      this._terminalHashManager.removeOrderReference(this._account.id, this.id, this._combinedInstanceIndex);
      this._terminalHashManager.addOrderReference(this._account.id, state.ordersHash,
        this.id, this._combinedInstanceIndex);
    }
    this._logger.trace(() => `${this._account.id}:${instanceIndex}:${synchronizationId}: assigned specifications to ` +
      'combined state from ' +
      `${instanceIndex}, ${Object.keys(state.specificationsBySymbol || {}).length} specifications assigned`);
    this._combinedState.positionsInitialized = true;
    this._combinedState.ordersInitialized = true;
    if (Object.keys(state.specificationsBySymbol || {}).length) {
      if(state.isSpecificationsExpected) {
        const hash = await this._terminalHashManager.recordSpecifications(this._account.server,
          this._account.type, this._id, instanceIndex, Object.values(state.specificationsBySymbol));
        this._combinedState.specificationsHash = hash;
        state.specificationsHash = hash;
        state.specificationsBySymbol = null;
      } else if(state.specificationsHash) {
        const hash = await this._terminalHashManager.updateSpecifications(this._account.server,
          this._account.type, this._id, instanceIndex, Object.values(state.specificationsBySymbol),
          [], state.specificationsHash);
        state.specificationsHash = hash;
      }
    } else if (state.specificationsHash) {
      this._terminalHashManager.removeSpecificationReference(this._account.server,
        this.id, instanceIndex);
      this._terminalHashManager.addSpecificationReference(this._account.server, state.specificationsHash,
        this.id, instanceIndex);
      this._combinedState.specificationsHash = state.specificationsHash;
      this._terminalHashManager.removeSpecificationReference(this._account.server,
        this.id, this._combinedInstanceIndex);
      this._terminalHashManager.addSpecificationReference(this._account.server, state.specificationsHash,
        this.id, this._combinedInstanceIndex);
    }
    for(let stateIndex of this._getStateIndicesOfSameInstanceNumber(instanceIndex)) {
      if (!this._stateByInstanceIndex[stateIndex].connected) {
        this._removeState(stateIndex);
      }
    }
  }

  /**
   * Invoked when MetaTrader pending orders are updated or completed
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderOrder[]} orders updated MetaTrader pending orders
   * @param {string[]} completedOrderIds completed MetaTrader pending order ids
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPendingOrdersUpdated(instanceIndex, orders, completedOrderIds) {
    let instanceState = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    
    const updatePendingOrders = async (state, instance) => {
      const hash = await this._terminalHashManager.updateOrders(this._account.id, this._account.type, this._id,
        instance, orders, completedOrderIds, state.ordersHash);
      state.ordersHash = hash;
    };
    await updatePendingOrders(instanceState, instanceIndex);
    await updatePendingOrders(this._combinedState, this._combinedInstanceIndex);
  }

  /**
   * Invoked when a symbol specification was updated
   * @param {String} instanceIndex index of account instance connected
   * @param {Array<MetatraderSymbolSpecification>} specifications updated specifications
   * @param {Array<String>} removedSymbols removed symbols
   */
  async onSymbolSpecificationsUpdated(instanceIndex, specifications, removedSymbols) {
    let instanceState = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    if(!instanceState.ordersInitialized) {
      for (let specification of specifications) {
        instanceState.specificationsBySymbol[specification.symbol] = specification;
      }
    } else {
      const hash = await this._terminalHashManager.updateSpecifications(this._account.server, this._account.type,
        this._id, instanceIndex, specifications, removedSymbols, instanceState.specificationsHash);
      instanceState.specificationsHash = hash;
      const combinedHash = await this._terminalHashManager.updateSpecifications(this._account.server,
        this._account.type, this._id, this._combinedInstanceIndex, specifications, removedSymbols,
        this._combinedState.specificationsHash);
      this._combinedState.specificationsHash = combinedHash;
    }
    this._logger.trace(() => `${this._account.id}:${instanceIndex}: updated ${specifications.length} specifications, ` +
      `removed ${removedSymbols.length} specifications. There are ` +
      `${Object.keys(instanceState.specificationsBySymbol || {}).length} specifications after update`);
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
    let instanceState = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);

    // eslint-disable-next-line complexity,max-statements
    const updateSymbolPrices = (state) => {
      state.lastUpdateTime = Math.max(prices.map(p => p.time.getTime()));
      let pricesInitialized = false;
      let priceUpdated = false;
      for (let price of prices || []) {
        let currentPrice = state.pricesBySymbol[price.symbol];
        if (currentPrice && currentPrice.time.getTime() > price.time.getTime()) {
          continue;
        } else {
          priceUpdated = true;
        }
        if (!state.lastQuoteTime || state.lastQuoteTime.getTime() < price.time.getTime()) {
          state.lastQuoteTime = price.time;
          state.lastQuoteBrokerTime = price.brokerTime;
        }
        state.pricesBySymbol[price.symbol] = price;
        const allPositions = Object.values(this._terminalHashManager.getPositionsByHash(this._account.id, 
          state.positionsHash) || {});
        const allOrders = Object.values(this._terminalHashManager.getOrdersByHash(this._account.id, 
          state.ordersHash) || {});
        let positions = allPositions.filter(p => p.symbol === price.symbol);
        let otherPositions = allPositions.filter(p => p.symbol !== price.symbol);
        let orders = allOrders.filter(o => o.symbol === price.symbol);
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
      if (priceUpdated && state.accountInformation) {
        const positions = Object.values(this._terminalHashManager.getPositionsByHash(state.positionsHash) || {});
        if (state.positionsInitialized && pricesInitialized) {
          if (state.accountInformation.platform === 'mt5') {
            state.accountInformation.equity = equity !== undefined ? equity : state.accountInformation.balance +
              positions.reduce((acc, p) => acc +
                Math.round((p.unrealizedProfit || 0) * 100) / 100 + Math.round((p.swap || 0) * 100) / 100, 0);
          } else {
            state.accountInformation.equity = equity !== undefined ? equity : state.accountInformation.balance +
            positions.reduce((acc, p) => acc + Math.round((p.swap || 0) * 100) / 100 +
              Math.round((p.commission || 0) * 100) / 100 + Math.round((p.unrealizedProfit || 0) * 100) / 100, 0);
          }
          state.accountInformation.equity = Math.round(state.accountInformation.equity * 100) / 100;
        } else {
          state.accountInformation.equity = equity !== undefined ? equity : state.accountInformation.equity;
        }
        state.accountInformation.margin = margin !== undefined ? margin : state.accountInformation.margin;
        state.accountInformation.freeMargin = freeMargin !== undefined ? freeMargin : 
          state.accountInformation.freeMargin;
        state.accountInformation.marginLevel = freeMargin !== undefined ? marginLevel :
          state.accountInformation.marginLevel;
      }
    };
    updateSymbolPrices(instanceState);
    updateSymbolPrices(this._combinedState);
  }

  /**
   * Invoked when a stream for an instance index is closed
   * @param {String} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onStreamClosed(instanceIndex) {
    if(this._stateByInstanceIndex[instanceIndex]) {
      for(let stateIndex of this._getStateIndicesOfSameInstanceNumber(instanceIndex)) {
        const instanceState = this._stateByInstanceIndex[stateIndex];
        if(!this._stateByInstanceIndex[instanceIndex].ordersInitialized 
            && this._stateByInstanceIndex[instanceIndex].lastSyncUpdateTime <= instanceState.lastSyncUpdateTime) {
          this._removeState(instanceIndex);
          break;
        }
        if(instanceState.connected && instanceState.ordersInitialized) {
          this._removeState(instanceIndex);
          break;
        }
      }
    }
  }

  /**
   * Removes connection related data from terminal hash manager
   */
  close() {
    Object.keys(this._stateByInstanceIndex).forEach(instanceIndex => {
      this._removeFromHashManager(instanceIndex);
    });
    this._removeFromHashManager(this._combinedInstanceIndex);
  }

  // resets combined state and removes from hash manager if has been disconnected for a long time
  _checkCombinedStateActivityJob() {
    if (!this.connectedToBroker && this._combinedState.lastStatusTime < Date.now() - 30 * 60 * 1000) {
      this._removeFromHashManager(this._combinedInstanceIndex);
      
      this._combinedState.accountInformation = undefined;
      this._combinedState.specificationsBySymbol = null;
      this._combinedState.pricesBySymbol = {};
      this._combinedState.specificationsHash = null;
      
      this._combinedState.orders = [];
      this._combinedState.ordersHash = null;
      
      this._combinedState.positions = [];
      this._combinedState.positionsHash = null;
      
      this._combinedState.ordersInitialized = false;
      this._combinedState.positionsInitialized = false;
      this._combinedState.lastUpdateTime = 0;
      this._combinedState.lastStatusTime = 0;
      this._combinedState.lastQuoteTime = undefined;
      this._combinedState.lastQuoteBrokerTime = undefined;
    }
  }

  _removeState(instanceIndex) {
    delete this._stateByInstanceIndex[instanceIndex];
    this._removeFromHashManager(instanceIndex);
  }

  _removeFromHashManager(instanceIndex) {
    this._terminalHashManager.removeConnectionReferences(this._account.server,
      this._account.id, this._id, instanceIndex);
  }

  _refreshStateUpdateTime(instanceIndex){
    const state = this._stateByInstanceIndex[instanceIndex];
    if(state && state.ordersInitialized) {
      state.lastSyncUpdateTime = Date.now();
    }
  }

  _getStateIndicesOfSameInstanceNumber(instanceIndex) {
    const region = instanceIndex.split(':')[0];
    const instanceNumber = instanceIndex.split(':')[1];
    return Object.keys(this._stateByInstanceIndex)
      .filter(stateInstanceIndex => stateInstanceIndex.startsWith(`${region}:${instanceNumber}:`) && 
      instanceIndex !== stateInstanceIndex);
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
      this._logger.trace(`${this._account.id}:${instanceIndex}: constructed new state`);
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
      ordersInitialized: false,
      positionsInitialized: false,
      lastUpdateTime: 0,
      lastSyncUpdateTime: 0,
      positionsHash: null,
      ordersHash: null,
      specificationsHash: null,
      isSpecificationsExpected: true,
      isPositionsExpected: true,
      isOrdersExpected: true,
      lastQuoteTime: undefined,
      lastQuoteBrokerTime: undefined
    };
  }

}
