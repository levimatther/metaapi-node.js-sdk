const FileManager = require('./fileManager');
const { openDB, deleteDB } = require('idb');

/**
 * History storage manager which saves and loads history to IndexedDB
 */
module.exports = class BrowserHistoryManager extends FileManager {

  /**
   * Constructs the history file manager instance
   * @param {String} accountId MetaApi account id
   * @param {String} application MetaApi application id
   * @param {HistoryStorage} historyStorage history storage
   */
  constructor(accountId, application, historyStorage) {
    super(accountId, application, historyStorage);
  }

  /**
   * Retrieves history from IndexedDB
   * @returns {Object} object with deals and historyOrders
   */
  async getHistoryFromDisk() {
    try {
      const history = {deals: [], historyOrders: []};
      const db = await this._getDatabase();
      const deals = await db.get('deals', this._accountId + '-' + this._application);
      history.deals = deals && deals.items || [];
      const historyOrders = await db.get('historyOrders', this._accountId + '-' + this._application);
      history.historyOrders = historyOrders && historyOrders.items || [];
      db.close();
      return history;
    } catch(err) {
      console.error(`[${(new Date()).toISOString()}] Failed to get history from ` + 
      `IndexedDB of account ${this._accountId}`, err);
    }
  }

  /**
   * Saves history items to IndexedDB
   */
  async updateDiskStorage() {
    try {
      const db = await this._getDatabase();
      await db.put('deals', {accountIdAndApplication: this._accountId + '-' + this._application,
        items: this._historyStorage.deals});
      await db.put('historyOrders', {accountIdAndApplication: this._accountId + '-' + this._application,
        items: this._historyStorage.historyOrders});
      db.close();
    } catch(err) {
      console.error(`[${(new Date()).toISOString()}] Failed to save history into ` + 
        `IndexedDB of account ${this._accountId}`, err);
    }
  }

  /**
   * Deletes storage files from disk
   */
  async deleteStorageFromDisk(){
    try {
      const db = await this._getDatabase();
      await db.delete('deals', this._accountId + '-' + this._application);
      await db.delete('historyOrders', this._accountId + '-' + this._application);
      db.close();
    } catch(err) {
      console.error(`[${(new Date()).toISOString()}] Failed to delete history from ` + 
      `IndexedDB of account ${this._accountId}`, err);
    }
  }

  /**
   * Opens an IndexedDB database and verifies its structure, recreates if structure is invalid, then returns
   * @returns {IndexedDB} indexed db
   */
  async _getDatabase() {
    const keyPath = 'accountIdAndApplication';
    const db = await openDB('metaapi', 1, {
      upgrade(database, oldVersion, newVersion, transaction) {
        if (!database.objectStoreNames.contains('deals')) {
          database.createObjectStore('deals', {keyPath});
        }
        if (!database.objectStoreNames.contains('historyOrders')) {
          database.createObjectStore('historyOrders', {keyPath});
        }
      },
    });
    if(!db.objectStoreNames.contains('deals') || !db.objectStoreNames.contains('historyOrders')) {
      db.close();
      await deleteDB('metaapi');
      return await this._getDatabase();
    } else {
      const tr = db.transaction(['deals', 'historyOrders'], 'readonly');  
      if(tr.objectStore('deals').keyPath !== keyPath || tr.objectStore('historyOrders').keyPath !== keyPath) {
        db.close();
        await deleteDB('metaapi');
        return await this._getDatabase();
      } else { 
        return db;
      }
    }
  }

};