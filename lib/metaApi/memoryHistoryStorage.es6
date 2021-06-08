'use strict';

import HistoryStorage from './historyStorage';
import HistoryFileManager from './historyFileManager/index';

/**
 * History storage which stores MetaTrader history in RAM
 */
export default class MemoryHistoryStorage extends HistoryStorage {

  /**
   * Constructs the in-memory history store instance
   */
  constructor(accountId, application = 'MetaApi') {
    super();
    this._accountId = accountId;
    this._fileManager = new HistoryFileManager(accountId, application, this);
    this._deals = [];
    this._historyOrders = [];
    this._lastDealTimeByInstanceIndex = {};
    this._lastHistoryOrderTimeByInstanceIndex = {};
    this._fileManager.startUpdateJob();
  }

  /**
   * Initializes the storage and loads required data from a persistent storage
   */
  async initialize() {
    await this.loadDataFromDisk();
  }

  /**
   * Returns all deals stored in history storage
   * @return {Array<MetatraderDeal>} all deals stored in history storage
   */
  get deals() {
    return this._deals;
  }

  /**
   * Returns all history orders stored in history storage
   * @return {Array<MetatraderOrder>} all history orders stored in history storage
   */
  get historyOrders() {
    return this._historyOrders;
  }

  /**
   * Returns times of last deals by instance indices
   * @return {Object} dictionary of last deal times by instance indices
   */
  get lastDealTimeByInstanceIndex() {
    return this._lastDealTimeByInstanceIndex;
  }

  /**
   * Returns times of last history orders by instance indices
   * @return {Object} dictionary of last history orders times by instance indices
   */
  get lastHistoryOrderTimeByInstanceIndex() {
    return this._lastHistoryOrderTimeByInstanceIndex;
  }

  /**
   * Resets the storage. Intended for use in tests
   */
  async clear() {
    this._deals = [];
    this._historyOrders = [];
    this._lastDealTimeByInstanceIndex = {};
    this._lastHistoryOrderTimeByInstanceIndex = {};
    await this._fileManager.deleteStorageFromDisk();
  }

  /**
   * Loads history data from the file manager
   * @return {Promise} promise which resolves when the history is loaded
   */
  async loadDataFromDisk() {
    const history = await this._fileManager.getHistoryFromDisk();
    this._deals = history.deals;
    this._historyOrders = history.historyOrders;
    this._lastDealTimeByInstanceIndex = history.lastDealTimeByInstanceIndex || {};
    this._lastHistoryOrderTimeByInstanceIndex = history.lastHistoryOrderTimeByInstanceIndex || {};
  }

  /**
   * Saves unsaved history items to disk storage
   */
  async updateDiskStorage() {
    await this._fileManager.updateDiskStorage();
  }

  /**
   * Returns the time of the last history order record stored in the history storage
   * @param {Number} [instanceNumber] index of an account instance connected
   * @returns {Date} the time of the last history order record stored in the history storage
   */
  lastHistoryOrderTime(instanceNumber) {
    if (instanceNumber !== undefined) {
      return new Date(this._lastHistoryOrderTimeByInstanceIndex['' + instanceNumber] || 0);
    } else {
      return new Date(Object.values(this._lastHistoryOrderTimeByInstanceIndex)
        .reduce((acc, time) => time > acc ? time : acc, 0));
    }
  }

  /**
   * Returns the time of the last history deal record stored in the history storage
   * @param {Number} [instanceNumber] index of an account instance connected
   * @returns {Date} the time of the last history deal record stored in the history storage
   */
  lastDealTime(instanceNumber) {
    if (instanceNumber !== undefined) {
      return new Date(this._lastDealTimeByInstanceIndex['' + instanceNumber] || 0);
    } else {
      return new Date(Object.values(this._lastDealTimeByInstanceIndex).reduce((acc, time) => time > acc ? time : acc,
        0));
    }
  }

  /**
   * Invoked when a new MetaTrader history order is added
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   */
  // eslint-disable-next-line complexity
  onHistoryOrderAdded(instanceIndex, historyOrder) {
    const instance = this.getInstanceNumber(instanceIndex);
    let insertIndex = 0;
    let replacementIndex = -1;
    const newHistoryOrderTime = (historyOrder.doneTime || new Date(0)).getTime();
    if (!this._lastHistoryOrderTimeByInstanceIndex['' + instance] ||
      this._lastHistoryOrderTimeByInstanceIndex['' + instance] < newHistoryOrderTime) {
      this._lastHistoryOrderTimeByInstanceIndex['' + instance] = newHistoryOrderTime;
    }
    for(let i = this._historyOrders.length - 1; i >= 0; i--) {
      const order = this._historyOrders[i];
      const historyOrderTime = (order.doneTime || new Date(0)).getTime();
      if (historyOrderTime < newHistoryOrderTime ||
        (historyOrderTime === newHistoryOrderTime && order.id <= historyOrder.id)) {
        if (historyOrderTime === newHistoryOrderTime && order.id === historyOrder.id && 
          order.type === historyOrder.type) {
          replacementIndex = i;
        } else {
          insertIndex = i + 1;
        }
        break;
      }
    }
    if (replacementIndex !== -1) {
      this._historyOrders[replacementIndex] = historyOrder;
      this._fileManager.setStartNewOrderIndex(replacementIndex);
    } else {
      this._historyOrders.splice(insertIndex, 0, historyOrder);
      this._fileManager.setStartNewOrderIndex(insertIndex);
    }
  }

  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderDeal} deal new MetaTrader history deal
   */
  // eslint-disable-next-line complexity
  onDealAdded(instanceIndex, deal) {
    const instance = this.getInstanceNumber(instanceIndex);
    let insertIndex = 0;
    let replacementIndex = -1;
    const newDealTime = (deal.time || new Date(0)).getTime();
    if (!this._lastDealTimeByInstanceIndex['' + instance] ||
      this._lastDealTimeByInstanceIndex['' + instance] < newDealTime) {
      this._lastDealTimeByInstanceIndex['' + instance] = newDealTime;
    }
    for(let i = this._deals.length - 1; i >= 0; i--) {
      const d = this._deals[i];
      const dealTime = (d.time || new Date(0)).getTime();
      if ((dealTime < newDealTime) || (dealTime === newDealTime && d.id <= deal.id) ||
        (dealTime === newDealTime && d.id === deal.id && d.entryType <= deal.entryType)) {
        if (dealTime === newDealTime && d.id === deal.id && d.entryType === deal.entryType) {
          replacementIndex = i;
        } else {
          insertIndex = i + 1;
        }
        break;
      }
    }
    if (replacementIndex !== -1) {
      this._deals[replacementIndex] = deal;
      this._fileManager.setStartNewDealIndex(replacementIndex);
    } else {
      this._deals.splice(insertIndex, 0, deal);
      this._fileManager.setStartNewDealIndex(insertIndex);
    }
  }

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished
   * @param {String} instanceIndex index of an account instance connected
   */
  async onDealSynchronizationFinished(instanceIndex, synchronizationId) {
    const instance = this.getInstanceNumber(instanceIndex);
    this._dealSynchronizationFinished[instance] = true;
    await this.updateDiskStorage();
  }

}
