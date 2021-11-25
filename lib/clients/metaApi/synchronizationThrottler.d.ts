import MetaApiWebsocketClient from "./metaApiWebsocket.client";

/**
 * Synchronization throttler used to limit the amount of concurrent synchronizations to prevent application
 * from being overloaded due to excessive number of synchronisation responses being sent.
 */
export default class SynchronizationThrottler {
  
  /**
   * Constructs the synchronization throttler
   * @param {MetaApiWebsocketClient} client MetaApi websocket client
   * @param {Number} socketInstanceIndex index of socket instance that uses the throttler
   * @param {SynchronizationThrottlerOpts} opts synchronization throttler options
   */
  constructor(client: MetaApiWebsocketClient, socketInstanceIndex: Number, opts: SynchronizationThrottlerOpts);
  
  /**
   * Initializes the synchronization throttler
   */
  start();
  
  /**
   * Deinitializes the throttler
   */
  stop();
  
  /**
   * Fills a synchronization slot with synchronization id
   * @param {String} synchronizationId synchronization id
   */
  updateSynchronizationId(synchronizationId: String);
  
  /**
   * Returns the list of currently synchronizing account ids
   */
  get synchronizingAccounts(): String[];
  
  /**
   * Returns the list of currenly active synchronization ids
   * @return {String[]} synchronization ids
   */
  get activeSynchronizationIds(): String[];
  
  /**
   * Returns the amount of maximum allowed concurrent synchronizations
   * @return {number} maximum allowed concurrent synchronizations
   */
  get maxConcurrentSynchronizations(): Number;
  
  /**
   * Returns flag whether there are free slots for synchronization requests
   * @return {Boolean} flag whether there are free slots for synchronization requests
   */
  get isSynchronizationAvailable(): Boolean;
  
  /**
   * Removes synchronizations from queue and from the list by parameters
   * @param {String} accountId account id
   * @param {Number} instanceIndex account instance index
   * @param {String} host account host name
   */
  removeIdByParameters(accountId: String, instanceIndex: Number, host: String);
  
  /**
   * Removes synchronization id from slots and removes ids for the same account from the queue
   * @param {String} synchronizationId synchronization id
   */
  removeSynchronizationId(synchronizationId: String);
  
  /**
   * Clears synchronization ids on disconnect
   */
  onDisconnect();
  
  /**
   * Schedules to send a synchronization request for account
   * @param {String} accountId account id
   * @param {Object} request request to send
   */
  scheduleSynchronize(accountId: String, request: Object);
}

/**
 * Options for synchronization throttler
 */
declare type SynchronizationThrottlerOpts = {

  /**
   * amount of maximum allowed concurrent synchronizations
   */
  maxConcurrentSynchronizations?: Number,

  /**
   * allowed time for a synchronization in queue
   */
  queueTimeoutInSeconds?: Number,

  /**
   * time after which a synchronization slot
   * is freed to be used by another synchronization
   */
  synchronizationTimeoutInSeconds?: Number
}