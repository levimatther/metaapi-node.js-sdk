'use strict';

import should from 'should';
import MemoryHistoryStorage from './memoryHistoryStorage';

/**
 * @test {MemoryHistoryStorage}
 */
describe('MemoryHistoryStorage', () => {

  let storage;

  before(() => {
    storage = new MemoryHistoryStorage();
  });

  beforeEach(() => {
    storage.reset();
    storage.onConnected();
  });

  /**
   * @test {MemoryHistoryStorage#lastHistoryOrderTime}
   */
  it('should return last history order time', () => {
    storage.onHistoryOrderAdded({});
    storage.onHistoryOrderAdded({doneTime: new Date('2020-01-01T00:00:00.000Z')});
    storage.onHistoryOrderAdded({doneTime: new Date('2020-01-02T00:00:00.000Z')});
    storage.lastHistoryOrderTime().should.match(new Date('2020-01-02T00:00:00.000Z'));
  });

  /**
   * @test {MemoryHistoryStorage#lastDealTime}
   */
  it('should return last history deal time', () => {
    storage.onDealAdded({});
    storage.onDealAdded({time: new Date('2020-01-01T00:00:00.000Z')});
    storage.onDealAdded({time: new Date('2020-01-02T00:00:00.000Z')});
    storage.lastDealTime().should.match(new Date('2020-01-02T00:00:00.000Z'));
  });

  /**
   * @test {MemoryHistoryStorage#deals}
   */
  it('should return saved deals', () => {
    storage.onDealAdded({id: '1', time: new Date('2020-01-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded({id: '7', time: new Date('2020-05-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded({id: '8', time: new Date('2020-02-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded({id: '6', time: new Date('2020-10-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded({id: '4', time: new Date('2020-02-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded({id: '5', time: new Date('2020-06-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded({id: '11', type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded({id: '3', time: new Date('2020-09-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded({id: '5', time: new Date('2020-06-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded({id: '2', time: new Date('2020-08-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded({id: '10', type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded({id: '12', type: 'DEAL_TYPE_BUY'});
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
    storage.onHistoryOrderAdded({id: '1', doneTime: new Date('2020-01-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded({id: '7', doneTime: new Date('2020-05-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded({id: '8', doneTime: new Date('2020-02-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded({id: '6', doneTime: new Date('2020-10-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded({id: '4', doneTime: new Date('2020-02-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded({id: '5', doneTime: new Date('2020-06-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded({id: '11', type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded({id: '3', doneTime: new Date('2020-09-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded({id: '5', doneTime: new Date('2020-06-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded({id: '2', doneTime: new Date('2020-08-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded({id: '10', type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded({id: '12', type: 'ORDER_TYPE_BUY'});
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
    storage.onOrderSynchronizationFinished();
    storage.orderSynchronizationFinished.should.be.true();
  });

  /**
   * @test {MemoryHistoryStorage#dealSynchronizationFinished}
   */
  it('should return saved deal synchronization status', () => {
    storage.dealSynchronizationFinished.should.be.false();
    storage.onDealSynchronizationFinished();
    storage.dealSynchronizationFinished.should.be.true();
  });

});
