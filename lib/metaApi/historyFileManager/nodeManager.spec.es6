'use strict';

import should from 'should';
import fs from 'fs-extra';
import sinon from 'sinon';
const HistoryFileManager = require('./nodeManager');

/**
 * Helper function to read saved history storage
 */
async function readHistoryStorageFile() {
  const storage = {
    deals: [], 
    historyOrders: [], 
    lastDealTimeByInstanceIndex: {},
    lastHistoryOrderTimeByInstanceIndex: {}
  };
  const isConfigExists = fs.pathExistsSync('./.metaapi/accountId-application-config.bin');
  if(isConfigExists) {
    let config = JSON.parse(fs.readFileSync('./.metaapi/accountId-application-config.bin', 'utf-8').toString('utf-8'));
    storage.lastDealTimeByInstanceIndex = config.lastDealTimeByInstanceIndex;
    storage.lastHistoryOrderTimeByInstanceIndex = config.lastHistoryOrderTimeByInstanceIndex;
  }
  const isDealsExists = fs.pathExistsSync('./.metaapi/accountId-application-deals.bin');
  if(isDealsExists) {
    let deals = JSON.parse(fs.readFileSync('./.metaapi/accountId-application-deals.bin', 'utf-8').toString('utf-8'));
    if(deals.length){
      storage.deals = deals.map((deal) => {
        deal.time = new Date(deal.time);
        return deal;
      });
    }
  }
  const isOrdersExists = fs.pathExistsSync('./.metaapi/accountId-application-historyOrders.bin');
  if(isOrdersExists) {
    let historyOrders = JSON.parse(fs.readFileSync('./.metaapi/accountId-application-historyOrders.bin',
      'utf-8').toString('utf-8'));
    if(historyOrders.length) {
      storage.historyOrders = historyOrders.map((historyOrder) => {
        historyOrder.time = new Date(historyOrder.time);
        historyOrder.doneTime = new Date(historyOrder.doneTime);
        return historyOrder;
      });
    }
  }
  return storage;
}

/**
 * @test {HistoryFileManager}
 */
describe('HistoryFileManager', () => {

  let storage;
  let fileManager;
  let testDeal;
  let testDeal2;
  let testDeal3;
  let testOrder;
  let testOrder2;
  let testOrder3;
  let testConfig;
  let sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
    fs.ensureDir('./.metaapi');
  });

  beforeEach(async () => {
    storage = {};
    fileManager = new HistoryFileManager('accountId', 'application', storage);
    sandbox.stub(fileManager, 'startUpdateJob').returns();
    testDeal = {id:'37863643', type:'DEAL_TYPE_BALANCE', magic:0, time: new Date(100), commission:0, 
      swap:0, profit:10000, platform:'mt5', comment:'Demo deposit 1'};
    testDeal2 = {id:'37863644', type:'DEAL_TYPE_SELL', magic:1, time: new Date(200), commission:0, 
      swap:0, profit:10000, platform:'mt5', comment:'Demo deposit 2'};
    testDeal3 = {id:'37863645', type:'DEAL_TYPE_BUY', magic:2, time: new Date(300), commission:0, 
      swap:0, profit:10000, platform:'mt5', comment:'Demo deposit 3'};
    testOrder = {id:'61210463', type:'ORDER_TYPE_SELL', state:'ORDER_STATE_FILLED', symbol:'AUDNZD', magic:0, 
      time: new Date(50), doneTime: new Date(100), currentPrice:1, volume:0.01, 
      currentVolume:0, positionId:'61206630', platform:'mt5', comment:'AS_AUDNZD_5YyM6KS7Fv:'};
    testOrder2 = {id:'61210464', type:'ORDER_TYPE_BUY_LIMIT', state:'ORDER_STATE_FILLED', symbol:'AUDNZD', magic:1, 
      time: new Date(75), doneTime: new Date(200), currentPrice:1, volume:0.01, 
      currentVolume:0, positionId:'61206631', platform:'mt5', comment:'AS_AUDNZD_5YyM6KS7Fv:'};
    testOrder3 = {id:'61210465', type:'ORDER_TYPE_BUY', state:'ORDER_STATE_FILLED', symbol:'AUDNZD', magic:1, 
      time: new Date(100), doneTime: new Date(300), currentPrice:1, volume:0.01, 
      currentVolume:0, positionId:'61206631', platform:'mt5', comment:'AS_AUDNZD_5YyM6KS7Fv:'};
    testConfig = {
      lastDealTimeByInstanceIndex: {'0': 1000000000000}, 
      lastHistoryOrderTimeByInstanceIndex: {'0': 1000000000010}
    };
  });

  after(() => {
    fs.removeSync('./.metaapi');
  });

  afterEach(() => {
    sandbox.restore();
    fs.removeSync('./.metaapi/accountId-application-deals.bin');
    fs.removeSync('./.metaapi/accountId-application-historyOrders.bin');
  });
  
  /**
   * @test {HistoryFileManager#startUpdateJob}
   * @test {HistoryFileManager#stopUpdateJob}
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
   * @test {HistoryFileManager#getHistoryFromDisk}
   */
  it('should read history from file', async () => {
    fs.writeFileSync('./.metaapi/accountId-application-deals.bin', JSON.stringify([testDeal]),
      'utf-8');
    fs.writeFileSync('./.metaapi/accountId-application-historyOrders.bin', JSON.stringify([testOrder]),
      'utf-8');
    fs.writeFileSync('./.metaapi/accountId-application-config.bin', JSON.stringify(testConfig),
      'utf-8');
    const history = await fileManager.getHistoryFromDisk();
    await new Promise(res => setTimeout(res, 50));
    history.deals.should.match([testDeal]);
    history.historyOrders.should.match([testOrder]);
    history.lastDealTimeByInstanceIndex.should.match(testConfig.lastDealTimeByInstanceIndex);
    history.lastHistoryOrderTimeByInstanceIndex.should.match(testConfig.lastHistoryOrderTimeByInstanceIndex);
  });

  /**
   * @test {HistoryFileManager#updateDiskStorage}
   */
  it('should save items in a file', async () => {
    storage.deals = [testDeal];
    storage.historyOrders = [testOrder];
    storage.lastDealTimeByInstanceIndex = {'0': 1000000000000};
    storage.lastHistoryOrderTimeByInstanceIndex = {'0': 1000000000010};
    fileManager.setStartNewOrderIndex(0);
    fileManager.setStartNewDealIndex(0);
    fileManager.updateDiskStorage();
    await new Promise(res => setTimeout(res, 50));
    const savedData = await readHistoryStorageFile();
    savedData.deals.should.match([testDeal]);
    savedData.historyOrders.should.match([testOrder]);
    savedData.lastDealTimeByInstanceIndex.should.match({'0': 1000000000000});
    savedData.lastHistoryOrderTimeByInstanceIndex.should.match({'0': 1000000000010});
  });

  /**
   * @test {HistoryFileManager#updateDiskStorage}
   */
  it('should replace Nth item in a file', async () => {
    storage.deals = [testDeal, testDeal2];
    storage.historyOrders = [testOrder, testOrder2];
    fileManager.setStartNewOrderIndex(0);
    fileManager.setStartNewDealIndex(0);
    fileManager.updateDiskStorage();
    await new Promise(res => setTimeout(res, 50));
    testDeal2.magic = 100;
    testOrder2.magic = 100;
    fileManager.setStartNewOrderIndex(1);
    fileManager.setStartNewDealIndex(1);
    fileManager.updateDiskStorage();
    await new Promise(res => setTimeout(res, 50));
    const savedData = await readHistoryStorageFile();
    savedData.deals.should.match([testDeal, testDeal2]);
    savedData.historyOrders.should.match([testOrder, testOrder2]);
  });

  /**
   * @test {HistoryFileManager#updateDiskStorage}
   */
  it('should replace all items in a file', async () => {
    storage.deals = [testDeal, testDeal2];
    storage.historyOrders = [testOrder, testOrder2];
    fileManager.setStartNewOrderIndex(0);
    fileManager.setStartNewDealIndex(0);
    await fileManager.updateDiskStorage();
    testDeal.magic = 100;
    testDeal2.magic = 100;
    testOrder.magic = 100;
    testOrder2.magic = 100;
    fileManager.setStartNewOrderIndex(0);
    fileManager.setStartNewDealIndex(0);
    await fileManager.updateDiskStorage();
    const savedData = await readHistoryStorageFile();
    savedData.deals.should.match([testDeal, testDeal2]);
    savedData.historyOrders.should.match([testOrder, testOrder2]);
  });

  /**
   * @test {HistoryFileManager#updateDiskStorage}
   */
  it('should append a new object to already saved ones', async () => {
    storage.deals = [testDeal, testDeal2];
    storage.historyOrders = [testOrder, testOrder2];
    fileManager.setStartNewOrderIndex(0);
    fileManager.setStartNewDealIndex(0);
    await fileManager.updateDiskStorage();
    storage.deals = [testDeal, testDeal2, testDeal3];
    storage.historyOrders = [testOrder, testOrder2, testOrder3];
    fileManager.setStartNewOrderIndex(2);
    fileManager.setStartNewDealIndex(2);
    await fileManager.updateDiskStorage();
    const savedData = await readHistoryStorageFile();
    savedData.deals.should.match([testDeal, testDeal2, testDeal3]);
    savedData.historyOrders.should.match([testOrder, testOrder2, testOrder3]);
  });

  /**
   * @test {HistoryFileManager#updateDiskStorage}
   */
  it('should not corrupt the disk storage if update called multiple times', async () => {
    storage.deals = [testDeal, testDeal2];
    storage.historyOrders = [testOrder, testOrder2];
    storage.lastDealTimeByInstanceIndex = {'0': 1000000000000};
    storage.lastHistoryOrderTimeByInstanceIndex = {'0': 1000000000010};
    fileManager.setStartNewOrderIndex(0);
    fileManager.setStartNewDealIndex(0);
    await fileManager.updateDiskStorage();
    storage.deals = [testDeal, testDeal2, testDeal3];
    storage.historyOrders = [testOrder, testOrder2, testOrder3];
    storage.lastDealTimeByInstanceIndex = {'1': 1000000000000};
    storage.lastHistoryOrderTimeByInstanceIndex = {'1': 1000000000010};
    fileManager.setStartNewOrderIndex(2);
    fileManager.setStartNewDealIndex(2);
    await Promise.all([
      fileManager.updateDiskStorage(),
      fileManager.updateDiskStorage(),
      fileManager.updateDiskStorage(),
      fileManager.updateDiskStorage(),
      fileManager.updateDiskStorage()
    ]);
    JSON.parse(await fs.readFile('./.metaapi/accountId-application-historyOrders.bin'));
    JSON.parse(await fs.readFile('./.metaapi/accountId-application-deals.bin'));
    JSON.parse(await fs.readFile('./.metaapi/accountId-application-config.bin'));
  });

  /**
   * @test {HistoryFileManager#deleteStorageFromDisk}
   */
  it('should remove history from disk', async () => {
    await fs.ensureFile('./.metaapi/accountId-application-historyOrders.bin');
    await fs.ensureFile('./.metaapi/accountId-application-deals.bin');
    await fs.ensureFile('./.metaapi/accountId-application-config.bin');
    fs.pathExistsSync('./.metaapi/accountId-application-historyOrders.bin').should.equal(true);
    fs.pathExistsSync('./.metaapi/accountId-application-deals.bin').should.equal(true);
    fs.pathExistsSync('./.metaapi/accountId-application-config.bin').should.equal(true);
    await fileManager.deleteStorageFromDisk();
    fs.pathExistsSync('./.metaapi/accountId-application-historyOrders.bin').should.equal(false);
    fs.pathExistsSync('./.metaapi/accountId-application-deals.bin').should.equal(false);
    fs.pathExistsSync('./.metaapi/accountId-application-config.bin').should.equal(false);
  });

});
