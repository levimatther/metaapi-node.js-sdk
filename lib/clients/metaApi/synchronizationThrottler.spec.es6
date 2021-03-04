import SynchronizationThrottler from './synchronizationThrottler';
import sinon from 'sinon';

/**
 * @test {SynchronizationThrottler}
 */
describe('SynchronizationThrottler', () => {
  let throttler, clock, sandbox;
  let websocketClient = {
    _rpcRequest: (accountId, request, timeoutInSeconds) => {}
  };

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    clock = sinon.useFakeTimers({
      now: new Date('2020-10-05T10:00:00.000Z'),
      shouldAdvanceTime: true
    });
    websocketClient._rpcRequest = sandbox.stub();
    throttler = new SynchronizationThrottler(websocketClient, {maxConcurrentSynchronizations: 2});
    throttler.start();
  });

  afterEach(() => {
    clock.restore();
  });
    
  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should immediately send request if free slots exist', async () => {
    await throttler.scheduleSynchronize('accountId', {requestId: 'test'});
    sinon.assert.match(throttler._synchronizationIds, {test: 1601892000000});
    throttler.removeSynchronizationId('test');
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId', {requestId: 'test'});
    sinon.assert.match(throttler._synchronizationIds, {});
  });

  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should not remove sync if different instance index', async () => {
    await throttler.scheduleSynchronize('accountId', {requestId: 'test', instanceIndex: 0});
    await throttler.scheduleSynchronize('accountId', {requestId: 'test1', instanceIndex: 1});
    sinon.assert.match(throttler._synchronizationIds, {test: 1601892000000, test1: 1601892000000});
    throttler.removeSynchronizationId('test', 0);
    sinon.assert.match(throttler._synchronizationIds, {test1: 1601892000000});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId', {requestId: 'test', instanceIndex: 0});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId', {requestId: 'test1', instanceIndex: 1});
    sinon.assert.match(throttler._synchronizationIds, {});
  });

  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should wait for other sync requests to finish if slots are full', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'});
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId1', {requestId: 'test1'});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId2', {requestId: 'test2'});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'});
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient._rpcRequest, 2);
    throttler.removeSynchronizationId('test1');
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient._rpcRequest, 3);
  });

  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should not take extra slots if sync ids belong to the same account', async () => {
    throttler.scheduleSynchronize('accountId', {requestId: 'test', instanceIndex: 0});
    throttler.scheduleSynchronize('accountId', {requestId: 'test1', instanceIndex: 1});
    throttler.scheduleSynchronize('accountId2', {requestId: 'test2'});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'});
    sinon.assert.callCount(websocketClient._rpcRequest, 3);
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId', {requestId: 'test', instanceIndex: 0});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId', {requestId: 'test1', instanceIndex: 1});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId2', {requestId: 'test2'});
    sinon.assert.match(throttler._synchronizationIds, {});
  });

  /**
   * @test {SynchronizationThrottler#_removeOldSyncIdsJob}
   */
  it('should clear expired synchronization slots if no packets for 10 seconds', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'});
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'});
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient._rpcRequest, 2);
    await clock.tickAsync(11000);
    sinon.assert.callCount(websocketClient._rpcRequest, 3);
  });

  /**
   * @test {SynchronizationThrottler#updateSynchronizationId}
   */
  it('should renew sync on update', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'});
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'});
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient._rpcRequest, 2);
    await clock.tickAsync(11000);
    sinon.assert.callCount(websocketClient._rpcRequest, 3);
    await clock.tickAsync(11000);
    throttler.updateSynchronizationId('test1');
    throttler.scheduleSynchronize('accountId4', {requestId: 'test4'});
    throttler.scheduleSynchronize('accountId5', {requestId: 'test5'});
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient._rpcRequest, 4);
  });

  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should replace previous syncs', async () => {
    throttler.scheduleSynchronize('accountId1', {requestId: 'test1'});
    throttler.scheduleSynchronize('accountId1', {requestId: 'test2'});
    throttler.scheduleSynchronize('accountId1', {requestId: 'test3'});
    throttler.scheduleSynchronize('accountId2', {requestId: 'test4'});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test5'});
    throttler.scheduleSynchronize('accountId1', {requestId: 'test3', instanceIndex: 0});
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient._rpcRequest, 4);
  });

  /**
   * @test {SynchronizationThrottler#onDisconnect}
   */
  it('should clear existing sync ids on disconnect', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'});
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'});
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient._rpcRequest, 2);
    throttler.onDisconnect();
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient._rpcRequest, 3);
  });

  /**
   * @test {SynchronizationThrottler#_removeFromQueue}
   */
  it('should remove synchronizations from queue', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'});
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test4', instanceIndex: 0});
    throttler.scheduleSynchronize('accountId4', {requestId: 'test5'});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test6'});
    throttler.scheduleSynchronize('accountId4', {requestId: 'test7'});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test8'});
    throttler.scheduleSynchronize('accountId5', {requestId: 'test9'});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test10', instanceIndex: 0});
    await clock.tickAsync(53000);
    sinon.assert.callCount(websocketClient._rpcRequest, 6);
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId1', {requestId: 'test1'});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId2', {requestId: 'test2'});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId3', {requestId: 'test8'});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId3', {requestId: 'test10', instanceIndex: 0});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId4', {requestId: 'test7'});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId5', {requestId: 'test9'});
  });

  /**
   * @test {SynchronizationThrottler#_removeOldSyncIdsJob}
   */
  it('should remove expired synchronizations from queue', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'});
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'});
    throttler.scheduleSynchronize('accountId4', {requestId: 'test4'});
    for (let i = 0; i < 20; i++) {
      await clock.tickAsync(8000);
      throttler.updateSynchronizationId('test1');
      throttler.updateSynchronizationId('test2');
    }
    throttler.scheduleSynchronize('accountId5', {requestId: 'test5'});
    for (let i = 0; i < 20; i++) {
      await clock.tickAsync(8000);
      throttler.updateSynchronizationId('test1');
      throttler.updateSynchronizationId('test2');
    }
    await clock.tickAsync(33000);
    sinon.assert.callCount(websocketClient._rpcRequest, 3);
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId1', {requestId: 'test1'});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId2', {requestId: 'test2'});
    sinon.assert.calledWith(websocketClient._rpcRequest, 'accountId5', {requestId: 'test5'});
  });
});