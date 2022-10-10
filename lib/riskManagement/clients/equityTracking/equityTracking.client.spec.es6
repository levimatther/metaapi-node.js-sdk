'use strict';

import EquityTrackingClient from './equityTracking.client';
import TrackerEventListener from './trackerEventListener';
import PeriodStatisticsListener from './periodStatisticsListener';
import EquityChartListener from './equityChartListener';
import sinon from 'sinon';
import moment from 'moment';
import 'should';

/**
 * @test {EquityTrackingClient}
 */
describe('EquityTrackingClient', () => {

  let sandbox;
  let equityTrackingClient;
  let requestApiStub;
  let domainClient = {
    requestApi: () => {}
  };
  let metaApi = {};

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    equityTrackingClient = new EquityTrackingClient(domainClient, metaApi);
    requestApiStub = sandbox.stub(domainClient, 'requestApi');
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {EquityTrackingClient#createTracker}
   */
  it('should create a tracker', async () => {
    let expected = {id: 'trackerId'};
    let tracker = {name: 'trackerName'};
    requestApiStub.resolves(expected);
    
    let actual = await equityTrackingClient.createTracker('accountId', tracker);
    actual.should.equal(expected);
    sinon.assert.calledOnceWithExactly(domainClient.requestApi, {
      url: '/users/current/accounts/accountId/trackers',
      method: 'POST',
      body: tracker
    });
  });

  /**
   * @test {EquityTrackingClient#getTrackers}
   */
  it('should retrieve trackers', async () => {
    let expected = [{name: 'trackerName'}];
    requestApiStub.resolves(expected);

    let actual = await equityTrackingClient.getTrackers('accountId');
    actual.should.equal(expected);
    sinon.assert.calledOnceWithExactly(domainClient.requestApi, {
      url: '/users/current/accounts/accountId/trackers',
      method: 'GET'
    });
  });

  /**
   * @test {EquityTrackingClient#getDrawdownTrackerByName}
   */
  it('should retrieve tracker by name', async () => {
    let expected = {name: 'trackerName'};
    requestApiStub.resolves(expected);

    let actual = await equityTrackingClient.getTrackerByName('accountId', 'name');
    actual.should.equal(expected);
    sinon.assert.calledOnceWithExactly(domainClient.requestApi, {
      url: '/users/current/accounts/accountId/trackers/name/name',
      method: 'GET'
    });
  });

  /**
   * @test {EquityTrackingClient#updateTracker}
   */
  it('should update tracker', async () => {
    let update = {name: 'newTrackerName'};
    await equityTrackingClient.updateTracker('accountId', 'trackerId', update);
    sinon.assert.calledOnceWithExactly(domainClient.requestApi, {
      url: '/users/current/accounts/accountId/trackers/trackerId',
      method: 'PUT',
      body: update
    });
  });

  /**
   * @test {EquityTrackingClient#deleteTracker}
   */
  it('should delete tracker', async () => {
    await equityTrackingClient.deleteTracker('accountId', 'trackerId');
    sinon.assert.calledOnceWithExactly(domainClient.requestApi, {
      url: '/users/current/accounts/accountId/trackers/trackerId',
      method: 'DELETE'
    });
  });

  /**
   * @test {EquityTrackingClient#getDrawdownEvents}
   */
  it('should retrieve tracker events', async () => {
    let expected = [{
      sequenceNumber: 1,
      accountId: 'accountId',
      trackerId: 'trackerId',
      period: 'day',
      startBrokerTime: '2022-04-08 00:00:00.000',
      endBrokerTime: '2022-04-08 23:59:59.999',
      brokerTime: '2022-04-08 09:36:00.000',
      absoluteDrawdown: 250,
      relativeDrawdown: 0.25
    }];
    requestApiStub.resolves(expected);

    let actual = await equityTrackingClient.getTrackerEvents('2022-04-08 09:36:00.000', '2022-04-08 10:36:00.000',
      'accountId', 'trackerId', 100);
    actual.should.equal(expected);
    sinon.assert.calledOnceWithExactly(domainClient.requestApi, {
      url: '/users/current/tracker-events/by-broker-time',
      qs: {
        startBrokerTime: '2022-04-08 09:36:00.000',
        endBrokerTime: '2022-04-08 10:36:00.000',
        accountId: 'accountId',
        trackerId: 'trackerId',
        limit: 100
      },
      method: 'GET'
    });
  });

  /**
   * @test {EquityTrackingClient#getDrawdownStatistics}
   */
  it('should retrieve tracking statistics', async () => {
    let expected = [{
      period: 'day',
      startBrokerTime: '2022-04-08 00:00:00.000',
      endBrokerTime: '2022-04-08 23:59:59.999',
      initialBalance: 1000,
      maxDrawdownTime: '2022-04-08 09:36:00.000',
      maxAbsoluteDrawdown: 250,
      maxRelativeDrawdown: 0.25,
      thresholdExceeded: true
    }];
    requestApiStub.resolves(expected);

    let actual = await equityTrackingClient.getTrackingStatistics('accountId', 'trackerId', '2022-04-08 09:36:00.000',
      100);
    actual.should.equal(expected);
    sinon.assert.calledOnceWithExactly(domainClient.requestApi, {
      url: '/users/current/accounts/accountId/trackers/trackerId/statistics',
      qs: {startTime: '2022-04-08 09:36:00.000', limit: 100, realTime: false},
      method: 'GET'
    });
  });

  /**
   * @test {EquityTrackingClient#getEquityChart}
   */
  it('should retrieve equity chart', async () => {
    let expected = [{
      startBrokerTime: '2022-04-08 00:00:00.000',
      endBrokerTime: '2022-04-08 23:59:59.999',
      averageBalance: 1050,
      minBalance: 100,
      maxBalance: 2000,
      averageEquity: 1075,
      minEquity: 50,
      maxEquity: 2100,
      lastBalance: 500,
      lastEquity: 500
    }];
    requestApiStub.resolves(expected);

    let actual = await equityTrackingClient.getEquityChart('accountId', '2022-04-08 09:36:00.000',
      '2022-04-08 10:36:00.000');
    actual.should.equal(expected);
    sinon.assert.calledOnceWithExactly(domainClient.requestApi, {
      url: '/users/current/accounts/accountId/equity-chart',
      qs: {
        startTime: '2022-04-08 09:36:00.000',
        endTime: '2022-04-08 10:36:00.000',
        realTime: false
      },
      method: 'GET'
    });
  });

  /**
   * @test {EquityTrackingClient#getEquityChart}
   */
  it('should retrieve equity chart and fill the missing records', async () => {
    let expected = [{
      startBrokerTime: '2022-04-08 00:00:00.000',
      endBrokerTime: '2022-04-08 00:59:59.999',
      averageBalance: 1050,
      minBalance: 100,
      maxBalance: 2000,
      averageEquity: 1075,
      minEquity: 50,
      maxEquity: 2100
    }, {
      startBrokerTime: '2022-04-08 03:00:00.000',
      endBrokerTime: '2022-04-08 03:59:59.999',
      averageBalance: 1050,
      minBalance: 100,
      maxBalance: 2000,
      averageEquity: 1075,
      minEquity: 50,
      maxEquity: 2100,
      lastBalance: 500,
      lastEquity: 600
    }, {
      startBrokerTime: '2022-04-08 06:00:00.000',
      endBrokerTime: '2022-04-08 06:59:59.999',
      averageBalance: 1100,
      minBalance: 200,
      maxBalance: 1900,
      averageEquity: 1100,
      minEquity: 100,
      maxEquity: 2000,
      lastBalance: 500,
      lastEquity: 500
    }];
    requestApiStub.resolves(expected);

    let actual = await equityTrackingClient.getEquityChart('accountId', '2022-04-08 09:36:00.000',
      '2022-04-08 10:36:00.000', false, true);
    sinon.assert.match(actual, [{
      averageBalance: 1050,
      averageEquity: 1075,
      endBrokerTime: '2022-04-08 00:59:59.999',
      maxBalance: 2000,
      maxEquity: 2100,
      minBalance: 100,
      minEquity: 50,
      startBrokerTime: '2022-04-08 00:00:00.000'
    }, {
      averageBalance: 1050,
      averageEquity: 1075,
      endBrokerTime: '2022-04-08 03:59:59.999',
      lastBalance: 500,
      lastEquity: 600,
      maxBalance: 2000,
      maxEquity: 2100,
      minBalance: 100,
      minEquity: 50,
      startBrokerTime: '2022-04-08 03:00:00.000'
    }, {
      averageBalance: 500,
      averageEquity: 600,
      brokerTime: '2022-04-08 04:59:59.999',
      endBrokerTime: '2022-04-08 04:59:59.999',
      lastBalance: 500,
      lastEquity: 600,
      maxBalance: 500,
      maxEquity: 600,
      minBalance: 500,
      minEquity: 600,
      startBrokerTime: '2022-04-08 04:00:00.000'
    }, {
      averageBalance: 500,
      averageEquity: 600,
      brokerTime: '2022-04-08 05:59:59.999',
      endBrokerTime: '2022-04-08 05:59:59.999',
      lastBalance: 500,
      lastEquity: 600,
      maxBalance: 500,
      maxEquity: 600,
      minBalance: 500,
      minEquity: 600,
      startBrokerTime: '2022-04-08 05:00:00.000'
    }, {
      averageBalance: 1100,
      averageEquity: 1100,
      endBrokerTime: '2022-04-08 06:59:59.999',
      lastBalance: 500,
      lastEquity: 500,
      maxBalance: 1900,
      maxEquity: 2000,
      minBalance: 200,
      minEquity: 100,
      startBrokerTime: '2022-04-08 06:00:00.000'
    }]);
    sinon.assert.calledOnceWithExactly(domainClient.requestApi, {
      url: '/users/current/accounts/accountId/equity-chart',
      qs: {
        startTime: '2022-04-08 09:36:00.000',
        endTime: '2022-04-08 10:36:00.000',
        realTime: false
      },
      method: 'GET'
    });
  });

  /**
   * @test {EquityTrackingClient#addTrackerEventListener}
   * @test {EquityTrackingClient#removeTrackerEventListener}
   */
  describe('trackerEventListener', () => {

    let listener;

    beforeEach(() => {

      class Listener extends TrackerEventListener {
        async onDrawdown(drawdownEvents) {}
      }

      listener = new Listener();
    });

    /**
     * @test {EquityTrackingClient#addTrackerEventListener}
     */
    it('should add tracker event listener', async () => {
      const callStub = sandbox.stub(equityTrackingClient._trackerEventListenerManager, 'addTrackerEventListener');
      equityTrackingClient.addTrackerEventListener(listener, 'accountId', 'trackerId', 1);
      sinon.assert.calledWith(callStub, listener, 'accountId', 'trackerId', 1);
    });

    /**
     * @test {EquityTrackingClient#removeTrackerEventListener}
     */
    it('should remove tracker event listener', async () => {
      const callStub = sandbox.stub(equityTrackingClient._trackerEventListenerManager, 'removeTrackerEventListener');
      equityTrackingClient.removeTrackerEventListener('id');
      sinon.assert.calledWith(callStub);
    });

  });

  /**
   * @test {EquityTrackingClient#addPeriodStatisticsListener}
   * @test {EquityTrackingClient#removePeriodStatisticsListener}
   */
  describe('periodStatisticsListener', () => {

    let listener;

    beforeEach(() => {

      class Listener extends PeriodStatisticsListener {
        async onPeriodStatisticsEvent(periodStatisticsEvent) {}
      }

      listener = new Listener();
    });

    /**
     * @test {EquityTrackingClient#addPeriodStatisticsListener}
     */
    it('should add period statistics event listener', async () => {
      const callStub = sandbox.stub(equityTrackingClient._periodStatisticsStreamManager, 'addPeriodStatisticsListener');
      equityTrackingClient.addPeriodStatisticsListener(listener, 'accountId', 'trackerId');
      sinon.assert.calledWith(callStub, listener, 'accountId', 'trackerId');
    });

    /**
     * @test {EquityTrackingClient#removePeriodStatisticsListener}
     */
    it('should remove period statistics event listener', async () => {
      const callStub = sandbox.stub(equityTrackingClient._periodStatisticsStreamManager,
        'removePeriodStatisticsListener');
      equityTrackingClient.removePeriodStatisticsListener('id');
      sinon.assert.calledWith(callStub);
    });

  });

  /**
   * @test {EquityTrackingClient#addEquityChartListener}
   * @test {EquityTrackingClient#removeEquityChartListener}
   */
  describe('equityChartListener', () => {

    let listener;

    beforeEach(() => {

      class Listener extends EquityChartListener {
        async onEquityChartEvent(equityChartEvent) {}
      }

      listener = new Listener();
    });

    /**
     * @test {EquityTrackingClient#addEquityChartListener}
     */
    it('should add equity chart event listener', async () => {
      const callStub = sandbox.stub(equityTrackingClient._equityChartStreamManager, 'addEquityChartListener');
      equityTrackingClient.addEquityChartListener(listener, 'accountId', '2022-04-08 09:36:00.000');
      sinon.assert.calledWith(callStub, listener, 'accountId', '2022-04-08 09:36:00.000');
    });

    /**
     * @test {EquityTrackingClient#removeEquityChartListener}
     */
    it('should remove equity chart event listener', async () => {
      const callStub = sandbox.stub(equityTrackingClient._equityChartStreamManager,
        'removeEquityChartListener');
      equityTrackingClient.removeEquityChartListener('id');
      sinon.assert.calledWith(callStub);
    });

  });

});
