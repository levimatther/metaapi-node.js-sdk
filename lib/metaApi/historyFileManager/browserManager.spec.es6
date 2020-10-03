'use strict';

import sinon from 'sinon';
import BrowserHistoryManager from './browserManager';
require('fake-indexeddb/auto');
const { openDB, deleteDB } = require('idb');

/**
 * Helper function to get the test database
 * @returns {IndexedDB} Indexed DB
 */
async function getTestDb() {
  const db = await openDB('metaapi', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('deals')) {
        database.createObjectStore('deals', {keyPath: 'accountIdAndApplication'});
      }
      if (!database.objectStoreNames.contains('historyOrders')) {
        database.createObjectStore('historyOrders', {keyPath: 'accountIdAndApplication'});
      }
    },
  });
  return db;
}

/**
 * Helper function to read saved history storage
 * @returns {history} history object
 */
async function readHistoryStorageFile() {
  const history = {deals: [], historyOrders: []};
  const db = await getTestDb();
  history.deals = await db.get('deals', 'accountId-application');
  history.historyOrders = await db.get('historyOrders', 'accountId-application');
  db.close();
  return history;
}

/**
 * Helper function to create test data in IndexedDB
 * @param deals history deals
 * @param historyOrders history orders
 */
async function createTestData(deals, historyOrders) {
  const db = await getTestDb();
  await db.put('deals', {accountIdAndApplication: 'accountId-application', items: deals});
  await db.put('historyOrders', {accountIdAndApplication: 'accountId-application', items: historyOrders});
  db.close();
}

/**
 * @test {BrowserHistoryManager}
 */
describe('BrowserHistoryManger', () => {

  let storage;
  let fileManager;
  let testDeal;
  let testDeal2;
  let testOrder;
  let testOrder2;
  let sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(async () => {
    storage = {};
    fileManager = new BrowserHistoryManager('accountId', 'application', storage);
    sandbox.stub(fileManager, 'startUpdateJob').returns();
    testDeal = {id:'37863643', type:'DEAL_TYPE_BALANCE', magic:0, time: new Date(100), commission:0, 
      swap:0, profit:10000, platform:'mt5', comment:'Demo deposit 1'};
    testDeal2 = {id:'37863644', type:'DEAL_TYPE_SELL', magic:1, time: new Date(200), commission:0, 
      swap:0, profit:10000, platform:'mt5', comment:'Demo deposit 2'};
    testOrder = {id:'61210463', type:'ORDER_TYPE_SELL', state:'ORDER_STATE_FILLED', symbol:'AUDNZD', magic:0, 
      time: new Date(50), doneTime: new Date(100), currentPrice:1, volume:0.01, 
      currentVolume:0, positionId:'61206630', platform:'mt5', comment:'AS_AUDNZD_5YyM6KS7Fv:'};
    testOrder2 = {id:'61210464', type:'ORDER_TYPE_BUY_LIMIT', state:'ORDER_STATE_FILLED', symbol:'AUDNZD', magic:1, 
      time: new Date(75), doneTime: new Date(200), currentPrice:1, volume:0.01, 
      currentVolume:0, positionId:'61206631', platform:'mt5', comment:'AS_AUDNZD_5YyM6KS7Fv:'};
  });

  afterEach(async () => {
    const db = await getTestDb();
    await db.clear('deals');
    await db.clear('historyOrders');
    db.close();
  });
  
  /**
   * @test {BrowserHistoryManager#startUpdateJob}
   * @test {BrowserHistoryManager#stopUpdateJob}
   */
  it('should start and stop job', async () => {
    sandbox.restore();
    const clock = sinon.useFakeTimers();
    sandbox.stub(fileManager, 'updateDiskStorage').returns();
    fileManager.startUpdateJob();
    await clock.tickAsync(61000);
    sinon.assert.calledOnce(fileManager.updateDiskStorage);
    await clock.tickAsync(61000);
    sinon.assert.calledTwice(fileManager.updateDiskStorage);
    fileManager.stopUpdateJob();
    await clock.tickAsync(61000);
    sinon.assert.calledTwice(fileManager.updateDiskStorage);
    fileManager.startUpdateJob();
    await clock.tickAsync(61000);
    sinon.assert.calledThrice(fileManager.updateDiskStorage);
    fileManager.stopUpdateJob();
    clock.restore();
  });


  /**
   * @test {BrowserHistoryManager#getHistoryFromDisk}
   */
  describe('getHistoryFromDisk', () => {

    /**
     * @test {BrowserHistoryManager#getHistoryFromDisk}
     */
    it('should read history from file', async () => {
      await createTestData([testDeal], [testOrder]);
      const history = await fileManager.getHistoryFromDisk();
      history.deals.should.match([testDeal]);
      history.historyOrders.should.match([testOrder]);
    });

    /**
     * @test {BrowserHistoryManager#getHistoryFromDisk}
     */
    it('should return empty history if entries dont exist', async () => {
      const history = await fileManager.getHistoryFromDisk();
      history.deals.should.match([]);
      history.historyOrders.should.match([]);
    });

    /**
     * @test {BrowserHistoryManager#getHistoryFromDisk}
     */
    it('should return empty history if database does not exist', async () => {
      await deleteDB('metaapi');
      const history = await fileManager.getHistoryFromDisk();
      history.deals.should.match([]);
      history.historyOrders.should.match([]);
    });

  });

  /**
   * @test {BrowserHistoryManager#updateDiskStorage}
   */
  describe('updateDiskStorage', () => {

    /**
     * @test {BrowserHistoryManager#updateDiskStorage}
     */
    it('should create storage if doesnt exist', async () => {
      await deleteDB('metaapi');
      storage.deals = [testDeal];
      storage.historyOrders = [testOrder];
      await fileManager.updateDiskStorage();
      let history = await readHistoryStorageFile();
      sinon.assert.match(history.deals.items, [testDeal]);
      sinon.assert.match(history.historyOrders.items, [testOrder]);
    });

    /**
     * @test {BrowserHistoryManager#updateDiskStorage}
     */
    it('should add data if doesnt exist', async () => {
      let history = await readHistoryStorageFile();
      sinon.assert.match(history.deals, undefined);
      sinon.assert.match(history.historyOrders, undefined);
      storage.deals = [testDeal];
      storage.historyOrders = [testOrder];
      await fileManager.updateDiskStorage();
      history = await readHistoryStorageFile();
      sinon.assert.match(history.deals.items, [testDeal]);
      sinon.assert.match(history.historyOrders.items, [testOrder]);
    });

    /**
     * @test {BrowserHistoryManager#updateDiskStorage}
     */
    it('should update storage', async () => {
      await createTestData([testDeal], [testOrder]);
      let history = await readHistoryStorageFile();
      sinon.assert.match(history.deals.items, [testDeal]);
      sinon.assert.match(history.historyOrders.items, [testOrder]);
      storage.deals = [testDeal, testDeal2];
      storage.historyOrders = [testOrder, testOrder2];
      await fileManager.updateDiskStorage();
      history = await readHistoryStorageFile();
      sinon.assert.match(history.deals.items, [testDeal, testDeal2]);
      sinon.assert.match(history.historyOrders.items, [testOrder, testOrder2]);
    });

    /**
     * @test {BrowserHistoryManager#updateDiskStorage}
     */
    it('should remake the storage if storage has invalid structure', async () => {
      await deleteDB('metaapi');
      const db = await openDB('metaapi', 1, {
        upgrade(database, oldVersion, newVersion, transaction) {
          database.createObjectStore('wrong', {keyPath: 'accountIdAndApplication'});
        },
      });
      db.close();
      storage.deals = [testDeal];
      storage.historyOrders = [testOrder];
      await fileManager.updateDiskStorage();
      let history = await readHistoryStorageFile();
      sinon.assert.match(history.deals.items, [testDeal]);
      sinon.assert.match(history.historyOrders.items, [testOrder]);
    });

    /**
     * @test {BrowserHistoryManager#updateDiskStorage}
     */
    it('should remake the storage if object store has invalid structure', async () => {
      await deleteDB('metaapi');
      const db = await openDB('metaapi', 1, {
        upgrade(database, oldVersion, newVersion, transaction) {
          database.createObjectStore('deals', {keyPath: 'wrong'});
          database.createObjectStore('historyOrders', {keyPath: 'wrong'});
        },
      });
      db.close();
      storage.deals = [testDeal];
      storage.historyOrders = [testOrder];
      await fileManager.updateDiskStorage();
      let history = await readHistoryStorageFile();
      sinon.assert.match(history.deals.items, [testDeal]);
      sinon.assert.match(history.historyOrders.items, [testOrder]);
    });

  });

  /**
   * @test {BrowserHistoryManager#deleteStorageFromDisk}
   */
  describe('deleteStorageFromDisk', () => {

    /**
     * @test {BrowserHistoryManager#deleteStorageFromDisk}
     */
    it('should do nothing without error if storage doesnt exist', async () => {
      await deleteDB('metaapi');
      await fileManager.deleteStorageFromDisk();
    });

    /**
     * @test {BrowserHistoryManager#deleteStorageFromDisk}
     */
    it('should do nothing without error if db exists and entries dont exist', async () => {
      await fileManager.deleteStorageFromDisk();
    });
    
    /**
     * @test {BrowserHistoryManager#deleteStorageFromDisk}
     */
    it('should delete storage', async () => {
      await createTestData([testDeal], [testOrder]);
      let history = await readHistoryStorageFile();
      sinon.assert.match(history.deals.items, [testDeal]);
      sinon.assert.match(history.historyOrders.items, [testOrder]);
      await fileManager.deleteStorageFromDisk();
      history = await readHistoryStorageFile();
      sinon.assert.match(history.deals, undefined);
      sinon.assert.match(history.historyOrders, undefined);
    });

  });

});
