'use strict';

/**
 * Options for synchronization throttler
 * @typedef {Object} SynchronizationThrottlerOpts
 * @property {Number} [maxConcurrentSynchronizations] amount of maximum allowed concurrent synchronizations
 * @property {Number} [queueTimeoutInSeconds] allowed time for a synchronization in queue
 * @property {Number} [synchronizationTimeoutInSeconds] time after which a synchronization slot
 * is freed to be used by another synchronization
 */

/**
 * Synchronization throttler used to limit the amount of concurrent synchronizations to prevent application
 * from being overloaded due to excessive number of synchronisation responses being sent.
 */
export default class SynchronizationThrottler {

  /**
   * Constructs the synchronization throttler
   * @param {MetaApiWebsocketClient} client MetaApi websocket client
   * @param {SynchronizationThrottlerOpts} opts synchronization throttler options
   */
  constructor(client, opts) {
    opts = opts || {};
    this._maxConcurrentSynchronizations = opts.maxConcurrentSynchronizations || 10;
    this._queueTimeoutInSeconds = opts.queueTimeoutInSeconds || 300;
    this._synchronizationTimeoutInSeconds = opts.synchronizationTimeoutInSeconds || 10;
    this._client = client;
    this._synchronizationIds = {};
    this._accountsBySynchronizationIds = {};
    this._synchronizationQueue = [];
    this._removeOldSyncIdsInterval = null;
    this._processQueueInterval = null;
    this._isProcessingQueue = false;
  }

  /**
   * Initializes the synchronization throttler
   */
  start() {
    if(!this._removeOldSyncIdsInterval) {
      this._removeOldSyncIdsInterval = setInterval(() => this._removeOldSyncIdsJob(), 1000);
      this._processQueueInterval = setInterval(() => this._processQueueJob(), 1000);
    }
  }

  /**
   * Deinitializes the throttler
   */
  stop() {
    clearInterval(this._removeOldSyncIdsInterval);
    this._removeOldSyncIdsInterval = null;
    clearInterval(this._processQueueInterval);
    this._processQueueInterval = null;
  }

  async _removeOldSyncIdsJob() {
    const now = Date.now();
    for (let key of Object.keys(this._synchronizationIds)) {
      if ((now - this._synchronizationIds[key]) > this._synchronizationTimeoutInSeconds * 1000) {
        delete this._synchronizationIds[key];
        this._advanceQueue();
      }
    }
    while (this._synchronizationQueue.length && (Date.now() - this._synchronizationQueue[0].queueTime) > 
        this._queueTimeoutInSeconds * 1000) {
      this._removeFromQueue(this._synchronizationQueue[0].synchronizationId);
    }
  }

  /**
   * Fills a synchronization slot with synchronization id
   * @param {String} synchronizationId synchronization id
   */
  updateSynchronizationId(synchronizationId) {
    if(this._accountsBySynchronizationIds[synchronizationId]) {
      this._synchronizationIds[synchronizationId] = Date.now();
    }
  }

  /**
   * Returns the list of currenly active synchronization ids
   * @return {String[]} synchronization ids
   */
  get activeSynchronizationIds() {
    return Object.keys(this._accountsBySynchronizationIds);
  }

  /**
   * Returns flag whether there are free slots for synchronization requests
   * @return {Boolean} flag whether there are free slots for synchronization requests
   */
  get isSynchronizationAvailable() {
    const synchronizingAccounts = [];
    Object.keys(this._synchronizationIds).forEach(synchronizationId => {
      const accountData = this._accountsBySynchronizationIds[synchronizationId];
      if(accountData && (!synchronizingAccounts.includes(accountData.accountId))) {
        synchronizingAccounts.push(accountData.accountId);
      }
    });
    return synchronizingAccounts.length < this._maxConcurrentSynchronizations;
  }

  /**
   * Removes synchronization id from slots and removes ids for the same account from the queue
   * @param {String} synchronizationId synchronization id
   */
  removeSynchronizationId(synchronizationId) {
    if (this._accountsBySynchronizationIds[synchronizationId]) {
      const accountId = this._accountsBySynchronizationIds[synchronizationId].accountId;
      const instanceIndex = this._accountsBySynchronizationIds[synchronizationId].instanceIndex;
      for (let key of Object.keys(this._accountsBySynchronizationIds)) {
        if(this._accountsBySynchronizationIds[key].accountId === accountId && 
          instanceIndex === this._accountsBySynchronizationIds[key].instanceIndex) {
          this._removeFromQueue(key);
          delete this._accountsBySynchronizationIds[key];
        }
      }
    }
    if(this._synchronizationIds[synchronizationId]) {
      delete this._synchronizationIds[synchronizationId];
    }
    this._advanceQueue();
  }

  /**
   * Clears synchronization ids on disconnect
   */
  onDisconnect() {
    this._synchronizationIds = {};
    this._advanceQueue();
  }


  _advanceQueue() {
    if (this.isSynchronizationAvailable && this._synchronizationQueue.length) {
      this._synchronizationQueue[0].resolve(true);
    }
  }

  _removeFromQueue(synchronizationId) {
    this._synchronizationQueue.forEach((item, i) => {
      if(this._synchronizationQueue[i].synchronizationId === synchronizationId) {
        this._synchronizationQueue[i].resolve(false);
      }
    });
    this._synchronizationQueue = this._synchronizationQueue.filter(item => 
      item.synchronizationId !== synchronizationId);
  }

  async _processQueueJob() {
    if(!this._isProcessingQueue) {
      this._isProcessingQueue = true;
      try {
        while (this._synchronizationQueue.length && 
          (Object.values(this._synchronizationIds).length < this._maxConcurrentSynchronizations)) {
          await this._synchronizationQueue[0].promise;
          this._synchronizationQueue.shift();
        }
      } catch (err) {
        console.log('[' + (new Date()).toISOString() + '] Error processing queue job', err);
      }
      this._isProcessingQueue = false;
    }
  }

  /**
   * Schedules to send a synchronization request for account
   * @param {String} accountId account id
   * @param {Object} request request to send
   */
  async scheduleSynchronize(accountId, request) {
    const synchronizationId = request.requestId;
    for (let key of Object.keys(this._accountsBySynchronizationIds)) {
      if(this._accountsBySynchronizationIds[key].accountId === accountId &&
        this._accountsBySynchronizationIds[key].instanceIndex === request.instanceIndex) {
        this.removeSynchronizationId(key);
      }
    }
    this._accountsBySynchronizationIds[synchronizationId] = {accountId, instanceIndex: request.instanceIndex};
    if(!this.isSynchronizationAvailable) {
      let resolve;
      let requestResolve = new Promise((res) => {
        resolve = res;
      });
      this._synchronizationQueue.push({
        synchronizationId: synchronizationId,
        promise: requestResolve,
        resolve,
        queueTime: Date.now()
      });
      const result = await requestResolve;
      if(!result) {
        return null;
      }
    }
    this.updateSynchronizationId(synchronizationId);
    return await this._client._rpcRequest(accountId, request);
  }

}