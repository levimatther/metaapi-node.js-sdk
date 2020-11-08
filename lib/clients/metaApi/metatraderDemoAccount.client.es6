'use strict';

import MetaApiClient from '../metaApi.client';

/**
 * metaapi.cloud MetaTrader demo account API client
 */
export default class MetatraderDemoAccountClient extends MetaApiClient {

  /**
   * New MetaTrader 4 demo account model
   * @typedef {Object} NewMT4DemoAccount
   * @property {String} [accountType] account type
   * @property {String} [address] account holder's address
   * @property {Number} balance account balance
   * @property {String} [city] account holder's city
   * @property {String} [country] account holder's country
   * @property {String} email account holder's email
   * @property {Number} leverage account leverage
   * @property {String} [name] account holder's name
   * @property {String} [phone] account holder's phone
   * @property {String} serverName server name
   * @property {String} [state] account holder's state
   * @property {String} [zip] zip address
   */

  /**
   * New MetaTrader 5 demo account model
   * @typedef {Object} NewMT5DemoAccount
   * @property {String} [address] account holder's address
   * @property {Number} balance account balance
   * @property {String} [city] account holder's city
   * @property {String} [country] account holder's country
   * @property {String} email account holder's email
   * @property {Number} [languageId] language id (default is 1)
   * @property {Number} leverage account leverage
   * @property {String} [name] account holder's name
   * @property {String} [phone] account holder's phone
   * @property {String} serverName server name
   * @property {String} [state] account holder's state
   * @property {String} [zip] zip address
   */

  /**
   * MetaTrader demo account model
   * @typedef {Object} MetatraderDemoAccountDto
   * @property {String} login account login
   * @property {String} password account password
   * @property {String} serverName MetaTrader server name
   * @property {String} investorPassword account investor (read-only) password
   */

  /**
   * Creates new MetaTrader 4 demo account
   * Method is accessible only with API access token
   * @param {String} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT4DemoAccount} account demo account to create
   * @return {Promise<MetatraderDemoAccountDto>} promise resolving with MetaTrader demo account created
   */
  createMT4DemoAccount(profileId, account) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createMT4DemoAccount');
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles/${profileId}/mt4-demo-accounts`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: account
    };
    return this._httpClient.request(opts);
  }

  /**
   * Creates new MetaTrader 5 demo account
   * Method is accessible only with API access token
   * @param {String} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT5DemoAccount} account demo account to create
   * @return {Promise<MetatraderDemoAccountDto>} promise resolving with MetaTrader demo account created
   */
  createMT5DemoAccount(profileId, account) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createMT5DemoAccount');
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles/${profileId}/mt5-demo-accounts`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: account
    };
    return this._httpClient.request(opts);
  }

}
