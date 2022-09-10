'use strict';

import SynchronizationListener from '../clients/metaApi/synchronizationListener';
import LoggerManager from '../logger';

/**
 * Exposes MetaApi MetaTrader API connection to consumers
 */
export default class MetaApiConnection extends SynchronizationListener {

  /**
   * Constructs MetaApi MetaTrader Api connection
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {String} [application] application to use
   */
  constructor(websocketClient, account, application) {
    super();
    this._websocketClient = websocketClient;
    this._account = account;
    this._logger = LoggerManager.getLogger('MetaApiConnection');
    this._application = application;
  }

  /**
   * Opens the connection. Can only be called the first time, next calls will be ignored.
   * @param {string} instanceId connection instance id
   * @return {Promise} promise resolving when the connection is opened
   */
  async connect(instanceId) {}

  /**
   * Closes the connection. The instance of the class should no longer be used after this method is invoked.
   * @param {string} instanceId connection instance id
   */
  async close(instanceId) {}

  /**
   * Returns MetaApi account
   * @return {MetatraderAccount} MetaApi account
   */
  get account() {
    return this._account;
  }

  /**
   * Returns connection application
   * @return {String} connection application
   */
  get application() {
    return this._application;
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

  _checkIsConnectionActive() {
    if(!this._opened) {
      throw new Error('This connection has not been initialized yet, please invoke await connection.connect()');
    }
    if(this._closed) {
      throw new Error('This connection has been closed, please create a new connection');
    }
  }

}
