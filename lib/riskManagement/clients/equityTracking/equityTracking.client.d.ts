import DomainClient from '../domain.client';
import TrackerEventListener from './trackerEventListener';
import PeriodStatisticsListener from './periodStatisticsListener';
import EquityChartListener from './equityChartListener';
import EquityBalanceListener from './equityBalanceListener';
import MetaApi from '../../../metaApi/metaApi';

/**
 * metaapi.cloud RiskManagement equity tracking API client (see https://metaapi.cloud/docs/risk-management/)
 */
export default class EquityTrackingClient {

  /**
   * Constructs RiskManagement equity tracking API client instance
   * @param {DomainClient} domainClient domain client
   * @param {MetaApi} metaApi metaApi SDK instance
   */
  constructor(domainClient: DomainClient, metaApi: MetaApi); 

  /**
   * Creates a profit/drawdown tracker. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/createTracker/
   * @param {string} accountId id of the MetaApi account
   * @param {NewTracker} tracker profit/drawdown tracker
   * @return {Promise<TrackerId>} promise resolving with profit/drawdown tracker id
   */
  createTracker(accountId: string, tracker: NewTracker): Promise<TrackerId>;

  /**
   * Returns trackers defined for an account. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/getTrackers/
   * @param {string} accountId id of the MetaApi account
   * @return {Promise<Tracker[]>} promise resolving with trackers
   */
  getTrackers(accountId: string): Promise<Tracker[]>;

  /**
   * Returns profit/drawdown tracker by account and id. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/getTracker/
   * @param {string} accountId id of the MetaApi account 
   * @param {string} id tracker id 
   * @returns {Promise<Tracker>} promise resolving with profit/drawdown tracker found
   */
  getTracker(accountId: string, id: string): Promise<Tracker>;

  /**
   * Returns profit/drawdown tracker by account and name
   * @param {string} accountId id of the MetaApi account 
   * @param {string} name tracker name
   * @return {Promise<Tracker>} promise resolving with profit/drawdown tracker found
   */
  getTrackerByName(accountId: string, name: string): Promise<Tracker>;

  /**
   * Updates profit/drawdown tracker. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/updateTracker/
   * @param {string} accountId id of the MetaApi account
   * @param {string} id id of the tracker
   * @param {TrackerUpdate} update tracker update
   * @return {Promise} promise resolving when profit/drawdown tracker updated
   */
  updateTracker(accountId: string, id: string, update: TrackerUpdate): Promise<void>;

  /**
   * Removes profit/drawdown tracker. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/removeTracker/
   * @param {string} accountId id of the MetaApi account
   * @param {string} id id of the tracker
   * @return {Promise} promise resolving when profit/drawdown tracker removed
   */
  deleteTracker(accountId: string, id: string): Promise<void>;

  /**
   * Returns tracker events by broker time range. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/getTrackerEvents/
   * @param {string} [startBrokerTime] value of the event time in broker timezone to start loading data from, inclusive,
   * in 'YYYY-MM-DD HH:mm:ss.SSS format
   * @param {string} [endBrokerTime] value of the event time in broker timezone to end loading data at, inclusive,
   * in 'YYYY-MM-DD HH:mm:ss.SSS format
   * @param {string} [accountId] id of the MetaApi account
   * @param {string} [trackerId] id of the tracker
   * @param {number} [limit] pagination limit, default is 1000
   * @return {Promise<TrackerEvent[]>} promise resolving with tracker events
   */
  getTrackerEvents(startBrokerTime?: string, endBrokerTime?: string, accountId?: string, trackerId?: string,
    limit?: number): Promise<TrackerEvent[]>;

  /**
   * Adds a tracker event listener and creates a job to make requests
   * @param {TrackerEventListener} listener tracker event listener
   * @param {string} [accountId] account id
   * @param {string} [trackerId] tracker id
   * @param {number} [sequencenumber] sequence number
   * @return {string} listener id
   */
  addTrackerEventListener(listener: TrackerEventListener, accountId?: string, trackerId?: string,
    sequencenumber?: string): string;

  /**
   * Removes tracker event listener and cancels the event stream
   * @param {string} listenerId tracker event listener id
   */
  removeTrackerEventListener(listenerId: string): void;

  /**
   * Returns account profit and drawdown tracking statistics by tracker id. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/getTrackingStats/
   * @param {string} accountId id of MetaAPI account
   * @param {string} trackerId id of the tracker
   * @param {string} [startTime] time to start loading stats from, default is current time. Note that stats is loaded in
   * backwards direction
   * @param {number} [limit] number of records to load, default is 1
   * @param {boolean} [realTime] if true, real-time data will be requested
   * @return {Promise<PeriodStatistics[]>} promise resolving with profit and drawdown statistics
   */
  getTrackingStatistics(accountId: string, trackerId: string, startTime?: string, limit?: number, realTime?: boolean):
    Promise<PeriodStatistics[]>

  /**
   * Adds a period statistics event listener
   * @param {PeriodStatisticsListener} listener period statistics event listener
   * @param {string} accountId account id
   * @param {string} trackerId tracker id
   * @return {Promise<string>} listener id
   */
  addPeriodStatisticsListener(listener: PeriodStatisticsListener, accountId: string, trackerId: string): Promise<string>;

  /**
   * Removes period statistics event listener by id
   * @param {string} listenerId tracker event listener id
   */
  removePeriodStatisticsListener(listenerId: string): void;

  /**
   * Returns equity chart by account id. See
   * https://metaapi.cloud/docs/risk-management/restApi/api/getEquityChart/
   * @param {string} accountId metaApi account id
   * @param {string} [startTime] starting broker time in YYYY-MM-DD HH:mm:ss format
   * @param {string} [endTime] ending broker time in YYYY-MM-DD HH:mm:ss format
   * @param {boolean} [realTime] if true, real-time data will be requested
   * @param {boolean} [fillSkips] if true, skipped records will be automatically filled based on existing ones
   * @return {Promise<EquityChartItem[]>} promise resolving with equity chart
   */
  getEquityChart(accountId: string, startTime?: string, endTime?: string, realTime?: boolean, fillSkips?: boolean): Promise<EquityChartItem[]>;

  /**
   * Adds an equity chart event listener
   * @param {EquityChartListener} listener equity chart event listener
   * @param {string} accountId account id
   * @param {Date} [startTime] date to start tracking from
   * @return {Promise<string>} listener id
   */
  addEquityChartListener(listener: EquityChartListener, accountId: string, startTime?: Date): Promise<string>;

  /**
   * Removes equity chart event listener by id
   * @param {string} listenerId equity chart listener id
   */
  removeEquityChartListener(listenerId: string): void;

  /**
   * Adds an equity balance event listener
   * @param {EquityBalanceListener} listener equity balance event listener
   * @param {String} accountId account id
   * @returns {Promise<string>} listener id
   */
  addEquityBalanceListener(listener: EquityBalanceListener, accountId: string): Promise<string>;

  /**
   * Removes equity balance event listener by id
   * @param {string} listenerId equity balance listener id 
   */
  removeEquityBalanceListener(listenerId: string): void;
}

/**
 * Tracker configuration update
 */
export declare type TrackerUpdate = {
  /**
   * unique tracker name
   */
  name: string
}

/**
 * Period length to track profit and drawdown for
 */
export declare type Period = 'day' | 'date' | 'week' | 'week-to-date' | 'month' | 'month-to-date' | 'quarter' |
    'quarter-to-date' | 'year' | 'year-to-date' | 'lifetime';

/**
 * New tracker configuration
 */
export declare type NewTracker = TrackerUpdate & {
  /**
   * time to start tracking from in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  startBrokerTime?: string,
  /**
   * time to end tracking at in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  endBrokerTime?: string,
  /**
   * period to track profit and drawdown for
   */
  period: Period,
  /**
   * relative drawdown threshold after which tracker event is generated, a fraction of 1
   */
  relativeDrawdownThreshold?: number,
  /**
   * absolute drawdown threshold after which tracker event is generated, should be greater than 0
   */
  absoluteDrawdownThreshold?: number,
  /**
   * relative profit threshold after which tracker event is generated. A fraction of 1
   */
  relativeProfitThreshold?: number,
  /**
   * absolute profit threshold after which tracker event is generated. Should be greater than 0 
   */
  absoluteProfitThreshold?: number,
}

/**
 * Tracker id
 */
export declare type TrackerId = {
  /**
   * unique tracker id
   */
  id: string
}

/**
 * Tracker configuration
 */
export declare type Tracker = NewTracker & {
  /**
   * unique tracker id
   */
  _id: string
}

/**
 * Type of the exceeded threshold
 */
export declare type ExceededThresholdType  = 'profit' | 'drawdown';

/**
 * Profit/drawdown threshold exceeded event model
 */
export declare type TrackerEvent = {
  /**
   * event unique sequence number
   */
  sequencenumber: number,
  /**
   * MetaApi account id
   */
  accountId: string,
  /**
   * profit/drawdown tracker id
   */
  trackerId: string,
  /**
   * profit/drawdown tracking period start time in broker timezone, in YYYY-MM-DD HH:mm:ss.SSS format
   */
  startBrokerTime: string,
  /**
   * profit/drawdown tracking period end time in broker timezone, in YYYY-MM-DD HH:mm:ss.SSS format
   */
  endBrokerTime?: string,
  /**
   * profit/drawdown tracking period
   */
  period: Period,
  /**
   * profit/drawdown threshold exceeded event time in broker timezone, in YYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: string,
  /**
   * absolute drawdown value which was observed when the profit or drawdown threshold was exceeded
   */
  absoluteDrawdown: number,
  /**
   * relative drawdown value which was observed when the profit or drawdown threshold was exceeded
   */
  relativeDrawdown: number,
  /**
   * absolute profit value which was observed when the profit or drawdown threshold was exceeded
   */
  absoluteProfit: number,
  /**
   * relative profit value which was observed when the profit or drawdown threshold was exceeded
   */
  relativeProfit: number,
  /**
   * type of the exceeded threshold
   */
  exceededThresholdType: ExceededThresholdType
}

/**
 * Period statistics
 */
export declare type PeriodStatistics = {
  /**
   * period start time in broker timezone, in YYYY-MM-DD HH:mm:ss format
   */
  startBrokerTime: string,
  /**
   * period end time in broker timezone, in YYYY-MM-DD HH:mm:ss format
   */
  endBrokerTime?: string,
  /**
   * period length
   */
  period: Period,
  /**
   * balance at period start time
   */
  initialBalance: number,
  /**
   * time max drawdown was observed at in broker timezone, in YYYY-MM-DD HH:mm:ss format
   */
  maxDrawdownTime?: string,
  /**
   * the value of maximum absolute drawdown observed
   */
  maxAbsoluteDrawdown?: number,
  /**
   * the value of maximum relative drawdown observed
   */
  maxRelativeDrawdown?: number,
  /**
   * time max profit was observed at in broker timezone, in YYYY-MM-DD HH:mm:ss format
   */
  maxProfitTime?: string,
  /**
   * the value of maximum absolute profit observed
   */
  maxAbsoluteProfit?: number,
  /**
   * the value of maximum relative profit observed
   */
  maxRelativeProfit?: number,
  /**
   * the flag indicating that max allowed total drawdown was exceeded
   */
  thresholdExceeded: boolean
  /**
   * type of the exceeded threshold
   */
  exceededThresholdType: ExceededThresholdType,
  /**
   * balance adjustment applied to equity for tracking drawdown/profit
   */
  balanceAdjustment?: number,
  /**
   * count of days when trades were performed during the period
   */
  tradeDayCount?: number
}

/**
 * Equity chart item
 */
export declare type EquityChartItem = {
  /**
   * start time of a chart item as per broker timezone, in YYYY-MM-DD HH:mm:ss format
   */
  startBrokerTime: string,
  /**
   * end time of a chart item as per broker timezone, in YYYY-MM-DD HH:mm:ss format
   */
  endBrokerTime: string,
  /**
   * average balance value during the period
   */
  averageBalance: number,
  /**
   * minimum balance value during the period
   */
  minBalance: number,
  /**
   * maximum balance value during the period
   */
  maxBalance: number,
  /**
   * average equity value during the period
   */
  averageEquity: number,
  /**
   * minimum equity value during the period
   */
  minEquity: number,
  /**
   * maximum equity value during the period
   */
  maxEquity: number,
  /**
   * starting balance value observed during the period 
   */
  startBalance: number,
  /**
   * starting equity value observed during the period 
   */
  startEquity: number,
  /**
   * last balance value observed during the period
   */
  lastBalance: number,
  /**
   * last equity value observed during the period
   */
  lastEquity: number
}
