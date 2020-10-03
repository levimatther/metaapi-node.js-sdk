'use strict';

/**
 * Abstract class which defines history file manager.
 */
module.exports = class FileManager {

  /**
   * Constructs the history storage
   * @param {String} accountId MetaApi account id
   * @param {String} application MetaApi application id
   * @param {HistoryStorage} historyStorage history storage
   */
  constructor(accountId, application, historyStorage) {
    this._accountId = accountId;
    this._application = application;
    this._historyStorage = historyStorage;
    this._startNewDealIndex = -1;
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
  async getHistoryFromDisk() {}

  /**
   * Saves unsaved history items to disk storage
   */
  async updateDiskStorage() {}

  /**
   * Deletes storage files from disk
   */
  async deleteStorageFromDisk(){}

};
