import DomainClient from '../domain.client';
import EquityBalanceListener from './equityBalanceListener';
import MetaApi from '../../../metaApi/metaApi';

/**
 * Manager for handling equity balance event listeners
 */
export default class EquityChartStreamManager {

  /**
   * Constructs equity balance event listener manager instance
   * @param {DomainClient} domainClient domain client
   * @param {MetaApi} metaApi metaApi SDK instance
   */
  constructor(domainClient: DomainClient, metaApi: MetaApi);

  /**
   * Returns listeners for account
   * @param {string} accountId account id to return listeners for
   * @returns {{[listenerId: string]: EquityBalanceListener}} dictionary of account equity balance event listeners
   */
  getAccountListeners(accountId: string): {[listenerId: string]: EquityBalanceListener};

  /**
   * Adds an equity balance event listener
   * @param {EquityBalanceListener} listener 
   * @param {string} accountId account id
   * @returns {Promise<string>} listener id
   */
  addEquityBalanceListener(listener: EquityBalanceListener, accountId: string): Promise<string>;

  /**
   * Removes equity balance event listener by id
   * @param {String} listenerId listener id
   */
  removeEquityBalanceListener(listenerId: string): void;

}
