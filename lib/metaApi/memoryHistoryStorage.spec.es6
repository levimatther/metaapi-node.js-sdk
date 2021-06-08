'use strict';

import should from 'should';
import sinon from 'sinon';
import MemoryHistoryStorage from './memoryHistoryStorage';
import HistoryFileManager from './historyFileManager';

/**
 * @test {MemoryHistoryStorage}
 */
describe('MemoryHistoryStorage', () => {

  let storage;
  let testDeal;
  let testOrder;
  let sandbox;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(async () => {
    sandbox.stub(HistoryFileManager.prototype, 'startUpdateJob').returns();
    storage = new MemoryHistoryStorage('accountId');
    testDeal = {id:'37863643', type:'DEAL_TYPE_BALANCE', magic:0, time: new Date(100), commission:0, 
      swap:0, profit:10000, platform:'mt5', comment:'Demo deposit 1'};
    testOrder = {id:'61210463', type:'ORDER_TYPE_SELL', state:'ORDER_STATE_FILLED', symbol:'AUDNZD', magic:0, 
      time: new Date(50), doneTime: new Date(100), currentPrice:1, volume:0.01, 
      currentVolume:0, positionId:'61206630', platform:'mt5', comment:'AS_AUDNZD_5YyM6KS7Fv:'};
    await storage.clear();
    storage.onConnected('1:ps-mpa-1', 1);
  });

  afterEach(() => {
    sandbox.restore();
  });
  
  /**
   * @test {MemoryHistoryStorage#loadDataFromDisk}
   */
  it('should load data from the file manager', async () => {
    sandbox.stub(HistoryFileManager.prototype, 'getHistoryFromDisk')
      .returns({deals: [testDeal], historyOrders: [testOrder]});
    await storage.loadDataFromDisk();
    await new Promise(res => setTimeout(res, 50));
    storage.deals.should.match([testDeal]);
    storage.historyOrders.should.match([testOrder]);
  });

  /**
   * @test {MemoryHistoryStorage#updateDiskStorage}
   */
  it('should update disk storage', async () => {
    sandbox.stub(HistoryFileManager.prototype, 'updateDiskStorage');
    await storage.updateDiskStorage();
    sinon.assert.calledOnce(HistoryFileManager.prototype.updateDiskStorage);
  });

  /**
   * @test {MemoryHistoryStorage#lastHistoryOrderTime}
   */
  it('should return last history order time', () => {
    storage.onHistoryOrderAdded('1:ps-mpa-1', {});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {doneTime: new Date('2020-01-01T00:00:00.000Z')});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {doneTime: new Date('2020-01-02T00:00:00.000Z')});
    storage.lastHistoryOrderTime().should.match(new Date('2020-01-02T00:00:00.000Z'));
  });

  /**
   * @test {MemoryHistoryStorage#lastDealTime}
   */
  it('should return last history deal time', () => {
    storage.onDealAdded('1:ps-mpa-1', {});
    storage.onDealAdded('1:ps-mpa-1', {time: new Date('2020-01-01T00:00:00.000Z')});
    storage.onDealAdded('1:ps-mpa-1', {time: new Date('2020-01-02T00:00:00.000Z')});
    storage.lastDealTime().should.match(new Date('2020-01-02T00:00:00.000Z'));
  });

  /**
   * @test {MemoryHistoryStorage#deals}
   */
  it('should return saved deals', () => {
    storage.onDealAdded('1:ps-mpa-1', {id: '1', time: new Date('2020-01-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded('1:ps-mpa-1', {id: '7', time: new Date('2020-05-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded('1:ps-mpa-1', {id: '8', time: new Date('2020-02-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded('1:ps-mpa-1', {id: '6', time: new Date('2020-10-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded('1:ps-mpa-1', {id: '4', time: new Date('2020-02-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded('1:ps-mpa-1', {id: '5', time: new Date('2020-06-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded('1:ps-mpa-1', {id: '11', type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded('1:ps-mpa-1', {id: '3', time: new Date('2020-09-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded('1:ps-mpa-1', {id: '5', time: new Date('2020-06-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded('1:ps-mpa-1', {id: '2', time: new Date('2020-08-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded('1:ps-mpa-1', {id: '10', type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded('1:ps-mpa-1', {id: '12', type: 'DEAL_TYPE_BUY'});
    storage.deals.should.match([
      {id: '10', type: 'DEAL_TYPE_SELL'},
      {id: '11', type: 'DEAL_TYPE_SELL'},
      {id: '12', type: 'DEAL_TYPE_BUY'},
      {id: '1', time: new Date('2020-01-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'},
      {id: '4', time: new Date('2020-02-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'},
      {id: '8', time: new Date('2020-02-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'},
      {id: '7', time: new Date('2020-05-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'},
      {id: '5', time: new Date('2020-06-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'},
      {id: '2', time: new Date('2020-08-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'},
      {id: '3', time: new Date('2020-09-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'},
      {id: '6', time: new Date('2020-10-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'}
    ]);
  });

  /**
   * @test {MemoryHistoryStorage#historyOrders}
   */
  it('should return saved historyOrders', () => {                                  
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '1', doneTime: new Date('2020-01-01T00:00:00.000Z'),
      type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '7', doneTime: new Date('2020-05-01T00:00:00.000Z'),
      type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '8', doneTime: new Date('2020-02-01T00:00:00.000Z'), 
      type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '6', doneTime: new Date('2020-10-01T00:00:00.000Z'), 
      type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '4', doneTime: new Date('2020-02-01T00:00:00.000Z'), 
      type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '5', doneTime: new Date('2020-06-01T00:00:00.000Z'), 
      type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '11', type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '3', doneTime: new Date('2020-09-01T00:00:00.000Z'), 
      type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '5', doneTime: new Date('2020-06-01T00:00:00.000Z'), 
      type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '2', doneTime: new Date('2020-08-01T00:00:00.000Z'), 
      type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '10', type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '12', type: 'ORDER_TYPE_BUY'});
    storage.historyOrders.should.match([
      {id: '10', type: 'ORDER_TYPE_SELL'},
      {id: '11', type: 'ORDER_TYPE_SELL'},
      {id: '12', type: 'ORDER_TYPE_BUY'},
      {id: '1', doneTime: new Date('2020-01-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'},
      {id: '4', doneTime: new Date('2020-02-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'},
      {id: '8', doneTime: new Date('2020-02-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'},
      {id: '7', doneTime: new Date('2020-05-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'},
      {id: '5', doneTime: new Date('2020-06-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'},
      {id: '2', doneTime: new Date('2020-08-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'},
      {id: '3', doneTime: new Date('2020-09-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'},
      {id: '6', doneTime: new Date('2020-10-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'}
    ]);
  });

  /**
   * @test {MemoryHistoryStorage#orderSynchronizationFinished}
   */
  it('should return saved order synchronization status', () => {
    storage.orderSynchronizationFinished.should.be.false();
    storage.onOrderSynchronizationFinished(1);
    storage.orderSynchronizationFinished.should.be.true();
  });

  /**
   * @test {MemoryHistoryStorage#dealSynchronizationFinished}
   */
  it('should return saved deal synchronization status', () => {
    storage._fileManager.updateDiskStorage = sandbox.stub();
    storage.dealSynchronizationFinished.should.be.false();
    storage.onDealSynchronizationFinished(1);
    sinon.assert.calledOnce(storage._fileManager.updateDiskStorage);
    storage.dealSynchronizationFinished.should.be.true();
  });

  /**
   * @test {MemoryHistoryStorage#reset}
   */
  it('should reset storage', async () => {
    sandbox.stub(storage._fileManager, 'deleteStorageFromDisk');
    storage.onDealAdded('1:ps-mpa-1', {id: '1', time: new Date('2020-01-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'});
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '1', doneTime: new Date('2020-01-01T00:00:00.000Z'), 
      type: 'ORDER_TYPE_SELL'});
    await storage.clear();
    sinon.assert.match(storage.deals, []);
    sinon.assert.match(storage.historyOrders, []);
    sinon.assert.calledOnce(storage._fileManager.deleteStorageFromDisk);
  });

  /**
   * @test {MemoryHistoryStorage#reset}
   */
  it('should record instance data from multiple streams', async () => {
    storage.onHistoryOrderAdded('1:ps-mpa-1', {id: '2', doneTime: new Date('2020-01-01T00:00:00.000Z')});
    sinon.assert.match(await storage.lastHistoryOrderTime(1), new Date('2020-01-01T00:00:00.000Z'));
    storage.onHistoryOrderAdded('1:ps-mpa-2', {id: '3', doneTime: new Date('2020-01-02T00:00:00.000Z')});
    sinon.assert.match(await storage.lastHistoryOrderTime(1), new Date('2020-01-02T00:00:00.000Z'));
    storage.onDealAdded('1:ps-mpa-1', {id: '2', time: new Date('2020-01-01T00:00:00.000Z')});
    sinon.assert.match(await storage.lastDealTime(1), new Date('2020-01-01T00:00:00.000Z'));
    storage.onDealAdded('1:ps-mpa-2', {id: '3', time: new Date('2020-01-02T00:00:00.000Z')});
    sinon.assert.match(await storage.lastDealTime(1), new Date('2020-01-02T00:00:00.000Z'));
  });

});
