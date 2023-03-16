import DomainClient from '../domain.client';
import PeriodStatisticsListener from './periodStatisticsListener';
import EquityTrackingClient from './equityTracking.client';
import MetaApi from '../../../metaApi/metaApi';

/**
 * Manager for handling period statistics event listeners
 */
export default class PeriodStatisticsStreamManager {

  /**
   * Constructs period statistics event listener manager instance
   * @param {DomainClient} domainClient domain client
   * @param {EquityTrackingClient} equityTrackingClient equity tracking client
   * @param {MetaApi} metaApi metaApi SDK instance
   */
  constructor(domainClient: DomainClient, equityTrackingClient: EquityTrackingClient, metaApi: MetaApi);

  /**
   * Returns listeners for account
   * @param {string} accountId account id to return listeners for
   * @returns {{[listenerId: string]: PeriodStatisticsListener}} dictionary of period statistics listeners
   */
  getTrackerListeners(accountId: string, trackerId: string): {[listenerId: string]: PeriodStatisticsListener};

  /**
   * Adds a period statistics event listener
   * @param {PeriodStatisticsListener} listener 
   * @param {string} accountId account id
   * @param {string} trackerId tracker id
   * @returns {string} listener id
   */
  addPeriodStatisticsListener(listener: PeriodStatisticsListener, accountId: string, trackerId: string): Promise<string>;

  /**
   * Removes period statistics event listener by id
   * @param {string} listenerId listener id 
   */
  removePeriodStatisticsListener(listenerId: string): void;

}
