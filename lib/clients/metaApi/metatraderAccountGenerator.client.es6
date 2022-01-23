'use strict';

import MetaApiClient from '../metaApi.client';

/**
 * metaapi.cloud MetaTrader account generator API client
 */
export default class MetatraderAccountGeneratorClient extends MetaApiClient {

  /**
   * New MetaTrader 4 account generator model
   * @typedef {Object} NewMT4Account
   * @property {String} accountType account type. Available account type values can be found in mobile MT application or
   * in MT terminal downloaded from our broker
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
   * New MetaTrader 5 account model
   * @typedef {Object} NewMT5Account
   * @property {String} accountType account type. Available account type values can be found in mobile MT application or
   * in MT terminal downloaded from our broker
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
   * MetaTrader account credetials model
   * @typedef {Object} MetatraderAccountCredentialsDto
   * @property {String} login account login
   * @property {String} password account password
   * @property {String} serverName MetaTrader server name
   * @property {String} investorPassword account investor (read-only) password
   */

  /**
   * Creates new MetaTrader 4 demo account
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT4DemoAccount/
   * Method is accessible only with API access token
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT4Account} account account to create
   * @return {Promise<MetatraderAccountCredentialsDto>} promise resolving with MetaTrader account credetials
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
   * Creates new MetaTrader 4 live account
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT4LiveAccount/
   * Method is accessible only with API access token
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT4Account} account account to create
   * @return {Promise<MetatraderAccountCredentialsDto>} promise resolving with MetaTrader account credetials
   */
  createMT4LiveAccount(profileId, account) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createMT4LiveAccount');
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles/${profileId}/mt4-live-accounts`,
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
   * Creates new MetaTrader 5 demo account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT5DemoAccount/
   * Method is accessible only with API access token
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT5Account} account account to create
   * @return {Promise<MetatraderAccountCredentialsDto>} promise resolving with MetaTrader account credentials
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

  /**
   * Creates new MetaTrader 5 live account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT5LiveAccount/
   * Method is accessible only with API access token
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT5Account} account account to create
   * @return {Promise<MetatraderAccountCredentialsDto>} promise resolving with MetaTrader account credentials
   */
  createMT5LiveAccount(profileId, account) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createMT5LiveAccount');
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles/${profileId}/mt5-live-accounts`,
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
