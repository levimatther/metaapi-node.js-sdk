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
    this._fileManager.startUpdateJob();
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
   * Resets the storage. Intended for use in tests
   */
  reset() {
    this._deals = [];
    this._historyOrders = [];
    this._fileManager.deleteStorageFromDisk();
  }

  /**
   * Loads history data from the file manager
   * @return {Promise} promise which resolves when the history is loaded
   */
  async loadDataFromDisk() {
    const history = await this._fileManager.getHistoryFromDisk();
    this._deals = history.deals;
    this._historyOrders = history.historyOrders;
  }

  /**
   * Saves unsaved history items to disk storage
   */
  async updateDiskStorage() {
    await this._fileManager.updateDiskStorage();
  }

  /**
   * Returns the time of the last history order record stored in the history storage
   * @returns {Date} the time of the last history order record stored in the history storage
   */
  lastHistoryOrderTime() {
    return new Date(this._historyOrders.reduce((max, o) => Math.max(max, (o.doneTime || new Date(0)).getTime()), 0));
  }

  /**
   * Returns the time of the last history deal record stored in the history storage
   * @returns {Date} the time of the last history deal record stored in the history storage
   */
  lastDealTime() {
    return new Date(this._deals.reduce((max, d) => Math.max(max, (d.time || new Date(0)).getTime()), 0));
  }

  /**
   * Invoked when a new MetaTrader history order is added
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   */
  // eslint-disable-next-line complexity
  onHistoryOrderAdded(historyOrder) {
    let insertIndex = 0;
    let replacementIndex = -1;
    const newHistoryOrderTime = (historyOrder.doneTime || new Date(0)).getTime();
    for(let i = this._historyOrders.length - 1; i >= 0; i--) {
      const order = this._historyOrders[i];
      const historyOrderTime = (order.doneTime || new Date(0)).getTime();
      if (historyOrderTime < newHistoryOrderTime || (historyOrderTime === newHistoryOrderTime &&
          order.id <= historyOrder.id)) {
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
   * @param {MetatraderDeal} deal new MetaTrader history deal
   */
  // eslint-disable-next-line complexity
  onDealAdded(deal) {
    let insertIndex = 0;
    let replacementIndex = -1;
    const newDealTime = (deal.time || new Date(0)).getTime();
    for(let i = this._deals.length - 1; i >= 0; i--) {
      const d = this._deals[i];
      const dealTime = (d.time || new Date(0)).getTime();
      if ((dealTime < newDealTime) || (dealTime === newDealTime && d.id <= deal.id)) {
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

}
