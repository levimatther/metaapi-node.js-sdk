'use strict';

import TerminalState from './terminalState';
import ConnectionHealthMonitor from './connectionHealthMonitor';
import LoggerManager from '../logger';
import MetaApiConnectionInstance from './metaApiConnectionInstance';

/**
 * Exposes MetaApi MetaTrader streaming API connection instance to consumers
 */
export default class StreamingMetaApiConnectionInstance extends MetaApiConnectionInstance {

  /**
   * Constructs MetaApi MetaTrader streaming Api connection instance
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {StreamingMetaApiConnection} metaApiConnection streaming MetaApi connection
   */
  constructor(websocketClient, metaApiConnection) {
    super(websocketClient, metaApiConnection);
    this._metaApiConnection = metaApiConnection;
    this._synchronizationListeners = [];
    this._logger = LoggerManager.getLogger('StreamingMetaApiConnectionInstance');
  }

  /**
   * Opens the connection. Can only be called the first time, next calls will be ignored.
   * @return {Promise} promise resolving when the connection is opened
   */
  async connect() {
    if(!this._opened) {
      this._opened = true;
      try {
        await this._metaApiConnection.connect(this.instanceId);
      } catch (err) {
        await this.close();
        throw err;
      }
    }
  }

  /**
   * Clears the order and transaction history of a specified application and removes application (see
   * https://metaapi.cloud/docs/client/websocket/api/removeApplication/).
   * @return {Promise} promise resolving when the history is cleared and application is removed
   */
  removeApplication() {
    return this._metaApiConnection.removeApplication();
  }

  /**
   * Subscribes on market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/subscribeToMarketData/).
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataSubscription>} subscriptions array of market data subscription to create or update. Please
   * note that this feature is not fully implemented on server-side yet
   * @param {number} [timeoutInSeconds] timeout to wait for prices in seconds, default is 30
   * @param {boolean} [waitForQuote] if set to false, the method will resolve without waiting for the first quote to
   * arrive. Default is to wait for quote if quotes subscription is requested.
   * @returns {Promise} promise which resolves when subscription request was processed
   */
  async subscribeToMarketData(symbol, subscriptions, timeoutInSeconds, waitForQuote = true) {
    this._checkIsConnectionActive();
    return this._metaApiConnection.subscribeToMarketData(symbol, subscriptions, timeoutInSeconds, waitForQuote);
  }

  /**
   * Unsubscribes from market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/unsubscribeFromMarketData/).
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataUnsubscription>} subscriptions array of subscriptions to cancel
   * @returns {Promise} promise which resolves when unsubscription request was processed
   */
  unsubscribeFromMarketData(symbol, subscriptions) {
    this._checkIsConnectionActive();
    return this._metaApiConnection.unsubscribeFromMarketData(symbol, subscriptions);
  }

  /**
   * Returns list of the symbols connection is subscribed to
   * @returns {Array<String>} list of the symbols connection is subscribed to
   */
  get subscribedSymbols() {
    return this._metaApiConnection.subscribedSymbols;
  }

  /**
   * Returns subscriptions for a symbol
   * @param {string} symbol symbol to retrieve subscriptions for
   * @returns {Array<MarketDataSubscription>} list of market data subscriptions for the symbol
   */
  subscriptions(symbol) {
    return this._metaApiConnection.subscriptions(symbol);
  }

  /**
   * Sends client uptime stats to the server.
   * @param {Object} uptime uptime statistics to send to the server
   * @returns {Promise} promise which resolves when uptime statistics is submitted
   */
  saveUptime(uptime) {
    this._checkIsConnectionActive();
    return this._websocketClient.saveUptime(this._metaApiConnection.account.id, uptime);
  }

  /**
   * Returns local copy of terminal state
   * @returns {TerminalState} local copy of terminal state
   */
  get terminalState() {
    return this._metaApiConnection.terminalState;
  }

  /**
   * Returns local history storage
   * @returns {HistoryStorage} local history storage
   */
  get historyStorage() {
    return this._metaApiConnection.historyStorage;
  }

  /**
   * Adds synchronization listener
   * @param {SynchronizationListener} listener synchronization listener to add
   */
  addSynchronizationListener(listener) {
    this._synchronizationListeners.push(listener);
    this._websocketClient.addSynchronizationListener(this._metaApiConnection.account.id, listener);
  }

  /**
   * Removes synchronization listener for specific account
   * @param {SynchronizationListener} listener synchronization listener to remove
   */
  removeSynchronizationListener(listener) {
    this._synchronizationListeners = this._synchronizationListeners.filter(l => l !== listener);
    this._websocketClient.removeSynchronizationListener(this._metaApiConnection.account.id, listener);
  }

  /**
   * @typedef {Object} SynchronizationOptions
   * @property {String} [applicationPattern] application regular expression pattern, default is .*
   * @property {String} [synchronizationId] synchronization id, last synchronization request id will be used by
   * default
   * @property {Number} [instanceIndex] index of an account instance to ensure synchronization on, default is to wait
   * for the first instance to synchronize
   * @property {Number} [timeoutInSeconds] wait timeout in seconds, default is 5m
   * @property {Number} [intervalInMilliseconds] interval between account reloads while waiting for a change, default is 1s
   */

  /**
   * Waits until synchronization to MetaTrader terminal is completed
   * @param {SynchronizationOptions} opts synchronization options
   * @return {Promise} promise which resolves when synchronization to MetaTrader terminal is completed
   * @throws {TimeoutError} if application failed to synchronize with the teminal within timeout allowed
   */
  // eslint-disable-next-line complexity
  async waitSynchronized(opts) {
    this._checkIsConnectionActive();
    return this._metaApiConnection.waitSynchronized(opts);
  }

  /**
   * Closes the connection. The instance of the class should no longer be used after this method is invoked.
   */
  async close() {
    if(!this._closed){
      for (let listener of this._synchronizationListeners) {
        this._websocketClient.removeSynchronizationListener(this._metaApiConnection.account.id, listener);
      }
      this._closed = true;
      await this._metaApiConnection.close(this.instanceId);
    }
  }

  /**
   * Returns synchronization status
   * @return {boolean} synchronization status
   */
  get synchronized() {
    return this._metaApiConnection.synchronized;
  }

  /**
   * Returns MetaApi account
   * @return {MetatraderAccount} MetaApi account
   */
  get account() {
    return this._metaApiConnection.account;
  }

  /**
   * Returns connection health monitor instance
   * @return {ConnectionHealthMonitor} connection health monitor instance
   */
  get healthMonitor() {
    return this._metaApiConnection.healthMonitor;
  }

}
