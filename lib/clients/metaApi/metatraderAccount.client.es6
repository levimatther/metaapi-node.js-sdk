'use strict';

import MetaApiClient from '../metaApi.client';

/**
 * metaapi.cloud MetaTrader account API client (see https://metaapi.cloud/docs/provisioning/)
 */
export default class MetatraderAccountClient extends MetaApiClient {

  /**
   * Extension model
   * @typedef Extension
   * @property {String} id extension id
   * @property {Object} configuration extension configuration
   */

  /**
   * MetaTrader account model
   * @typedef {Object} MetatraderAccountDto
   * @property {String} _id account unique identifier
   * @property {String} name MetaTrader account human-readable name in the MetaApi app
   * @property {String} type account type, can be cloud, cloud-g1, cloud-g2 or self-hosted. Cloud and cloud-g2 are
   * aliases.
   * @property {String} login MetaTrader account number
   * @property {String} server MetaTrader server which hosts the account
   * @property {String} provisioningProfileId id of the account's provisioning profile
   * @property {String} application application name to connect the account to. Currently allowed values are MetaApi and
   * AgiliumTrade
   * @property {Number} magic MetaTrader magic to place trades using
   * @property {String} state account deployment state. One of CREATED, DEPLOYING, DEPLOYED, UNDEPLOYING, UNDEPLOYED,
   * DELETING
   * @property {String} connectionStatus terminal & broker connection status, one of CONNECTED, DISCONNECTED,
   * DISCONNECTED_FROM_BROKER
   * @property {String} accessToken authorization token to be used for accessing single account data.
   * Intended to be used in browser API.
   * @property {Boolean} manualTrades flag indicating if trades should be placed as manual trades. Default is false.
   * Supported on G2 only
   * @property {Number} quoteStreamingIntervalInSeconds Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   * @property {Array<string>} [tags] MetaTrader account tags
   * @property {Array<Extension>} extensions API extensions
   * @property {Object} metadata extra information which can be stored together with your account
   * @property {String} reliability used to increase the reliability of the account. Allowed values are regular and high. Default is regular
   */

  /**
   * MT version
   * @typedef {4 | 5} Version
   */

  /**
   * Account type
   * @typedef {'cloud' | 'self-hosted'} Type
   */

  /**
   * Account state
   * @typedef {'CREATED' | 'DEPLOYING' | 'DEPLOYED' | 'DEPLOY_FAILED' | 'UNDEPLOYING' | 'UNDEPLOYED' |
   * 'UNDEPLOY_FAILED' | 'DELETING' | 'DELETE_FAILED' | 'REDEPLOY_FAILED'} State
   */

  /**
   * Account connection status
   * @typedef {'CONNECTED' | 'DISCONNECTED' | 'DISCONNECTED_FROM_BROKER'} ConnectionStatus
   */

  /**
   * @typedef {Object} AccountsFilter
   * @property {Number} [offset] search offset (defaults to 0) (must be greater or equal to 0)
   * @property {Number} [limit] search limit (defaults to 1000) 
   * (must be greater or equal to 1 and less or equal to 1000)
   * @property {Array<Version> | Version} [version] MT version
   * @property {Array<Type> | Type} [type] account type
   * @property {Array<State> | State} [state] account state
   * @property {Array<ConnectionStatus> | ConnectionStatus} [connectionStatus] connection status
   * @property {String} [query] searches over _id, name, server and login to match query
   * @property {String} [provisioningProfileId] provisioning profile id
   */

  /**
   * Retrieves MetaTrader accounts owned by user (see https://metaapi.cloud/docs/provisioning/api/account/readAccounts/)
   * Method is accessible only with API access token
   * @param {AccountsFilter} accountsFilter optional filter
   * @return {Promise<Array<MetatraderAccountDto>>} promise resolving with MetaTrader accounts found
   */
  getAccounts(accountsFilter = {}) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('getAccounts');
    }
    const opts = {
      url: `${this._host}/users/current/accounts`,
      method: 'GET',
      qs: accountsFilter,
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts);
  }

  /**
   * Retrieves a MetaTrader account by id (see https://metaapi.cloud/docs/provisioning/api/account/readAccount/). Throws
   * an error if account is not found.
   * @param {String} id MetaTrader account id
   * @return {Promise<MetatraderAccountDto>} promise resolving with MetaTrader account found
   */
  getAccount(id) {
    const opts = {
      url: `${this._host}/users/current/accounts/${id}`,
      method: 'GET',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts);
  }

  /**
   * Retrieves a MetaTrader account by token (see https://metaapi.cloud/docs/provisioning/api/account/readAccount/).
   * Throws an error if account is not found.
   * Method is accessible only with account access token
   * @return {Promise<MetatraderAccountDto>} promise resolving with MetaTrader account found
   */
  getAccountByToken() {
    if (this._isNotAccountToken()) {
      return this._handleNoAccessError('getAccountByToken');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/accessToken/${this._token}`,
      method: 'GET',
      json: true
    };
    return this._httpClient.request(opts);
  }

  /**
   * New MetaTrader account model
   * @typedef {Object} NewMetatraderAccountDto
   * @property {String} name MetaTrader account human-readable name in the MetaApi app
   * @property {String} type account type, can be cloud, cloud-g1, cloud-g2 or self-hosted. cloud-g2 and cloud are
   * aliases. When you create MT5 cloud account the type is automatically converted to cloud-g1 because MT5 G2 support
   * is still experimental. You can still create MT5 G2 account by setting type to cloud-g2.
   * @property {String} login MetaTrader account number
   * @property {String} password MetaTrader account password. The password can be either investor password for read-only
   * access or master password to enable trading features. Required for cloud account
   * @property {String} server MetaTrader server which hosts the account
   * @property {String} provisioningProfileId id of the account's provisioning profile
   * @property {String} application application name to connect the account to. Currently allowed values are MetaApi and
   * AgiliumTrade
   * @property {Number} magic MetaTrader magic to place trades using
   * @property {Boolean} manualTrades flag indicating if trades should be placed as manual trades. Default is false
   * @property {Number} quoteStreamingIntervalInSeconds Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   * @property {Array<string>} [tags] MetaTrader account tags
   * @property {Array<Extension>} extensions API extensions
   * @property {Object} metadata extra information which can be stored together with your account
   * @property {String} reliability used to increase the reliability of the account. Allowed values are regular and high. Default is regular
   */

  /**
   * MetaTrader account id model
   * @typedef {Object} MetatraderAccountIdDto
   * @property {String} id MetaTrader account unique identifier
   */

  /**
   * Starts cloud API server for a MetaTrader account using specified provisioning profile (see
   * https://metaapi.cloud/docs/provisioning/api/account/createAccount/). It takes some time to launch the terminal and
   * connect the terminal to the broker, you can use the connectionStatus field to monitor the current status of the
   * terminal.
   * Method is accessible only with API access token
   * @param {NewMetatraderAccountDto} account MetaTrader account to create
   * @return {Promise<MetatraderAccountIdDto>} promise resolving with an id of the MetaTrader account created
   */
  createAccount(account) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createAccount');
    }
    const opts = {
      url: `${this._host}/users/current/accounts`,
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
   * Starts API server for MetaTrader account. This request will be ignored if the account has already been deployed.
   * (see https://metaapi.cloud/docs/provisioning/api/account/deployAccount/)
   * @param {String} id MetaTrader account id to deploy
   * @return {Promise} promise resolving when MetaTrader account is scheduled for deployment
   */
  deployAccount(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('deployAccount');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}/deploy`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts);
  }

  /**
   * Stops API server for a MetaTrader account. Terminal data such as downloaded market history data will be preserved.
   * (see https://metaapi.cloud/docs/provisioning/api/account/undeployAccount/)
   * @param {String} id MetaTrader account id to undeploy
   * @return {Promise} promise resolving when MetaTrader account is scheduled for undeployment
   */
  undeployAccount(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('undeployAccount');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}/undeploy`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts);
  }

  /**
   * Redeploys MetaTrader account. This is equivalent to undeploy immediately followed by deploy.
   * (see https://metaapi.cloud/docs/provisioning/api/account/deployAccount/)
   * @param {String} id MetaTrader account id to redeploy
   * @return {Promise} promise resolving when MetaTrader account is scheduled for redeployment
   */
  redeployAccount(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('redeployAccount');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}/redeploy`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts);
  }

  /**
   * Stops and deletes an API server for a specified MetaTrader account. The terminal state such as downloaded market
   * data history will be deleted as well when you delete the account. (see
   * https://metaapi.cloud/docs/provisioning/api/account/deleteAccount/).
   * Method is accessible only with API access token
   * @param {String} id MetaTrader account id
   * @return {Promise} promise resolving when MetaTrader account is scheduled for deletion
   */
  deleteAccount(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('deleteAccount');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}`,
      method: 'DELETE',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts);
  }

  /**
   * Updated MetaTrader account data
   * @typedef {Object} MetatraderAccountUpdateDto
   * @property {String} name MetaTrader account human-readable name in the MetaApi app
   * @property {String} password MetaTrader account password. The password can be either investor password for read-only
   * access or master password to enable trading features. Required for cloud account
   * @property {String} server MetaTrader server which hosts the account
   * @property {Boolean} manualTrades flag indicating if trades should be placed as manual trades. Default is false
   * @property {Number} quoteStreamingIntervalInSeconds Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   * @property {Array<string>} [tags] MetaTrader account tags
   * @property {Array<Extension>} extensions API extensions
   * @property {Object} metadata extra information which can be stored together with your account
   */

  /**
   * Updates existing metatrader account data (see
   * https://metaapi.cloud/docs/provisioning/api/account/updateAccount/).
   * Method is accessible only with API access token
   * @param {String} id MetaTrader account id
   * @param {MetatraderAccountUpdateDto} account updated MetaTrader account
   * @return {Promise} promise resolving when MetaTrader account is updated
   */
  updateAccount(id, account) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('updateAccount');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}`,
      method: 'PUT',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: account
    };
    return this._httpClient.request(opts);
  }

  /**
   * Increases MetaTrader account reliability. The account will be temporary stopped to perform this action. (see
   * https://metaapi.cloud/docs/provisioning/api/account/increaseReliability/).
   * Method is accessible only with API access token
   * @param {String} id MetaTrader account id
   * @return {Promise} promise resolving when MetaTrader account reliability is increased
   */
  increaseReliability(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('increaseReliability');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}/increase-reliability`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts);
  }

}
