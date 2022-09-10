'use strict';
import LoggerManager from '../logger';
import MetaApiConnection from './metaApiConnection';
import TimeoutError from '../clients/timeoutError';

/**
 * Exposes MetaApi MetaTrader RPC API connection to consumers
 */
export default class RpcMetaApiConnection extends MetaApiConnection {

  /**
   * Constructs MetaApi MetaTrader RPC Api connection
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {ConnectionRegistry} connectionRegistry metatrader account connection registry
   */
  constructor(websocketClient, account, connectionRegistry) {
    super(websocketClient, account, 'RPC');
    this._connectionRegistry = connectionRegistry;
    this._websocketClient.addSynchronizationListener(account.id, this);
    this._stateByInstanceIndex = {};
    this._openedInstances = [];
    this._logger = LoggerManager.getLogger('MetaApiConnection');
  }

  /**
   * Opens the connection. Can only be called the first time, next calls will be ignored.
   * @param {string} instanceId connection instance id
   * @return {Promise} promise resolving when the connection is opened
   */
  async connect(instanceId) {
    if(!this._openedInstances.includes(instanceId)) {
      this._openedInstances.push(instanceId);
    }
    if (!this._opened) {
      this._opened = true;
      const accountRegions = this._account.accountRegions;
      this._websocketClient.addAccountCache(this._account.id, accountRegions);
      Object.keys(accountRegions).forEach(region => {
        this._websocketClient.ensureSubscribe(accountRegions[region], 0);
        this._websocketClient.ensureSubscribe(accountRegions[region], 1);
      });
    }
  }

  /**
   * Closes the connection. The instance of the class should no longer be used after this method is invoked.
   * @param {string} instanceId connection instance id
   */
  async close(instanceId) {
    this._openedInstances = this._openedInstances.filter(id => id !== instanceId);
    if (!Object.keys(this._openedInstances).length && !this._closed) {
      await this._connectionRegistry.removeRpc(this.account);
      this._websocketClient.removeSynchronizationListener(this.account.id, this);
      this._websocketClient.removeAccountCache(this.account.id);
      this._closed = true;
    }
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {String} instanceIndex index of an account instance connected
   * @param {Number} replicas number of account replicas launched
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onConnected(instanceIndex, replicas) {
    const state = this._getState(instanceIndex);
    state.synchronized = true;
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDisconnected(instanceIndex) {
    const state = this._getState(instanceIndex);
    state.synchronized = false;
    this._logger.debug(`${this._account.id}:${instanceIndex}: disconnected from broker`);
  }

  /**
   * Invoked when a stream for an instance index is closed
   * @param {String} instanceIndex index of an account instance connected
   */
  async onStreamClosed(instanceIndex) {
    delete this._stateByInstanceIndex[instanceIndex];
  }

  /**
   * Returns flag indicating status of state synchronization with MetaTrader terminal
   * @returns {Boolean} a flag indicating status of state synchronization with MetaTrader terminal
   */
  isSynchronized() {
    return Object.values(this._stateByInstanceIndex)
      .map(instance => instance.synchronized)
      .includes(true);
  }

  /**
   * Waits until synchronization to RPC application is completed
   * @param {Number} timeoutInSeconds synchronization timeout in seconds
   * @return {Promise} promise which resolves when synchronization to RPC application is completed
   * @throws {TimeoutError} if application failed to synchronize with the teminal within timeout allowed
   */
  async waitSynchronized(timeoutInSeconds=300) {
    this._checkIsConnectionActive();
    const startTime = Date.now();
    let synchronized = this.isSynchronized();
    while(!synchronized && startTime + timeoutInSeconds * 1000 > Date.now()) {
      await new Promise(res => setTimeout(res, 1000));
      synchronized = this.isSynchronized();
    }
    if (!synchronized) {
      throw new TimeoutError('Timed out waiting for MetaApi to synchronize to MetaTrader account ' +
        this._account.id);
    }
    // eslint-disable-next-line
    while(true) {
      try {
        await this._websocketClient.waitSynchronized(this._account.id, undefined, 'RPC', 5, 'RPC');
        break;
      } catch (err) {
        if(Date.now() > startTime + timeoutInSeconds * 1000) {
          throw err;
        }
      }
    }
  }

  _getState(instanceIndex) {
    if(!this._stateByInstanceIndex[instanceIndex]) {
      this._stateByInstanceIndex[instanceIndex] = {
        instanceIndex,
        synchronized: false,
      };
    }
    return this._stateByInstanceIndex[instanceIndex];
  }

}
