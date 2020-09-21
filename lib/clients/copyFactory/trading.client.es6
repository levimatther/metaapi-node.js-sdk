'use strict';

import MetaApiClient from '../metaApi.client';
import randomstring from 'randomstring';

/**
 * metaapi.cloud CopyFactory trading API (trade copying trading API) client (see
 * https://trading-api-v1.project-stock.agiliumlabs.cloud/swagger/#/)
 */
export default class TradingClient extends MetaApiClient {

  /**
   * Constructs CopyFactory trading API client instance
   * @param {HttpClient} httpClient HTTP client
   * @param {String} token authorization token
   * @param {String} domain domain to connect to, default is agiliumtrade.agiliumtrade.ai
   */
  constructor(httpClient, token, domain = 'agiliumtrade.agiliumtrade.ai') {
    super(httpClient, token, domain);
    this._host = `https://trading-api-v1.${domain}`;
  }

  /**
   * Resynchronizes the account. See
   * https://trading-api-v1.agiliumtrade.agiliumtrade.ai/swagger/#!/default/post_users_current_accounts_accountId_resynchronize
   * @param {String} accountId account id
   * @param {Array<String>} strategyIds optional array of strategy ids to recynchronize. Default is to synchronize all
   * strategies
   * @return {Promise} promise which resolves when resynchronization is scheduled
   */
  async resynchronize(accountId, strategyIds) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('resynchronize');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/resynchronize`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      qs: {
        strategyId: strategyIds
      },
      json: true
    };
    return this._httpClient.request(opts);
  }

  /**
   * CopyFactory strategy stopout
   * @typedef {Object} CopyFactoryStrategyStopout
   * @property {CopyFactoryStrategyIdAndName} strategy strategy which was stopped out
   * @property {String} reason stopout reason. One of yearly-balance, monthly-balance, daily-balance, yearly-equity,
   * monthly-equity, daily-equity, max-drawdown
   * @property {String} reasonDescription human-readable description of the stopout reason
   * @property {Date} stoppedAt time the strategy was stopped at
   * @property {Date} stoppedTill time the strategy is stopped till
   */

  /**
   * Returns subscriber account stopouts. See
   * https://trading-api-v1.agiliumtrade.agiliumtrade.ai/swagger/#!/default/get_users_current_accounts_accountId_stopouts
   * @param {String} accountId account id
   * @return {Promise<Array<CopyFactoryStrategyStopout>>} promise which resolves with stopouts found
   */
  async getStopouts(accountId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('getStopouts');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/stopouts`,
      method: 'GET',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts);
  }

  /**
   * Resets account stopout. See
   * https://trading-api-v1.agiliumtrade.agiliumtrade.ai/swagger/#!/default/post_users_current_accounts_accountId_stopouts_reason_reset
   * @param {String} accountId account id
   * @param {String} reason stopout reason to reset. One of yearly-balance, monthly-balance, daily-balance,
   * yearly-equity, monthly-equity, daily-equity, max-drawdown
   * @return {Promise} promise which resolves when the stopout is reset
   */
  async resetStopout(accountId, reason) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('resetStopout');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/stopouts/${reason}/reset`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts);
  }

}
