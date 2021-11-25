import { MetatraderDeal, MetatraderOrder } from "../clients/metaApi/metaApiWebsocket.client";
import HistoryStorage from "./historyStorage";

/**
 * History storage which stores MetaTrader history in RAM
 */
export default class MemoryHistoryStorage extends HistoryStorage {

  /**
   * Constructs the in-memory history store instance
   */
  constructor(accountId: String, application?: String);

  /**
   * Initializes the storage and loads required data from a persistent storage
   */
  initialize();

  /**
   * Returns all deals stored in history storage
   * @return {Array<MetatraderDeal>} all deals stored in history storage
   */
  get deals(): Array<MetatraderDeal>;

  /**
   * Returns all history orders stored in history storage
   * @return {Array<MetatraderOrder>} all history orders stored in history storage
   */
  get historyOrders(): Array<MetatraderOrder>

  /**
   * Returns times of last deals by instance indices
   * @return {Object} dictionary of last deal times by instance indices
   */
  get lastDealTimeByInstanceIndex(): Object;

  /**
   * Returns times of last history orders by instance indices
   * @return {Object} dictionary of last history orders times by instance indices
   */
  get lastHistoryOrderTimeByInstanceIndex(): Object;

  /**
   * Resets the storage. Intended for use in tests
   */
  clear();

  /**
   * Loads history data from the file manager
   * @return {Promise} promise which resolves when the history is loaded
   */
  loadDataFromDisk(): Promise<any>;

  /**
   * Saves unsaved history items to disk storage
   */
  updateDiskStorage();

  /**
   * Returns the time of the last history order record stored in the history storage
   * @param {Number} [instanceNumber] index of an account instance connected
   * @returns {Date} the time of the last history order record stored in the history storage
   */
  lastHistoryOrderTime(instanceNumber?: Number): Date; 

  /**
   * Returns the time of the last history deal record stored in the history storage
   * @param {Number} [instanceNumber] index of an account instance connected
   * @returns {Date} the time of the last history deal record stored in the history storage
   */
  lastDealTime(instanceNumber: Number): Date;

  /**
   * Invoked when a new MetaTrader history order is added
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   */
  onHistoryOrderAdded(instanceIndex: String, historyOrder: MetatraderOrder);

  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderDeal} deal new MetaTrader history deal
   */
  onDealAdded(instanceIndex: String, deal: MetatraderDeal);

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDealsSynchronized(instanceIndex: String, synchronizationId: String): Promise<any>
}