'use strict';

import fs from 'fs-extra';
import { TextEncoder } from 'util';


/**
 * History storage file manager which saves and loads history on disk
 */
export default class HistoryFileManager {

  /**
   * Constructs the history file manager instance
   */
  constructor(accountId, historyStorage) {
    this._accountId = accountId;
    this._historyStorage = historyStorage;
    this._dealsSize = [];
    this._startNewDealIndex = -1;
    this._historyOrdersSize = [];
    this._startNewOrderIndex = -1;
  }

  /**
   * Starts a job to periodically save history on disk
   */
  startUpdateJob() {
    if(!this.updateDiskStorageJob) {
      this.updateDiskStorageJob = setInterval(this.updateDiskStorage.bind(this), 60000); 
    }
  }

  /**
   * Stops a job to periodically save history on disk
   */
  stopUpdateJob() {
    clearInterval(this.updateDiskStorageJob);
    delete this.updateDiskStorageJob;
  }

  /**
   * Helper function to calculate object size in bytes in utf-8 encoding
   * @returns {number} size of object in bytes
   */
  getItemSize(item) {
    return (new TextEncoder().encode(JSON.stringify(item))).length;
  }

  /**
   * Sets the index of the earliest changed historyOrder record
   * @param {number} index index of the earliest changed record 
   */
  setStartNewOrderIndex(index) {
    if(this._startNewOrderIndex > index || this._startNewOrderIndex === -1) {
      this._startNewOrderIndex = index;
    }
  }

  /**
   * Sets the index of the earliest changed deal record
   * @param {number} index index of the earliest changed record 
   */
  setStartNewDealIndex(index) {
    if(this._startNewDealIndex > index || this._startNewDealIndex === -1) {
      this._startNewDealIndex = index;
    }
  }

  /**
   * Retrieves history from saved file
   * @returns {Object} object with deals and historyOrders
   */
  getHistoryFromDisk() {
    const getItemSize = this.getItemSize;
    const accountId = this._accountId;
    const history = {deals: [], historyOrders: []};
    fs.ensureDir('./.metaapi');
    try {
      if(fs.pathExistsSync(`./.metaapi/${accountId}-deals.bin`)) {
        let deals = JSON.parse(fs.readFileSync(`./.metaapi/${accountId}-deals.bin`, 'utf-8').toString('utf-8'));
        this._dealsSize = deals.map(deal => getItemSize(deal));
        history.deals = deals.map((deal) => {
          deal.time = new Date(deal.time);
          return deal;
        });
      }
    } catch(err) {
      console.error(`[${(new Date()).toISOString()}] Failed to read deals ` + 
      `history storage of account ${accountId}`, err);
      fs.removeSync(`./.metaapi/${accountId}-deals.bin`);
    }
    try{
      if(fs.pathExistsSync(`./.metaapi/${accountId}-historyOrders.bin`)) {
        let historyOrders = JSON.parse(fs.readFileSync(`./.metaapi/${accountId}-historyOrders.bin`, 
          'utf-8').toString('utf-8'));
        this._historyOrdersSize = historyOrders.map(historyOrder => getItemSize(historyOrder));
        history.historyOrders = historyOrders.map((historyOrder) => {
          historyOrder.time = new Date(historyOrder.time);
          historyOrder.doneTime = new Date(historyOrder.doneTime);
          return historyOrder;
        });
      }
    } catch(err) {
      console.error(`[${(new Date()).toISOString()}] Failed to read historyOrders ` + 
      `history storage of account ${accountId}`, err);
      fs.removeSync(`./.metaapi/${accountId}-historyOrders.bin`);
    }
    return history;
  }

  /**
   * Saves unsaved history items to disk storage
   */
  async updateDiskStorage() {
    fs.ensureDir('./.metaapi');
    const getItemSize = this.getItemSize;
    const accountId = this._accountId;
    const historyStorage = this._historyStorage;
    async function replaceRecords(type, startIndex, replaceItems, sizeArray) {
      const filePath = `./.metaapi/${accountId}-${type}.bin`;
      let fileSize = (await fs.stat(filePath)).size;
      if(startIndex === 0) {
        await fs.writeFile(filePath, JSON.stringify(replaceItems), 'utf-8');
      } else {
        const replacedItems = sizeArray.slice(startIndex);
        // replacedItems.length - skip commas, replacedItems.reduce - skip item sizes, 1 - skip ] at the end
        const startPosition = fileSize - replacedItems.length - replacedItems.reduce((a, b) => a + b, 0) - 1;
        await fs.truncate(filePath, startPosition);
        await fs.appendFile(filePath, 
          ',' + JSON.stringify(replaceItems).slice(1), {encoding: 'utf-8'});
      }        
      return sizeArray.slice(0, startIndex).concat(replaceItems.map(item => getItemSize(item)));
    }

    if(this._startNewDealIndex !== -1) {
      const filePath = `./.metaapi/${accountId}-deals.bin`;
      if(!await fs.pathExists(filePath)) {
        const deals = JSON.stringify(historyStorage.deals);
        fs.writeFile(filePath, deals, 'utf-8', (err) => {
          if(err) {console.error(`[${(new Date()).toISOString()}] Error saving deals ` +
          `on disk for account ${accountId}`, err);}});
        this._dealsSize = historyStorage.deals.map(item => getItemSize(item));
      } else {
        const replaceDeals = historyStorage.deals.slice(this._startNewDealIndex);
        this._dealsSize = await replaceRecords('deals', this._startNewDealIndex, replaceDeals, this._dealsSize);
      }
      this._startNewDealIndex = -1;
    }
    if(this._startNewOrderIndex !== -1) {
      const filePath = `./.metaapi/${accountId}-historyOrders.bin`;
      if(!await fs.pathExists(filePath)) {
        const historyOrders = JSON.stringify(historyStorage.historyOrders);
        fs.writeFile(filePath, historyOrders, 'utf-8', (err) => {
          if(err) {console.error(`[${(new Date()).toISOString()}] Error saving historyOrders ` + 
          `on disk for account ${accountId}`, err);}});
        this._historyOrdersSize = historyStorage.historyOrders.map(item => getItemSize(item));
      } else {
        const replaceOrders = historyStorage.historyOrders.slice(this._startNewOrderIndex);
        this._historyOrdersSize = await replaceRecords('historyOrders', this._startNewOrderIndex, 
          replaceOrders, this._historyOrdersSize);
      }  
      this._startNewOrderIndex = -1;
    }
  }

  /**
   * Deletes storage files from disk
   */
  async deleteStorageFromDisk(){
    await fs.remove(`./.metaapi/${this._accountId}-deals.bin`);
    await fs.remove(`./.metaapi/${this._accountId}-historyOrders.bin`);
  }
}
