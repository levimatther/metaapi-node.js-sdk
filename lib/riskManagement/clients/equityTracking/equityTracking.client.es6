'use strict';

import TrackerEventListenerManager from './trackerEventListenerManager';
import PeriodStatisticsStreamManager from './periodStatisticsStreamManager';
import EquityChartStreamManager from './equityChartStreamManager';
import EquityBalanceStreamManager from './equityBalanceStreamManager';
import moment from 'moment';

/**
 * metaapi.cloud RiskManagement equity tracking API client (see https://metaapi.cloud/docs/risk-management/)
 */
export default class EquityTrackingClient {

  /**
   * Constructs RiskManagement equity tracking API client instance
   * @param {DomainClient} domainClient domain client
   * @param {MetaApi} metaApi metaApi SDK instance
   */
  constructor(domainClient, metaApi) {
    this._domainClient = domainClient;
    this._trackerEventListenerManager = new TrackerEventListenerManager(domainClient);
    this._equityBalanceStreamManager = new EquityBalanceStreamManager(domainClient, metaApi);
    this._periodStatisticsStreamManager = new PeriodStatisticsStreamManager(domainClient, this, metaApi);
    this._equityChartStreamManager = new EquityChartStreamManager(domainClient, this, metaApi); 
  }

  /**
   * Tracker configuration update
   * @typedef {Object} TrackerUpdate
   * @property {String} name unique tracker name
   */

  /**
   * Period length to track profit and drawdown for
   * @typedef {'day' | 'date' | 'week' | 'week-to-date' | 'month' | 'month-to-date' | 'quarter' | 'quarter-to-date' |
   * 'year' | 'year-to-date' | 'lifetime'} Period
   */

  /**
   * New tracker configuration
   * @typedef {TrackerUpdate} NewTracker
   * @property {String} [startBrokerTime] time to start tracking from in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {String} [endBrokerTime] time to end tracking at in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {Period} period period to track profit and drawdown for
   * @property {Number} [relativeDrawdownThreshold] relative drawdown threshold after which tracker event is generated,
   * a fraction of 1
   * @property {Number} [absoluteDrawdownThreshold] absolute drawdown threshold after which tracker event is generated,
   * should be greater than 0
   * @property {Number} [relativeProfitThreshold] relative profit threshold after which tracker event is generated,
   * a fraction of 1
   * @property {Number} [absoluteProfitThreshold] absolute profit threshold after which tracker event is generated,
   * should be greater than 0
   */

  /**
   * Tracker id
   * @typedef {Object} TrackerId
   * @property {String} id unique tracker id
   */

  /**
   * Creates a profit/drawdown tracker. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/createTracker/
   * @param {String} accountId id of the MetaApi account
   * @param {NewTracker} tracker profit/drawdown tracker
   * @return {Promise<TrackerId>} promise resolving with profit/drawdown tracker id
   */
  createTracker(accountId, tracker) {
    return this._domainClient.requestApi({
      url: `/users/current/accounts/${accountId}/trackers`,
      method: 'POST',
      body: tracker
    });
  }

  /**
   * Tracker configuration
   * @typedef {NewTracker} Tracker
   * @property {String} _id unique tracker id
   */

  /**
   * Returns trackers defined for an account. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/getTrackers/
   * @param {String} accountId id of the MetaApi account
   * @return {Promise<Tracker[]>} promise resolving with trackers
   */
  getTrackers(accountId) {
    return this._domainClient.requestApi({
      url: `/users/current/accounts/${accountId}/trackers`,
      method: 'GET'
    });
  }

  /**
   * Returns profit/drawdown tracker by account and id. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/getTracker/
   * @param {string} accountId id of the MetaApi account 
   * @param {string} id tracker id 
   * @returns {Promise<Tracker>} promise resolving with profit/drawdown tracker found
   */
  getTracker(accountId, id) {
    return this._domainClient.requestApi({
      url: `/users/current/accounts/${accountId}/trackers/${id}`,
      method: 'GET'
    });
  }

  /**
   * Returns profit/drawdown tracker by account and name
   * @param {string} accountId id of the MetaApi account 
   * @param {string} name tracker name 
   * @returns {Promise<Tracker>} promise resolving with profit/drawdown tracker found
   */
  getTrackerByName(accountId, name) {
    return this._domainClient.requestApi({
      url: `/users/current/accounts/${accountId}/trackers/name/${encodeURIComponent(name)}`,
      method: 'GET'
    });
  }

  /**
   * Updates profit/drawdown tracker. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/updateTracker/
   * @param {String} accountId id of the MetaApi account
   * @param {String} id id of the tracker
   * @param {TrackerUpdate} update tracker update
   * @return {Promise} promise resolving when profit/drawdown tracker updated
   */
  updateTracker(accountId, id, update) {
    return this._domainClient.requestApi({
      url: `/users/current/accounts/${accountId}/trackers/${id}`,
      method: 'PUT',
      body: update
    });
  }

  /**
   * Removes profit/drawdown tracker. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/removeTracker/
   * @param {String} accountId id of the MetaApi account
   * @param {String} id id of the tracker
   * @return {Promise} promise resolving when profit/drawdown tracker removed
   */
  deleteTracker(accountId, id) {
    return this._domainClient.requestApi({
      url: `/users/current/accounts/${accountId}/trackers/${id}`,
      method: 'DELETE'
    });
  }

  /**
   * Type of the exceeded threshold
   * @typedef {'profit' | 'drawdown'} ExceededThresholdType
   */

  /**
   * Profit/drawdown threshold exceeded event model
   * @typedef {Object} TrackerEvent
   * @property {Number} sequenceNumber event unique sequence number
   * @property {String} accountId MetaApi account id
   * @property {String} trackerId profit/drawdown tracker id
   * @property {String} startBrokerTime profit/drawdown tracking period start time in broker timezone,
   * in YYYY-MM-DD HH:mm:ss.SSS format
   * @property {String} [endBrokerTime] profit/drawdown tracking period end time in broker timezone,
   * in YYYY-MM-DD HH:mm:ss.SSS format
   * @property {Period} period profit/drawdown tracking period
   * @property {String} brokerTime profit/drawdown threshold exceeded event time in broker timezone,
   * in YYY-MM-DD HH:mm:ss.SSS format
   * @property {Number} absoluteDrawdown absolute drawdown value which was observed when the profit or drawdown
   * threshold was exceeded
   * @property {Number} relativeDrawdown relative drawdown value which was observed when the profit or drawdown
   * threshold was exceeded
   * @property {Number} absoluteProfit absolute profit value which was observed when the profit or drawdown
   * threshold was exceeded
   * @property {Number} relativeProfit relative profit value which was observed when the profit or drawdown
   * threshold was exceeded
   * @property {ExceededThresholdType} exceededThresholdType type of the exceeded threshold
   */

  /**
   * Returns tracker events by broker time range. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/getTrackerEvents/
   * @param {String} [startBrokerTime] value of the event time in broker timezone to start loading data from, inclusive,
   * in 'YYYY-MM-DD HH:mm:ss.SSS format
   * @param {String} [endBrokerTime] value of the event time in broker timezone to end loading data at, inclusive,
   * in 'YYYY-MM-DD HH:mm:ss.SSS format
   * @param {String} [accountId] id of the MetaApi account
   * @param {String} [trackerId] id of the tracker
   * @param {Number} [limit] pagination limit, default is 1000
   * @return {Promise<TrackerEvent[]>} promise resolving with tracker events
   */
  getTrackerEvents(startBrokerTime, endBrokerTime, accountId, trackerId, limit) {
    return this._domainClient.requestApi({
      url: '/users/current/tracker-events/by-broker-time',
      qs: {startBrokerTime, endBrokerTime, accountId, trackerId, limit},
      method: 'GET'
    });
  }

  /**
   * Adds a tracker event listener and creates a job to make requests
   * @param {TrackerEventListener} listener tracker event listener
   * @param {String} [accountId] account id
   * @param {String} [trackerId] tracker id
   * @param {Number} [sequenceNumber] sequence number
   * @return {String} listener id
   */
  addTrackerEventListener(listener, accountId, trackerId, sequenceNumber) {
    return this._trackerEventListenerManager.addTrackerEventListener(listener, accountId, trackerId, sequenceNumber);
  }

  /**
   * Removes tracker event listener and cancels the event stream
   * @param {String} listenerId tracker event listener id
   */
  removeTrackerEventListener(listenerId) {
    this._trackerEventListenerManager.removeTrackerEventListener(listenerId);
  }

  /**
   * Period statistics
   * @typedef {Object} PeriodStatistics
   * @property {String} startBrokerTime period start time in broker timezone, in YYYY-MM-DD HH:mm:ss format
   * @property {String} [endBrokerTime] period end time in broker timezone, in YYYY-MM-DD HH:mm:ss format
   * @property {Period} period period length
   * @property {Number} initialBalance balance at period start time
   * @property {String} [maxDrawdownTime] time max drawdown was observed at in broker timezone,
   * in YYYY-MM-DD HH:mm:ss format
   * @property {Number} [maxAbsoluteDrawdown] the value of maximum absolute drawdown observed
   * @property {Number} [maxRelativeDrawdown] the value of maximum relative drawdown observed
   * @property {String} [maxProfitTime] time max profit was observed at in broker timezone,
   * in YYYY-MM-DD HH:mm:ss format
   * @property {Number} [maxAbsoluteProfit] the value of maximum absolute profit observed
   * @property {Number} [maxRelativeProfit] the value of maximum relative profit observed
   * @property {Boolean} thresholdExceeded the flag indicating that max allowed total drawdown was exceeded
   * @property {ExceededThresholdType} exceededThresholdType type of the exceeded threshold
   * @property {Number} [balanceAdjustment] balance adjustment applied to equity for tracking drawdown/profit
   * @property {Number} [tradeDayCount] count of days when trades were performed during the period
   */

  /**
   * Returns account profit and drawdown tracking statistics by tracker id. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/getTrackingStats/
   * @param {String} accountId id of MetaAPI account
   * @param {String} trackerId id of the tracker
   * @param {String} [startTime] time to start loading stats from, default is current time. Note that stats is loaded in
   * backwards direction
   * @param {Number} [limit] number of records to load, default is 1
   * @param {Boolean} [realTime] if true, real-time data will be requested
   * @return {Promise<PeriodStatistics[]>} promise resolving with profit and drawdown statistics
   */
  getTrackingStatistics(accountId, trackerId, startTime, limit, realTime = false) {
    return this._domainClient.requestApi({
      url: `/users/current/accounts/${accountId}/trackers/${trackerId}/statistics`,
      qs: {startTime, limit, realTime},
      method: 'GET'
    });
  }

  /**
   * Adds a period statistics event listener
   * @param {PeriodStatisticsListener} listener period statistics event listener
   * @param {String} accountId account id
   * @param {String} trackerId tracker id
   * @returns {String} listener id
   */
  addPeriodStatisticsListener(listener, accountId, trackerId) {
    return this._periodStatisticsStreamManager.addPeriodStatisticsListener(listener, accountId, trackerId);
  }

  /**
   * Removes period statistics event listener by id
   * @param {String} listenerId listener id 
   */
  removePeriodStatisticsListener(listenerId) {
    this._periodStatisticsStreamManager.removePeriodStatisticsListener(listenerId);
  }

  /**
   * Equity chart item
   * @typedef {Object} EquityChartItem
   * @property {String} startBrokerTime start time of a chart item as per broker timezone, in YYYY-MM-DD HH:mm:ss format
   * @property {String} endBrokerTime end time of a chart item as per broker timezone, in YYYY-MM-DD HH:mm:ss format
   * @property {Number} averageBalance average balance value during the period
   * @property {Number} minBalance minimum balance value during the period
   * @property {Number} maxBalance maximum balance value during the period
   * @property {Number} averageEquity average equity value during the period
   * @property {Number} minEquity minimum equity value during the period
   * @property {Number} maxEquity maximum equity value during the period
   * @property {Number} startBalance starting balance value observed during the period
   * @property {Number} startEquity starting equity value observed during the period
   * @property {Number} lastBalance last balance value observed during the period
   * @property {Number} lastEquity last equity value observed during the period
   */

  /**
   * Returns equity chart by account id. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/getEquityChart/
   * @param {String} accountId metaApi account id
   * @param {String} [startTime] starting broker time in YYYY-MM-DD HH:mm:ss format
   * @param {String} [endTime] ending broker time in YYYY-MM-DD HH:mm:ss format
   * @param {Boolean} [realTime] if true, real-time data will be requested
   * @param {Boolean} [fillSkips] if true, skipped records will be automatically filled based on existing ones
   * @return {Promise<EquityChartItem[]>} promise resolving with equity chart
   */
  async getEquityChart(accountId, startTime, endTime, realTime = false, fillSkips = false) {
    const records = await this._domainClient.requestApi({
      url: `/users/current/accounts/${accountId}/equity-chart`,
      qs: {startTime, endTime, realTime},
      method: 'GET'
    });
    if(fillSkips){
      let i = 0;
      while(i < records.length - 1) {
        const timeDiff = new Date(records[i + 1].startBrokerTime).getTime() - 
           new Date(records[i].startBrokerTime).getTime();
        if(timeDiff > 60 * 60 * 1000 && records[i].lastBalance !== undefined) {
          const recordCopy = JSON.parse(JSON.stringify(records[i]));
          recordCopy.minEquity = recordCopy.lastEquity;
          recordCopy.maxEquity = recordCopy.lastEquity;
          recordCopy.averageEquity = recordCopy.lastEquity;
          recordCopy.minBalance = recordCopy.lastBalance;
          recordCopy.maxBalance = recordCopy.lastBalance;
          recordCopy.averageBalance = recordCopy.lastBalance;
          const startBrokerTime = new Date(recordCopy.startBrokerTime);
          startBrokerTime.setUTCHours(startBrokerTime.getUTCHours() + 1);
          startBrokerTime.setUTCMinutes(0);
          startBrokerTime.setUTCSeconds(0);
          startBrokerTime.setUTCMilliseconds(0);
          recordCopy.startBrokerTime = moment(startBrokerTime).format('YYYY-MM-DD HH:mm:ss.SSS');
          startBrokerTime.setUTCHours(startBrokerTime.getUTCHours() + 1);
          startBrokerTime.setUTCMilliseconds(-1);
          recordCopy.endBrokerTime = moment(startBrokerTime).format('YYYY-MM-DD HH:mm:ss.SSS');
          recordCopy.brokerTime = recordCopy.endBrokerTime;
          records.splice(i + 1, 0, recordCopy);
        }
        i++;
      }  
    }
    return records;
  }

  /**
   * Adds an equity chart event listener
   * @param {EquityChartListener} listener equity chart event listener
   * @param {String} accountId account id
   * @param {Date} [startTime] date to start tracking from
   * @returns {String} listener id
   */
  addEquityChartListener(listener, accountId, startTime) {
    return this._equityChartStreamManager.addEquityChartListener(listener, accountId, startTime);
  }

  /**
   * Removes equity chart event listener by id
   * @param {String} listenerId equity chart listener id 
   */
  removeEquityChartListener(listenerId) {
    this._equityChartStreamManager.removeEquityChartListener(listenerId);
  }

  /**
   * Adds an equity balance event listener
   * @param {EquityBalanceListener} listener equity balance event listener
   * @param {String} accountId account id
   * @returns {String} listener id
   */
  addEquityBalanceListener(listener, accountId) {
    return this._equityBalanceStreamManager.addEquityBalanceListener(listener, accountId);
  }

  /**
   * Removes equity balance event listener by id
   * @param {String} listenerId equity balance listener id 
   */
  removeEquityBalanceListener(listenerId) {
    this._equityBalanceStreamManager.removeEquityBalanceListener(listenerId);
  }

}
