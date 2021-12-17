import { MetatraderOrder, MetatraderDeal } from "../clients/metaApi/metaApiWebsocket.client";
import SynchronizationListener from "../clients/metaApi/synchronizationListener";

/**
 * Abstract class which defines MetaTrader history storage interface.
 */
export default class HistoryStorage extends SynchronizationListener {
  
  /**
   * Constructs the history storage
   */
  constructor();
  
  /**
   * Initializes the storage and loads required data from a persistent storage
   */
  initialize(): Promise<any>;
  
  /**
   * Returns flag indicating whether order history synchronization have finished
   * @return {boolean} flag indicating whether order history synchronization have finished
   */
  get orderSynchronizationFinished(): boolean;
  
  /**
   * Returns flag indicating whether deal history synchronization have finished
   * @return {boolean} flag indicating whether deal history synchronization have finished
   */
  get dealSynchronizationFinished(): boolean;
  
  /**
   * Clears the storage and deletes persistent data
   */
  clear(): Promise<any>;
  
  /**
   * Returns the time of the last history order record stored in the history storage
   * @param {number} [instanceIndex] index of an account instance connected
   * @returns {Promise<Date>} the time of the last history order record stored in the history storage
   */
  lastHistoryOrderTime(instanceIndex?: number): Promise<Date>;
  
  /**
   * Returns the time of the last history deal record stored in the history storage
   * @param {number} [instanceIndex] index of an account instance connected
   * @returns {Promise<Date>} the time of the last history deal record stored in the history storage
   */
  lastDealTime(instanceIndex?: number): Promise<Date>;
  
  /**
   * Invoked when a new MetaTrader history order is added
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHistoryOrderAdded(instanceIndex: string, historyOrder: MetatraderOrder): Promise<any>;
  
  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderDeal} deal new MetaTrader history deal
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDealAdded(instanceIndex: string, deal: MetatraderDeal): Promise<any>;
  
  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDealsSynchronized(instanceIndex: string, synchronizationId: string): Promise<any>;
  
  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHistoryOrdersSynchronized(instanceIndex: string, synchronizationId: string): Promise<any>;
  
  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {string} instanceIndex index of an account instance connected
   */
  onConnected(instanceIndex: string): Promise<any>;
}