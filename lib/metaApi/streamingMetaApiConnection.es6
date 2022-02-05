'use strict';

import TerminalState from './terminalState';
import MemoryHistoryStorage from './memoryHistoryStorage';
import TimeoutError from '../clients/timeoutError';
import randomstring from 'randomstring';
import ConnectionHealthMonitor from './connectionHealthMonitor';
import {ValidationError} from '../clients/errorHandler';
import OptionsValidator from '../clients/optionsValidator';
import LoggerManager from '../logger';
import MetaApiConnection from './metaApiConnection';

/**
 * Exposes MetaApi MetaTrader streaming API connection to consumers
 */
export default class StreamingMetaApiConnection extends MetaApiConnection {

  /**
   * Constructs MetaApi MetaTrader streaming Api connection
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {ClientApiClient} clientApiClient client api client
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {HistoryStorage} historyStorage terminal history storage. By default an instance of MemoryHistoryStorage
   * will be used.
   * @param {ConnectionRegistry} connectionRegistry metatrader account connection registry
   * @param {Date} [historyStartTime] history start sync time
   * @param {RefreshSubscriptionsOpts} [refreshSubscriptionsOpts] subscriptions refresh options
   */
  constructor(websocketClient, clientApiClient, account, historyStorage, connectionRegistry, historyStartTime,
    refreshSubscriptionsOpts) {
    super(websocketClient, account);
    refreshSubscriptionsOpts = refreshSubscriptionsOpts || {};
    const validator = new OptionsValidator();
    this._minSubscriptionRefreshInterval = validator.validateNonZero(refreshSubscriptionsOpts.minDelayInSeconds, 1,
      'refreshSubscriptionsOpts.minDelayInSeconds');
    this._maxSubscriptionRefreshInterval = validator.validateNonZero(refreshSubscriptionsOpts.maxDelayInSeconds, 600,
      'refreshSubscriptionsOpts.maxDelayInSeconds');
    this._connectionRegistry = connectionRegistry;
    this._historyStartTime = historyStartTime;
    this._terminalState = new TerminalState(clientApiClient);
    this._historyStorage = historyStorage || new MemoryHistoryStorage();
    this._healthMonitor = new ConnectionHealthMonitor(this);
    this._websocketClient.addSynchronizationListener(account.id, this);
    this._websocketClient.addSynchronizationListener(account.id, this._terminalState);
    this._websocketClient.addSynchronizationListener(account.id, this._historyStorage);
    this._websocketClient.addSynchronizationListener(account.id, this._healthMonitor);
    this._websocketClient.addReconnectListener(this, account.id);
    this._subscriptions = {};
    this._stateByInstanceIndex = {};
    this._refreshMarketDataSubscriptionSessions = {};
    this._refreshMarketDataSubscriptionTimeouts = {};
    this._synchronized = false;
    this._synchronizationListeners = [];
    this._logger = LoggerManager.getLogger('MetaApiConnection');
  }

  /**
   * Opens the connection. Can only be called the first time, next calls will be ignored.
   * @return {Promise} promise resolving when the connection is opened
   */
  async connect() {
    if (!this._opened) {
      this._opened = true;
      try {
        await this.initialize();
        await this.subscribe();
      } catch (err) {
        await this.close();
        throw err;
      }
    }
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
      startingHistoryOrderTime, startingDealTime,
      async () => await this.terminalState.getHashes(this._account.type, instanceIndex));
  }

  /**
   * Initializes meta api connection
   * @return {Promise} promise which resolves when meta api connection is initialized
   */
  async initialize() {
    await this._historyStorage.initialize(this._account.id, this._connectionRegistry.application);
    this._websocketClient.addAccountRegion(this._account.id, this._account.region);
  }

  /**
   * Initiates subscription to MetaTrader terminal
   * @returns {Promise} promise which resolves when subscription is initiated
   */
  async subscribe() {
    if(!this._closed) {
      this._websocketClient.ensureSubscribe(this._account.id, 0);
      this._websocketClient.ensureSubscribe(this._account.id, 1);
    }
  }

  /**
   * Subscribes on market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/subscribeToMarketData/).
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataSubscription>} subscriptions array of market data subscription to create or update. Please
   * note that this feature is not fully implemented on server-side yet
   * @param {Number} instanceIndex instance index
   * @param {number} [timeoutInSeconds] timeout to wait for prices in seconds, default is 30
   * @returns {Promise} promise which resolves when subscription request was processed
   */
  async subscribeToMarketData(symbol, subscriptions, instanceIndex, timeoutInSeconds) {
    if(!this._terminalState.specification(symbol)){
      throw new ValidationError(`Cannot subscribe to market data for symbol ${symbol} because ` +
      'symbol does not exist');
    } else {
      subscriptions = subscriptions || [{type: 'quotes'}];
      if(this._subscriptions[symbol]) {
        const prevSubscriptions = this._subscriptions[symbol].subscriptions;
        subscriptions.forEach(subscription => {
          const index = subscription.type === 'candles' ? 
            prevSubscriptions.findIndex(item => item.type === subscription.type && 
            item.timeframe === subscription.timeframe) :
            prevSubscriptions.findIndex(item => item.type === subscription.type);
          if(index === -1){
            prevSubscriptions.push(subscription);
          } else {
            prevSubscriptions[index] = subscription;
          }
        });
      } else {
        this._subscriptions[symbol] = {subscriptions};
      }
      await this._websocketClient.subscribeToMarketData(this._account.id, instanceIndex, symbol, subscriptions);
      return this.terminalState.waitForPrice(symbol, timeoutInSeconds);
    }
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
        .filter(s => s.type === 'candles' ? 
          !subscriptions.find(s2 => s.type === s2.type && s.timeframe === s2.timeframe) : 
          !subscriptions.find(s2 => s.type === s2.type));
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
      this.unsubscribeFromMarketData(symbol, unsubscriptions)
        .catch(err => {
          if (err.name !== ValidationError) {
            this._logger.error(`${this._account.id}: failed do unsubscribe from market data on subscription downgraded`,
              err);
          } else {
            this._logger.trace(`${this._account.id}: failed do unsubscribe from market data on subscription downgraded`,
              err);
          }
        });
    }
    if (updates && updates.length) {
      if (subscriptions) {
        for (let subscription of updates) {
          subscriptions.filter(s => s.type === subscription.type)
            .forEach(s => s.intervalInMilliiseconds = subscription.intervalInMilliseconds);
        }
      }
      this.subscribeToMarketData(symbol, updates)
        .catch(err => {
          this._logger.error(`${this._account.id}: failed do unsubscribe from market data on subscription downgraded`,
            err);
        });
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
    const instance = this.getInstanceNumber(instanceIndex);
    delete this._refreshMarketDataSubscriptionSessions[instance];
    clearTimeout(this._refreshMarketDataSubscriptionTimeouts[instance]);
    delete this._refreshMarketDataSubscriptionTimeouts[instance];
  }

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealsSynchronized(instanceIndex, synchronizationId) {
    let state = this._getState(instanceIndex);
    state.dealsSynchronized[synchronizationId] = true;
  }

  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHistoryOrdersSynchronized(instanceIndex, synchronizationId) {
    let state = this._getState(instanceIndex);
    state.ordersSynchronized[synchronizationId] = true;
  }

  /**
   * Invoked when connection to MetaApi websocket API restored after a disconnect
   * @return {Promise} promise which resolves when connection to MetaApi websocket API restored after a disconnect
   */
  async onReconnected() {
    this._stateByInstanceIndex = {};
    this._refreshMarketDataSubscriptionSessions = {};
    Object.values(this._refreshMarketDataSubscriptionTimeouts).forEach(timeout => clearTimeout(timeout));
    this._refreshMarketDataSubscriptionTimeouts = {};
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
   * Invoked when MetaTrader terminal state synchronization is started
   * @param {String} instanceIndex index of an account instance connected
   * @param {Boolean} specificationsUpdated whether specifications are going to be updated during synchronization
   * @param {Boolean} positionsUpdated whether positions are going to be updated during synchronization
   * @param {Boolean} ordersUpdated whether orders are going to be updated during synchronization
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSynchronizationStarted(instanceIndex, specificationsUpdated, positionsUpdated, ordersUpdated) {
    const instance = this.getInstanceNumber(instanceIndex);
    delete this._refreshMarketDataSubscriptionSessions[instance];
    let sessionId = randomstring.generate(32);
    this._refreshMarketDataSubscriptionSessions[instance] = sessionId;
    clearTimeout(this._refreshMarketDataSubscriptionTimeouts[instance]);
    delete this._refreshMarketDataSubscriptionTimeouts[instance];
    await this._refreshMarketDataSubscriptions(instance, sessionId);
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
    if (!this._closed) {
      this._logger.debug(`${this._account.id}: Closing connection`);
      this._stateByInstanceIndex = {};
      this._connectionRegistry.remove(this._account.id);
      await this._websocketClient.unsubscribe(this._account.id);
      this._websocketClient.removeSynchronizationListener(this._account.id, this);
      this._websocketClient.removeSynchronizationListener(this._account.id, this._terminalState);
      this._websocketClient.removeSynchronizationListener(this._account.id, this._historyStorage);
      this._websocketClient.removeSynchronizationListener(this._account.id, this._healthMonitor);
      for (let listener of this._synchronizationListeners) {
        this._websocketClient.removeSynchronizationListener(this._account.id, listener);
      }
      this._synchronizationListeners = [];
      this._websocketClient.removeReconnectListener(this);
      this._healthMonitor.stop();
      this._refreshMarketDataSubscriptionSessions = {};
      Object.values(this._refreshMarketDataSubscriptionTimeouts).forEach(timeout => clearTimeout(timeout));
      this._refreshMarketDataSubscriptionTimeouts = {};
      this._websocketClient.removeAccountRegion(this.account.id);
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

  async _refreshMarketDataSubscriptions(instanceNumber, session) {
    try {
      if (this._refreshMarketDataSubscriptionSessions[instanceNumber] === session) {
        const subscriptionsList = [];
        Object.keys(this._subscriptions).forEach(key => {
          const subscriptions = this.subscriptions(key);
          const subscriptionsItem = {symbol: key};
          if(subscriptions) {
            subscriptionsItem.subscriptions = subscriptions;
          }
          subscriptionsList.push(subscriptionsItem);
        });
        await this._websocketClient.refreshMarketDataSubscriptions(this._account.id, instanceNumber,
          subscriptionsList);
      }
    } catch (err) {
      this._logger.error(`Error refreshing market data subscriptions job for account ${this._account.id} ` +
      `${instanceNumber}`, err);
    } finally {
      if (this._refreshMarketDataSubscriptionSessions[instanceNumber] === session) {
        let refreshInterval = (Math.random() * (this._maxSubscriptionRefreshInterval - 
          this._minSubscriptionRefreshInterval) + this._minSubscriptionRefreshInterval) * 1000;
        this._refreshMarketDataSubscriptionTimeouts[instanceNumber] = setTimeout(() =>
          this._refreshMarketDataSubscriptions(instanceNumber, session), refreshInterval);
      }
    }
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
        this._logger.error('MetaApi websocket client for account ' + this._account.id +
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
