'use strict';

import HttpClient from '../clients/httpClient';
import ConfigurationClient from '../clients/copyFactory/configuration.client';
import HistoryClient from '../clients/copyFactory/history.client';
import TradingClient from '../clients/copyFactory/trading.client';

/**
 * MetaApi CopyFactory copy trading API SDK
 */
export default class CopyFactory {

  /**
   * Constructs CopyFactory class instance
   * @param {String} token authorization token
   * @param {String} domain domain to connect to
   * @param {Number} requestTimeout timeout for http requests in seconds
   */
  constructor(token, domain = 'agiliumtrade.agiliumtrade.ai', requestTimeout = 60) {
    let httpClient = new HttpClient(requestTimeout);
    this._configurationClient = new ConfigurationClient(httpClient, token, domain);
    this._historyClient = new HistoryClient(httpClient, token, domain);
    this._tradingClient = new TradingClient(httpClient, token, domain);
  }

  /**
   * Returns CopyFactory configuration API
   * @returns {ConfigurationClient} configuration API
   */
  get configurationApi() {
    return this._configurationClient;
  }

  /**
   * Returns CopyFactory history API
   * @return {HistoryClient} history API
   */
  get historyApi() {
    return this._historyClient;
  }

  /**
   * Returns CopyFactory trading API
   * @return {TradingClient} trading API
   */
  get tradingApi() {
    return this._tradingClient;
  }

}
