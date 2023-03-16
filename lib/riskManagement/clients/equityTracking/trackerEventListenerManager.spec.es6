'use strict';

import sinon from 'sinon';
import TrackerEventListener from './trackerEventListener';
import TrackerEventListenerManager from './trackerEventListenerManager';

/**
 * @test {TrackerEventListenerManager}
 */
describe('TrackerEventListenerManager', () => {

  let domainClient = {
    requestApi: () => {}
  };
  let sandbox;
  let clock;
  let trackerEventListenerManager;
  let getEventStub, listener, callStub, errorStub;

  let expected = [{
    sequenceNumber: 2,
    accountId: 'accountId',
    trackerId: 'trackerId',
    period: 'day',
    startBrokerTime: '2022-04-08 00:00:00.000',
    endBrokerTime: '2022-04-08 23:59:59.999',
    brokerTime: '2022-04-08 09:36:00.000',
    absoluteDrawdown: 250,
    relativeDrawdown: 0.25
  },
  {
    sequenceNumber: 3,
    accountId: 'accountId',
    trackerId: 'trackerId',
    period: 'day',
    startBrokerTime: '2022-04-08 00:00:00.000',
    endBrokerTime: '2022-04-08 23:59:59.999',
    brokerTime: '2022-04-08 09:36:00.000',
    absoluteDrawdown: 250,
    relativeDrawdown: 0.25
  }];

  let expected2 = [{
    sequenceNumber: 4,
    accountId: 'accountId',
    trackerId: 'trackerId',
    period: 'day',
    startBrokerTime: '2022-04-08 00:00:00.000',
    endBrokerTime: '2022-04-08 23:59:59.999',
    brokerTime: '2022-04-08 09:36:00.000',
    absoluteDrawdown: 250,
    relativeDrawdown: 0.25
  },
  {
    sequenceNumber: 5,
    accountId: 'accountId',
    trackerId: 'trackerId',
    period: 'day',
    startBrokerTime: '2022-04-08 00:00:00.000',
    endBrokerTime: '2022-04-08 23:59:59.999',
    brokerTime: '2022-04-08 09:36:00.000',
    absoluteDrawdown: 250,
    relativeDrawdown: 0.25
  }];


  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    clock = sandbox.useFakeTimers({shouldAdvanceTime: true});
    trackerEventListenerManager = new TrackerEventListenerManager(domainClient);
    getEventStub = sandbox.stub(domainClient, 'requestApi');
    getEventStub
      .callsFake(async (opts) => {
        await new Promise(res => setTimeout(res, 1000));
        return [];
      })
      .withArgs({
        url: '/users/current/tracker-events/stream',
        method: 'GET',
        qs: {
          previousSequenceNumber: 1,
          accountId: 'accountId',
          trackerId: 'trackerId',
          limit: 1000
        }
      })
      .callsFake(async (opts) => {
        await new Promise(res => setTimeout(res, 1000));
        return expected;
      })
      .withArgs({
        url: '/users/current/tracker-events/stream',
        method: 'GET',
        qs: {
          previousSequenceNumber: 1,
          accountId: 'accountId',
          trackerId: 'trackerId2',
          limit: 1000
        }
      })
      .callsFake(async (opts) => {
        await new Promise(res => setTimeout(res, 1000));
        return expected;
      })
      .withArgs({
        url: '/users/current/tracker-events/stream',
        method: 'GET',
        qs: {
          previousSequenceNumber: 3,
          accountId: 'accountId',
          trackerId: 'trackerId',
          limit: 1000
        }
      }).callsFake(async (opts) => {
        await new Promise(res => setTimeout(res, 1000));
        return expected2;
      });

    callStub = sinon.stub();
    errorStub = sinon.stub();

    class Listener extends TrackerEventListener {

      async onTrackerEvent(trackerEvent) {
        callStub(trackerEvent);
      }

      async onError(error) {
        errorStub(error);
      }

    }

    listener = new Listener('accountId', 'trackerId');
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
  });

  /**
   * @test {TrackerEventListenerManager#addTrackerEventListener}
   */
  it('should add tracker event listener', async () => {
    const id = trackerEventListenerManager.addTrackerEventListener(listener, 'accountId', 'trackerId', 1);
    await clock.tickAsync(2200);
    sinon.assert.callCount(callStub, 4);
    callStub.args[0][0].should.equal(expected[0]);
    callStub.args[1][0].should.equal(expected[1]);
    callStub.args[2][0].should.equal(expected2[0]);
    callStub.args[3][0].should.equal(expected2[1]);
    trackerEventListenerManager.removeTrackerEventListener(id);
  });

  /**
   * @test {TrackerEventListenerManager#addTrackerEventListener}
   */
  it('should add multiple tracker event listeners', async () => {
    let callStub2 = sinon.stub();
    let errorStub2 = sinon.stub();
    let callStub3 = sinon.stub();
    let errorStub3 = sinon.stub();

    class Listener2 extends TrackerEventListener {

      async onTrackerEvent(trackerEvent) {
        callStub2(trackerEvent);
      }

      async onError(error) {
        errorStub2(error);
      }

    }

    class Listener3 extends TrackerEventListener {

      async onTrackerEvent(trackerEvent) {
        callStub3(trackerEvent);
      }

      async onError(error) {
        errorStub3(error);
      }

    }

    const listener2 = new Listener2('accountId', 'trackerId2');
    const listener3 = new Listener3('accountId', 'trackerId');
    const id = trackerEventListenerManager.addTrackerEventListener(listener, 'accountId', 'trackerId', 1);
    const id2 = trackerEventListenerManager.addTrackerEventListener(listener2, 'accountId', 'trackerId2', 1);
    const id3 = trackerEventListenerManager.addTrackerEventListener(listener3, 'accountId', 'trackerId', 1);
    await clock.tickAsync(2200);
    sinon.assert.callCount(callStub, 4);
    sinon.assert.callCount(callStub2, 2);
    sinon.assert.callCount(callStub3, 4);
    callStub.args[0][0].should.equal(expected[0]);
    callStub.args[1][0].should.equal(expected[1]);
    callStub.args[2][0].should.equal(expected2[0]);
    callStub.args[3][0].should.equal(expected2[1]);
    trackerEventListenerManager.removeTrackerEventListener(id);
    trackerEventListenerManager.removeTrackerEventListener(id2);
    trackerEventListenerManager.removeTrackerEventListener(id3);
  });

  /**
   * @test {TrackerEventListenerManager#addTrackerEventListener}
   */
  it('should remove tracker event listener', async () => {
    const id = trackerEventListenerManager.addTrackerEventListener(listener, 'accountId', 'trackerId', 1);
    await clock.tickAsync(800);
    trackerEventListenerManager.removeTrackerEventListener(id);
    await clock.tickAsync(2200);
    sinon.assert.calledWith(callStub, expected[0]);
    sinon.assert.calledWith(callStub, expected[1]);
    sinon.assert.callCount(callStub, 2);
  });

  /**
   * @test {TrackerEventListenerManager#addTrackerEventListener}
   */
  it('should wait if error returned', async () => {
    const error = new Error('test');
    const error2 = new Error('test');
    getEventStub
      .callsFake(async (opts) => {
        await new Promise(res => setTimeout(res, 500));
        return [];
      })
      .withArgs({
        url: '/users/current/tracker-events/stream',
        method: 'GET',
        qs: {
          previousSequenceNumber: 1,
          accountId: 'accountId',
          trackerId: 'trackerId',
          limit: 1000
        }
      }).callsFake(async (opts) => {
        await new Promise(res => setTimeout(res, 500));
        return expected;
      })
      .onFirstCall().rejects(error)
      .onSecondCall().rejects(error2);
    const id = trackerEventListenerManager.addTrackerEventListener(listener, 'accountId', 'trackerId', 1);
    await clock.tickAsync(600);
    sinon.assert.callCount(getEventStub, 1);
    sinon.assert.notCalled(callStub);
    sinon.assert.calledOnce(errorStub);
    sinon.assert.calledWith(errorStub, error);
    await clock.tickAsync(600);
    sinon.assert.callCount(getEventStub, 2);
    sinon.assert.notCalled(callStub);
    sinon.assert.calledTwice(errorStub);
    sinon.assert.calledWith(errorStub, error2);
    await clock.tickAsync(2000);
    sinon.assert.callCount(getEventStub, 3);
    sinon.assert.notCalled(callStub);
    await clock.tickAsync(800);
    sinon.assert.calledWith(callStub, expected[0]);
    sinon.assert.calledWith(callStub, expected[1]);
    trackerEventListenerManager.removeTrackerEventListener(id);
  });

});
