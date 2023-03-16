import DomainClient from '../domain.client';
import EquityChartListener from './equityChartListener';
import EquityTrackingClient from './equityTracking.client';
import MetaApi from '../../../metaApi/metaApi';

/**
 * Manager for handling equity chart event listeners
 */
export default class EquityChartStreamManager {

  /**
   * Constructs tracker event listener manager instance
   * @param {DomainClient} domainClient domain client
   * @param {EquityTrackingClient} equityTrackingClient equity tracking client
   * @param {MetaApi} metaApi metaApi SDK instance
   */
  constructor(domainClient: DomainClient, equityTrackingClient: EquityTrackingClient, metaApi: MetaApi);

  /**
   * Returns listeners for account
   * @param {String} accountId account id to return listeners for
   * @returns {{[listenerId: string]: EquityChartListener}} dictionary of account equity chart event listeners
   */
  getAccountListeners(accountId: string): {[listenerId: string]: EquityChartListener};

  /**
   * Adds an equity chart event listener
   * @param {EquityChartListener} listener 
   * @param {string} accountId account id
   * @param {Date} startTime date to start tracking from
   * @returns {Promise<string>} listener id
   */
  addEquityChartListener(listener: EquityChartListener, accountId: string, startTime: Date): Promise<string>;

  /**
   * Removes equity chart event listener by id
   * @param {string} listenerId listener id 
   */
  removeEquityChartListener(listenerId: string): void;

}
