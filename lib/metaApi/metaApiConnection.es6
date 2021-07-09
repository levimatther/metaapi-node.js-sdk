'use strict';

import TerminalState from './terminalState';
import MemoryHistoryStorage from './memoryHistoryStorage';
import SynchronizationListener from '../clients/metaApi/synchronizationListener';
import TimeoutError from '../clients/timeoutError';
import randomstring from 'randomstring';
import ConnectionHealthMonitor from './connectionHealthMonitor';

/**
 * Exposes MetaApi MetaTrader API connection to consumers
 */
export default class MetaApiConnection extends SynchronizationListener {

  /**
   * Constructs MetaApi MetaTrader Api connection
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {HistoryStorage} historyStorage terminal history storage. By default an instance of MemoryHistoryStorage
   * will be used.
   * @param {ConnectionRegistry} connectionRegistry metatrader account connection registry
   * @param {Date} [historyStartTime] history start sync time
   */
  constructor(websocketClient, account, historyStorage, connectionRegistry, historyStartTime) {
    super();
    this._websocketClient = websocketClient;
    this._account = account;
    this._connectionRegistry = connectionRegistry;
    this._historyStartTime = historyStartTime;
    this._terminalState = new TerminalState();
    this._historyStorage = historyStorage || new MemoryHistoryStorage(account.id, connectionRegistry.application);
    this._healthMonitor = new ConnectionHealthMonitor(this);
    this._websocketClient.addSynchronizationListener(account.id, this);
    this._websocketClient.addSynchronizationListener(account.id, this._terminalState);
    this._websocketClient.addSynchronizationListener(account.id, this._historyStorage);
    this._websocketClient.addSynchronizationListener(account.id, this._healthMonitor);
    this._websocketClient.addReconnectListener(this, account.id);
    this._subscriptions = {};
    this._stateByInstanceIndex = {};
    this._synchronized = false;
    this._synchronizationListeners = [];
  }

  /**
   * Returns account information (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readAccountInformation/).
   * @returns {Promise<MetatraderAccountInformation>} promise resolving with account information
   */
  getAccountInformation() {
    return this._websocketClient.getAccountInformation(this._account.id);
  }

  /**
   * Returns positions (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPositions/).
   * @returns {Promise<Array<MetatraderPosition>} promise resolving with array of open positions
   */
  getPositions() {
    return this._websocketClient.getPositions(this._account.id);
  }

  /**
   * Returns specific position (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPosition/).
   * @param {String} positionId position id
   * @return {Promise<MetatraderPosition>} promise resolving with MetaTrader position found
   */
  getPosition(positionId) {
    return this._websocketClient.getPosition(this._account.id, positionId);
  }

  /**
   * Returns open orders (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrders/).
   * @return {Promise<Array<MetatraderOrder>>} promise resolving with open MetaTrader orders
   */
  getOrders() {
    return this._websocketClient.getOrders(this._account.id);
  }

  /**
   * Returns specific open order (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrder/).
   * @param {String} orderId order id (ticket number)
   * @return {Promise<MetatraderOrder>} promise resolving with metatrader order found
   */
  getOrder(orderId) {
    return this._websocketClient.getOrder(this._account.id, orderId);
  }

  /**
   * Returns the history of completed orders for a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTicket/).
   * @param {String} ticket ticket number (order id)
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByTicket(ticket) {
    return this._websocketClient.getHistoryOrdersByTicket(this._account.id, ticket);
  }

  /**
   * Returns the history of completed orders for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByPosition/)
   * @param {String} positionId position id
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByPosition(positionId) {
    return this._websocketClient.getHistoryOrdersByPosition(this._account.id, positionId);
  }

  /**
   * Returns the history of completed orders for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTimeRange/)
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {Number} offset pagination offset, default is 0
   * @param {Number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByTimeRange(startTime, endTime, offset = 0, limit = 1000) {
    return this._websocketClient.getHistoryOrdersByTimeRange(this._account.id, startTime, endTime, offset, limit);
  }

  /**
   * Returns history deals with a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTicket/).
   * @param {String} ticket ticket number (deal id for MT5 or order id for MT4)
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByTicket(ticket) {
    return this._websocketClient.getDealsByTicket(this._account.id, ticket);
  }

  /**
   * Returns history deals for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByPosition/).
   * @param {String} positionId position id
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByPosition(positionId) {
    return this._websocketClient.getDealsByPosition(this._account.id, positionId);
  }

  /**
   * Returns history deals with for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTimeRange/).
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {Number} offset pagination offset, default is 0
   * @param {Number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByTimeRange(startTime, endTime, offset = 0, limit = 1000) {
    return this._websocketClient.getDealsByTimeRange(this._account.id, startTime, endTime, offset, limit);
  }

  /**
   * Clears the order and transaction history of a specified application so that it can be synchronized from scratch
   * (see https://metaapi.cloud/docs/client/websocket/api/removeHistory/).
   * @param {String} [application] application to remove history for
   * @return {Promise} promise resolving when the history is cleared
   */
  removeHistory(application) {
    this._historyStorage.clear();
    return this._websocketClient.removeHistory(this._account.id, application);
  }

  /**
   * Clears the order and transaction history of a specified application and removes application (see
   * https://metaapi.cloud/docs/client/websocket/api/removeApplication/).
   * @return {Promise} promise resolving when the history is cleared and application is removed
   */
  removeApplication() {
    this._historyStorage.clear();
    return this._websocketClient.removeApplication(this._account.id);
  }

  /**
   * Common trade options
   * @typedef {Object} TradeOptions
   * @property {String} [comment] optional order comment. The sum of the line lengths of the comment and the
   * clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {String} [clientId] optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {Number} [magic] optional magic (expert id) number. If not set default value specified in account entity
   * will be used.
   * @property {Number} [slippage] optional slippage in points. Should be greater or equal to zero. In not set,
   * default value specified in account entity will be used. Slippage is ignored if execution mode set to
   * SYMBOL_TRADE_EXECUTION_MARKET in symbol specification. Not used for close by orders.
   */

  /**
   * Market trade options
   * @typedef {TradeOptions} MarketTradeOptions
   * @property {Array<String>} [fillingModes] optional allowed filling modes in the order of priority. Default is to
   * allow all filling modes and prefer ORDER_FILLING_FOK over ORDER_FILLING_IOC. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_filling for extra
   * explanation
   */

  /**
   * Pending order trade options
   * @typedef {TradeOptions} PendingTradeOptions
   * @property {ExpirationOptions} [expiration] optional pending order expiration settings. See Pending order expiration
   * settings section
   */

  /**
   * Pending order expiration settings
   * @typedef {Object} ExpirationOptions
   * @property {String} type pending order expiration type. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_time for the list of
   * possible options. MetaTrader4 platform supports only ORDER_TIME_SPECIFIED expiration type. One of ORDER_TIME_GTC,
   * ORDER_TIME_DAY, ORDER_TIME_SPECIFIED, ORDER_TIME_SPECIFIED_DAY
   * @property {Date} [time] optional pending order expiration time. Ignored if expiration type is not one of
   * ORDER_TIME_DAY or ORDER_TIME_SPECIFIED
   */

  /**
   * Stop options
   * @typedef {Object} StopOptions
   * @property {number} value stop (SL or TP) value
   * @property {string} units stop units. ABSOLUTE_PRICE means the that the value of value field is a final stop value.
   * RELATIVE_* means that the value field value contains relative stop expressed either in price, points, account
   * currency or balance percentage. Default is ABSOLUTE_PRICE. Allowed values are ABSOLUTE_PRICE, RELATIVE_PRICE,
   * RELATIVE_POINTS, RELATIVE_CURRENCY, RELATIVE_BALANCE_PERCENTAGE
   */

  /**
   * Creates a market buy order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {MarketTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  createMarketBuyOrder(symbol, volume, stopLoss, takeProfit, options = {}) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'ORDER_TYPE_BUY', symbol, volume},
      this._generateStopOptions(stopLoss, takeProfit), options || {}));
  }

  /**
   * Creates a market sell order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {MarketTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  createMarketSellOrder(symbol, volume, stopLoss, takeProfit, options = {}) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'ORDER_TYPE_SELL', symbol, volume},
      this._generateStopOptions(stopLoss, takeProfit), options || {}));
  }

  /**
   * Creates a limit buy order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number} openPrice order limit price
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {PendingTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  createLimitBuyOrder(symbol, volume, openPrice, stopLoss, takeProfit, options = {}) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'ORDER_TYPE_BUY_LIMIT', symbol,
      volume, openPrice}, this._generateStopOptions(stopLoss, takeProfit), options || {}));
  }

  /**
   * Creates a limit sell order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number} openPrice order limit price
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {PendingTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  createLimitSellOrder(symbol, volume, openPrice, stopLoss, takeProfit, options = {}) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'ORDER_TYPE_SELL_LIMIT', symbol,
      volume, openPrice}, this._generateStopOptions(stopLoss, takeProfit), options || {}));
  }

  /**
   * Creates a stop buy order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number} openPrice order stop price
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {PendingTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  createStopBuyOrder(symbol, volume, openPrice, stopLoss, takeProfit, options = {}) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'ORDER_TYPE_BUY_STOP', symbol,
      volume, openPrice}, this._generateStopOptions(stopLoss, takeProfit), options || {}));
  }

  /**
   * Creates a stop sell order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number} openPrice order stop price
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {PendingTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  createStopSellOrder(symbol, volume, openPrice, stopLoss, takeProfit, options = {}) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'ORDER_TYPE_SELL_STOP', symbol,
      volume, openPrice}, this._generateStopOptions(stopLoss, takeProfit), options || {}));
  }

  /**
   * Creates a stop limit buy order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number} openPrice order stop price
   * @param {number} stopLimitPrice the limit order price for the stop limit order
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {PendingTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  createStopLimitBuyOrder(symbol, volume, openPrice, stopLimitPrice, stopLoss, takeProfit, options = {}) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'ORDER_TYPE_BUY_STOP_LIMIT',
      symbol, volume, openPrice, stopLimitPrice}, this._generateStopOptions(stopLoss, takeProfit), options || {}));
  }

  /**
   * Creates a stop limit sell order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number} openPrice order stop price
   * @param {number} stopLimitPrice the limit order price for the stop limit order
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {PendingTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  createStopLimitSellOrder(symbol, volume, openPrice, stopLimitPrice, stopLoss, takeProfit, options = {}) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'ORDER_TYPE_SELL_STOP_LIMIT',
      symbol, volume, openPrice, stopLimitPrice}, this._generateStopOptions(stopLoss, takeProfit), options || {}));
  }

  /**
   * Modifies a position (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} positionId position id to modify
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  modifyPosition(positionId, stopLoss, takeProfit) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'POSITION_MODIFY', positionId},
      this._generateStopOptions(stopLoss, takeProfit)));
  }

  /**
   * Partially closes a position (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} positionId position id to modify
   * @param {number} volume volume to close
   * @param {MarketTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  closePositionPartially(positionId, volume, options = {}) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'POSITION_PARTIAL', positionId,
      volume}, options || {}));
  }

  /**
   * Fully closes a position (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} positionId position id to modify
   * @param {MarketTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  closePosition(positionId, options = {}) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'POSITION_CLOSE_ID', positionId},
      options || {}));
  }

  /**
   * Fully closes a position (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} positionId position id to close by opposite position
   * @param {string} oppositePositionId opposite position id to close
   * @param {MarketTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  closeBy(positionId, oppositePositionId, options = {}) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'POSITION_CLOSE_BY', positionId,
      closeByPositionId: oppositePositionId}, options || {}));
  }

  /**
   * Closes positions by a symbol(see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {MarketTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  closePositionsBySymbol(symbol, options = {}) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'POSITIONS_CLOSE_SYMBOL', symbol},
      options || {}));
  }

  /**
   * Modifies a pending order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} orderId order id (ticket number)
   * @param {number} openPrice order stop price
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  modifyOrder(orderId, openPrice, stopLoss, takeProfit) {
    return this._websocketClient.trade(this._account.id, Object.assign({actionType: 'ORDER_MODIFY', orderId, openPrice},
      this._generateStopOptions(stopLoss, takeProfit)));
  }

  /**
   * Cancels order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} orderId order id (ticket number)
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  cancelOrder(orderId) {
    return this._websocketClient.trade(this._account.id, {actionType: 'ORDER_CANCEL', orderId});
  }

  /**
   * Reconnects to the Metatrader terminal (see https://metaapi.cloud/docs/client/websocket/api/reconnect/).
   * @returns {Promise} promise which resolves when reconnection started
   */
  reconnect() {
    return this._websocketClient.reconnect(this._account.id);
  }

  /**
   * Requests the terminal to start synchronization process
   * (see https://metaapi.cloud/docs/client/websocket/synchronizing/synchronize/)
   * @param {String} instanceIndex instance index
   * @returns {Promise} promise which resolves when synchronization started
   */
  async synchronize(instanceIndex) {
    const instance = this.getInstanceNumber(instanceIndex);
    const host = this.getHostName(instanceIndex);
    let startingHistoryOrderTime = new Date(Math.max(
      (this._historyStartTime || new Date(0)).getTime(),
      (await this._historyStorage.lastHistoryOrderTime(instance)).getTime()
    ));
    let startingDealTime = new Date(Math.max(
      (this._historyStartTime || new Date(0)).getTime(),
      (await this._historyStorage.lastDealTime(instance)).getTime()
    ));
    let synchronizationId = randomstring.generate(32);
    this._getState(instanceIndex).lastSynchronizationId = synchronizationId;
    return this._websocketClient.synchronize(this._account.id, instance, host, synchronizationId,
      startingHistoryOrderTime, startingDealTime);
  }

  /**
   * Initializes meta api connection
   * @return {Promise} promise which resolves when meta api connection is initialized
   */
  async initialize() {
    await this._historyStorage.initialize();
  }

  /**
   * Initiates subscription to MetaTrader terminal
   * @returns {Promise} promise which resolves when subscription is initiated
   */
  async subscribe() {
    if(!this._closed) {
      this._websocketClient.ensureSubscribe(this._account.id);
    }
  }

  /**
   * Subscribes on market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/subscribeToMarketData/).
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataSubscription>} subscriptions array of market data subscription to create or update. Please
   * note that this feature is not fully implemented on server-side yet
   * @param {Number} instanceIndex instance index
   * @returns {Promise} promise which resolves when subscription request was processed
   */
  async subscribeToMarketData(symbol, subscriptions, instanceIndex) {
    this._subscriptions[symbol] = {subscriptions};
    await this._websocketClient.subscribeToMarketData(this._account.id, instanceIndex, symbol, subscriptions);
    return this.terminalState.waitForPrice(symbol);
  }

  /**
   * Unsubscribes from market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/unsubscribeFromMarketData/).
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataUnsubscription>} subscriptions array of subscriptions to cancel
   * @param {Number} instanceIndex instance index
   * @returns {Promise} promise which resolves when unsubscription request was processed
   */
  unsubscribeFromMarketData(symbol, subscriptions, instanceIndex) {
    if (!subscriptions) {
      delete this._subscriptions[symbol];
    } else if (this._subscriptions[symbol]) {
      this._subscriptions[symbol].subscriptions = this._subscriptions[symbol].subscriptions
        .filter(s => !subscriptions.find(s2 => s.type === s2.type));
      if (!this._subscriptions[symbol].subscriptions.length) {
        delete this._subscriptions[symbol];
      }
    }
    return this._websocketClient.unsubscribeFromMarketData(this._account.id, instanceIndex, symbol, subscriptions);
  }

  /**
   * Invoked when subscription downgrade has occurred
   * @param {String} instanceIndex index of an account instance connected
   * @param {string} symbol symbol to update subscriptions for
   * @param {Array<MarketDataSubscription>} updates array of market data subscription to update
   * @param {Array<MarketDataUnsubscription>} unsubscriptions array of subscriptions to cancel
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  // eslint-disable-next-line complexity
  async onSubscriptionDowngraded(instanceIndex, symbol, updates, unsubscriptions) {
    let subscriptions = this._subscriptions[symbol];
    if (unsubscriptions && unsubscriptions.length) {
      if (subscriptions) {
        for (let subscription of unsubscriptions) {
          subscriptions = subscriptions.filter(s => s.type === subscription.type);
        }
      }
      this.unsubscribeFromMarketData(symbol, unsubscriptions);
    }
    if (updates && updates.length) {
      if (subscriptions) {
        for (let subscription of updates) {
          subscriptions.filter(s => s.type === subscription.type)
            .forEach(s => s.intervalInMilliiseconds = subscription.intervalInMilliseconds);
        }
      }
      this.subscribeToMarketData(symbol, updates);
    }
    if (subscriptions && !subscriptions.length) {
      delete this._subscriptions[symbol];
    }
  }

  /**
   * Returns list of the symbols connection is subscribed to
   * @returns {Array<String>} list of the symbols connection is subscribed to
   */
  get subscribedSymbols() {
    return Object.keys(this._subscriptions);
  }

  /**
   * Returns subscriptions for a symbol
   * @param {string} symbol symbol to retrieve subscriptions for
   * @returns {Array<MarketDataSubscription>} list of market data subscriptions for the symbol
   */
  subscriptions(symbol) {
    return (this._subscriptions[symbol] || {}).subscriptions;
  }

  /**
   * Retrieves available symbols for an account (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbols/).
   * @param {String} symbol symbol to retrieve symbols for
   * @returns {Promise<Array<string>>} promise which resolves when symbols are retrieved
   */
  getSymbols() {
    return this._websocketClient.getSymbols(this._account.id);
  }

  /**
   * Retrieves specification for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolSpecification/).
   * @param {String} symbol symbol to retrieve specification for
   * @returns {Promise<MetatraderSymbolSpecification>} promise which resolves when specification is retrieved
   */
  getSymbolSpecification(symbol) {
    return this._websocketClient.getSymbolSpecification(this._account.id, symbol);
  }

  /**
   * Retrieves latest price for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolPrice/).
   * @param {String} symbol symbol to retrieve price for
   * @returns {Promise<MetatraderSymbolPrice>} promise which resolves when price is retrieved
   */
  getSymbolPrice(symbol) {
    return this._websocketClient.getSymbolPrice(this._account.id, symbol);
  }

  /**
   * Retrieves latest candle for a symbol and timeframe (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readCandle/).
   * @param {String} symbol symbol to retrieve candle for
   * @param {string} timeframe defines the timeframe according to which the candle must be generated. Allowed values for
   * MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed values
   * for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   * @returns {Promise<MetatraderCandle>} promise which resolves when candle is retrieved
   */
  getCandle(symbol, timeframe) {
    return this._websocketClient.getCandle(this._account.id, symbol, timeframe);
  }

  /**
   * Retrieves latest tick for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readTick/).
   * @param {String} symbol symbol to retrieve tick for
   * @returns {Promise<MetatraderTick>} promise which resolves when tick is retrieved
   */
  getTick(symbol) {
    return this._websocketClient.getTick(this._account.id, symbol);
  }

  /**
   * Retrieves latest order book for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readBook/).
   * @param {String} symbol symbol to retrieve order book for
   * @returns {Promise<MetatraderTick>} promise which resolves when order book is retrieved
   */
  getBook(symbol) {
    return this._websocketClient.getBook(this._account.id, symbol);
  }

  /**
   * Sends client uptime stats to the server.
   * @param {Object} uptime uptime statistics to send to the server
   * @returns {Promise} promise which resolves when uptime statistics is submitted
   */
  saveUptime(uptime) {
    return this._websocketClient.saveUptime(this._account.id, uptime);
  }

  /**
   * Returns local copy of terminal state
   * @returns {TerminalState} local copy of terminal state
   */
  get terminalState() {
    return this._terminalState;
  }

  /**
   * Returns local history storage
   * @returns {HistoryStorage} local history storage
   */
  get historyStorage() {
    return this._historyStorage;
  }

  /**
   * Adds synchronization listener
   * @param {SynchronizationListener} listener synchronization listener to add
   */
  addSynchronizationListener(listener) {
    this._synchronizationListeners.push(listener);
    this._websocketClient.addSynchronizationListener(this._account.id, listener);
  }

  /**
   * Removes synchronization listener for specific account
   * @param {SynchronizationListener} listener synchronization listener to remove
   */
  removeSynchronizationListener(listener) {
    this._synchronizationListeners = this._synchronizationListeners.filter(l => l !== listener);
    this._websocketClient.removeSynchronizationListener(this._account.id, listener);
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {String} instanceIndex index of an account instance connected
   * @param {Number} replicas number of account replicas launched
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onConnected(instanceIndex, replicas) {
    let key = randomstring.generate(32);
    let state = this._getState(instanceIndex);
    state.shouldSynchronize = key;
    state.synchronizationRetryIntervalInSeconds = 1;
    state.synchronized = false;
    this._ensureSynchronized(instanceIndex, key);
    let indices = [];
    for (let i = 0; i < replicas; i++) {
      indices.push(i);
    }
    for (let e of Object.entries(this._stateByInstanceIndex)) {
      if (!indices.includes(this.getInstanceNumber(e[1].instanceIndex))) {
        delete this._stateByInstanceIndex[e[0]];
      }
    }
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} instanceIndex index of an account instance connected
   */
  async onDisconnected(instanceIndex) {
    let state = this._getState(instanceIndex);
    state.lastDisconnectedSynchronizationId = state.lastSynchronizationId;
    state.lastSynchronizationId = undefined;
    state.shouldSynchronize = undefined;
    state.synchronized = false;
    state.disconnected = true;
  }

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   */
  async onDealSynchronizationFinished(instanceIndex, synchronizationId) {
    let state = this._getState(instanceIndex);
    state.dealsSynchronized[synchronizationId] = true;
  }

  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   */
  async onOrderSynchronizationFinished(instanceIndex, synchronizationId) {
    let state = this._getState(instanceIndex);
    state.ordersSynchronized[synchronizationId] = true;
  }

  /**
   * Invoked when MetaTrader account information is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderAccountInformation} accountInformation updated MetaTrader account information
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onAccountInformationUpdated(instanceIndex, accountInformation) {
    for(let symbol of this.subscribedSymbols) {
      if(!this._terminalState.price(symbol)) {
        const instance = this.getInstanceNumber(instanceIndex);
        Promise.resolve(this.subscribeToMarketData(symbol, this._subscriptions[symbol].subscriptions, instance))
          .catch(err => console.error('[' + (new Date()).toISOString() + '] MetaApi websocket client for account ' 
            + this._account.id + ':' + instanceIndex + ' failed to resubscribe to symbol ' + symbol, err));
      }
    }
  }

  /**
   * Invoked when connection to MetaApi websocket API restored after a disconnect
   * @return {Promise} promise which resolves when connection to MetaApi websocket API restored after a disconnect
   */
  async onReconnected() {
    this._stateByInstanceIndex = {};
  }

  /**
   * Invoked when a stream for an instance index is closed
   * @param {String} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onStreamClosed(instanceIndex) {
    delete this._stateByInstanceIndex[instanceIndex];
  }

  /**
   * Returns flag indicating status of state synchronization with MetaTrader terminal
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId optional synchronization request id, last synchronization request id will be used
   * by default
   * @return {Promise<Boolean>} promise resolving with a flag indicating status of state synchronization with MetaTrader
   * terminal
   */
  async isSynchronized(instanceIndex, synchronizationId) {
    return Object.values(this._stateByInstanceIndex).reduce((acc, s) => {
      if (instanceIndex !== undefined && s.instanceIndex !== instanceIndex) {
        return acc;
      }
      synchronizationId = synchronizationId || s.lastSynchronizationId;
      let synchronized = !!s.ordersSynchronized[synchronizationId] && !!s.dealsSynchronized[synchronizationId];
      return acc || synchronized;
    }, false);
  }

  /**
   * @typedef {Object} SynchronizationOptions
   * @property {String} [applicationPattern] application regular expression pattern, default is .*
   * @property {String} [synchronizationId] synchronization id, last synchronization request id will be used by
   * default
   * @property {Number} [instanceIndex] index of an account instance to ensure synchronization on, default is to wait
   * for the first instance to synchronize
   * @param {Number} [timeoutInSeconds] wait timeout in seconds, default is 5m
   * @param {Number} [intervalInMilliseconds] interval between account reloads while waiting for a change, default is 1s
   */

  /**
   * Waits until synchronization to MetaTrader terminal is completed
   * @param {SynchronizationOptions} synchronization options
   * @return {Promise} promise which resolves when synchronization to MetaTrader terminal is completed
   * @throws {TimeoutError} if application failed to synchronize with the teminal withing timeout allowed
   */
  // eslint-disable-next-line complexity
  async waitSynchronized(opts) {
    opts = opts || {};
    let instanceIndex = opts.instanceIndex;
    let synchronizationId = opts.synchronizationId;
    let timeoutInSeconds = opts.timeoutInSeconds || 300;
    let intervalInMilliseconds = opts.intervalInMilliseconds || 1000;
    let applicationPattern = opts.applicationPattern ||
      (this._account.application === 'CopyFactory' ? 'CopyFactory.*|RPC' : 'RPC');
    let startTime = Date.now();
    let synchronized;
    while (!(synchronized = await this.isSynchronized(instanceIndex, synchronizationId)) &&
      (startTime + timeoutInSeconds * 1000) > Date.now()) {
      await new Promise(res => setTimeout(res, intervalInMilliseconds));
    }
    let state;
    if (instanceIndex === undefined) {
      for (let s of Object.values(this._stateByInstanceIndex)) {
        if (await this.isSynchronized(s.instanceIndex, synchronizationId)) {
          state = s;
          instanceIndex = s.instanceIndex;
        }
      }
    } else {
      state = Object.values(this._stateByInstanceIndex).find(s => s.instanceIndex === instanceIndex);
    }
    if (!synchronized) {
      throw new TimeoutError('Timed out waiting for MetaApi to synchronize to MetaTrader account ' +
        this._account.id + ', synchronization id ' + (synchronizationId || (state && state.lastSynchronizationId) ||
          (state && state.lastDisconnectedSynchronizationId)));
    }
    let timeLeftInSeconds = Math.max(0, timeoutInSeconds - (Date.now() - startTime) / 1000);
    await this._websocketClient.waitSynchronized(this._account.id, this.getInstanceNumber(instanceIndex),
      applicationPattern, timeLeftInSeconds);
  }

  /**
   * Closes the connection. The instance of the class should no longer be used after this method is invoked.
   */
  async close() {
    if(!this._closed) {
      this._stateByInstanceIndex = {};
      await this._websocketClient.unsubscribe(this._account.id);
      this._websocketClient.removeSynchronizationListener(this._account.id, this);
      this._websocketClient.removeSynchronizationListener(this._account.id, this._terminalState);
      this._websocketClient.removeSynchronizationListener(this._account.id, this._historyStorage);
      this._websocketClient.removeSynchronizationListener(this._account.id, this._healthMonitor);
      for (let listener of this._synchronizationListeners) {
        this._websocketClient.removeSynchronizationListener(this._account.id, listener);
      }
      this._websocketClient.removeReconnectListener(this);
      this._connectionRegistry.remove(this._account.id);
      this._healthMonitor.stop();
      this._closed = true;
    }
  }

  /**
   * Returns synchronization status
   * @return {boolean} synchronization status
   */
  get synchronized() {
    return Object.values(this._stateByInstanceIndex).reduce((acc, s) => acc || s.synchronized, false);
  }

  /**
   * Returns MetaApi account
   * @return {MetatraderAccount} MetaApi account
   */
  get account() {
    return this._account;
  }

  /**
   * Returns connection health monitor instance
   * @return {ConnectionHealthMonitor} connection health monitor instance
   */
  get healthMonitor() {
    return this._healthMonitor;
  }

  _generateStopOptions(stopLoss, takeProfit) {
    let trade = {};
    if (typeof stopLoss === 'number') {
      trade.stopLoss = stopLoss;
    } else if (stopLoss) {
      trade.stopLoss = stopLoss.value;
      trade.stopLossUnits = stopLoss.units;
    }
    if (typeof takeProfit === 'number') {
      trade.takeProfit = takeProfit;
    } else if (takeProfit) {
      trade.takeProfit = takeProfit.value;
      trade.takeProfitUnits = takeProfit.units;
    }
    return trade;
  }

  async _ensureSynchronized(instanceIndex, key) {
    let state = this._getState(instanceIndex);
    if (state && !this._closed) {
      try {
        const synchronizationResult = await this.synchronize(instanceIndex);
        if(synchronizationResult) {
          state.synchronized = true;
          state.synchronizationRetryIntervalInSeconds = 1;
        }
      } catch (err) {
        console.error('[' + (new Date()).toISOString() + '] MetaApi websocket client for account ' + this._account.id +
          ':' + instanceIndex + ' failed to synchronize', err);
        if (state.shouldSynchronize === key) {
          setTimeout(this._ensureSynchronized.bind(this, instanceIndex, key),
            state.synchronizationRetryIntervalInSeconds * 1000);
          state.synchronizationRetryIntervalInSeconds = Math.min(state.synchronizationRetryIntervalInSeconds * 2, 300);
        }
      }
    }
  }

  _getState(instanceIndex) {
    if (!this._stateByInstanceIndex['' + instanceIndex]) {
      this._stateByInstanceIndex['' + instanceIndex] = {
        instanceIndex,
        ordersSynchronized: {},
        dealsSynchronized: {},
        shouldSynchronize: undefined,
        synchronizationRetryIntervalInSeconds: 1,
        synchronized: false,
        lastDisconnectedSynchronizationId: undefined,
        lastSynchronizationId: undefined,
        disconnected: false
      };
    }
    return this._stateByInstanceIndex['' + instanceIndex];
  }

}
