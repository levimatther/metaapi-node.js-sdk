'use strict';

import MetaApiClient from '../metaApi.client';

/**
 * metaapi.cloud MetaTrader account API client (see https://metaapi.cloud/docs/provisioning/)
 */
export default class MetatraderAccountClient extends MetaApiClient {

  /**
   * Metatrader account replica model
   * @typedef {Object} MetatraderAccountReplicaDto
   * @property {string} _id Unique account replica id
   * @property {State} state Current account replica state
   * @property {number} magic Magic value the trades should be performed using
   * @property {ConnectionStatus} connectionStatus Connection status of the MetaTrader terminal to the application
   * @property {string} quoteStreamingIntervalInSeconds Quote streaming interval in seconds. Set to 0 in order to 
   * receive quotes on each tick. Intervals less than 2.5 seconds are supported only for G2
   * @property {string} [symbol] Any symbol provided by broker (required for G1 only)
   * @property {Reliability} reliability Used to increase the reliability of the account replica. High is a recommended value
   * for production environment
   * @property {Array<string>} tags User-defined account replica tags
   * @property {Object} [metadata] Extra information which can be stored together with your account replica. 
   * Total length of this field after serializing it to JSON is limited to 1024 characters
   * @property {number} resourceSlots Number of resource slots to allocate to account replica. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots.
   * @property {number} copyFactoryResourceSlots Number of CopyFactory 2 resource slots to allocate to account replica.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * @property {string} region Region id to deploy account replica at. One of returned by the /users/current/regions endpoint
   * @property {string} createdAt The time account replica was created at, in ISO format
   * @property {MetatraderAccountDto} primaryAccount Primary account
   */

  /**
   * MetaTrader account model
   * @typedef {Object} MetatraderAccountDto
   * @property {string} _id Unique account id
   * @property {State} state Current account state
   * @property {number} magic Magic value the trades should be performed using
   * @property {ConnectionStatus} connectionStatus Connection status of the MetaTrader terminal to the application
   * @property {string} quoteStreamingIntervalInSeconds Quote streaming interval in seconds. Set to 0 in order to 
   * receive quotes on each tick. Intervals less than 2.5 seconds are supported only for G2
   * @property {string} [symbol] Any symbol provided by broker (required for G1 only)
   * @property {Reliability} reliability Used to increase the reliability of the account. High is a recommended value
   * for production environment
   * @property {Array<string>} tags User-defined account tags
   * @property {Object} [metadata] Extra information which can be stored together with your account. 
   * Total length of this field after serializing it to JSON is limited to 1024 characters
   * @property {number} resourceSlots Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots.
   * @property {number} copyFactoryResourceSlots Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * @property {string} region Region id to deploy account at. One of returned by the /users/current/regions endpoint
   * @property {string} createdAt The time account was created at, in ISO format
   * @property {string} name Human-readable account name
   * @property {boolean} manualTrades Flag indicating if trades should be placed as manual trades. Supported on G2 only
   * @property {number} [slippage] Default trade slippage in points. Should be greater or equal to zero. If not
   * specified, system internal setting will be used which we believe is reasonable for most cases
   * @property {string} [provisioningProfileId] Id of the provisioning profile that was used as the basis for 
   * creating this account
   * @property {string} [login] MetaTrader account login
   * @property {string} server MetaTrader server name to connect to 
   * @property {Type} type Account type. Executing accounts as cloud-g2 is faster and cheaper
   * @property {Version} version MetaTrader version
   * @property {number} hash Hash-code of the account
   * @property {string} baseCurrency 3-character ISO currency code of the account base currency.
   * The setting is to be used for copy trading accounts which use national currencies only, such as some Brazilian
   * brokers. You should not alter this setting unless you understand what you are doing.
   * @property {Array<CopyFactoryRoles>} copyFactoryRoles Account roles for CopyFactory2 application
   * @property {boolean} riskManagementApiEnabled Flag indicating that risk management API is enabled on
   * account
   * @property {boolean} metastatsHourlyTarificationEnabled Flag indicating that MetaStats hourly tarification
   * is enabled on account
   * @property {string} accessToken Authorization token to be used for accessing single account data.
   * Intended to be used in browser API.
   * @property {Array<AccountConnection>} connections Active account connections
   * @property {boolean} primaryReplica Flag indicating that account is primary
   * @property {string} userId User id
   * @property {string} [primaryAccountId] Primary account id. Only replicas can have this field
   * @property {Array<MetatraderAccountReplicaDto>} accountReplicas MetaTrader account replicas
   */

  /**
   * Account connection
   * @typedef {Object} AccountConnection
   * @property {string} region Region the account is connected at
   * @property {string} zone Availability zone the account is connected at
   * @property {string} application Application the account is connected to, one of `MetaApi`, `CopyFactory subscriber`,
   * `CopyFactory provider`, `CopyFactory history import`, `Risk management`
   */

  /**
   * MT version
   * @typedef {4 | 5} Version
   */

  /**
   * MT platform
   * @typedef {'mt4' | 'mt5'} Platform
   */

  /**
   * Account type
   * @typedef {'cloud-g1' | 'cloud-g2'} Type
   */

  /**
   * Account state
   * @typedef {'CREATED' | 'DEPLOYING' | 'DEPLOYED' | 'DEPLOY_FAILED' | 'UNDEPLOYING' | 'UNDEPLOYED' |
   * 'UNDEPLOY_FAILED' | 'DELETING' | 'DELETE_FAILED' | 'REDEPLOY_FAILED' | 'DRAFT'} State
   */

  /**
   * Account connection status
   * @typedef {'CONNECTED' | 'DISCONNECTED' | 'DISCONNECTED_FROM_BROKER'} ConnectionStatus
   */

  /**
   * Account reliability
   * @typedef {'high' | 'regular'} Reliability
   */

  /**
   * CopyFactory roles
   * @typedef {'SUBSCRIBER' | 'PROVIDER'} CopyFactoryRoles
   */

  /**
   * @typedef {Object} AccountsFilter
   * @property {number} [offset] Search offset (defaults to 0) (must be greater or equal to 0)
   * @property {number} [limit] Search limit (defaults to 1000) 
   * (must be greater or equal to 1 and less or equal to 1000)
   * @property {Array<Version> | Version} [version] MT version
   * @property {Array<Type> | Type} [type] Account type
   * @property {Array<State> | State} [state] Account state
   * @property {Array<ConnectionStatus> | ConnectionStatus} [connectionStatus] Connection status
   * @property {string} [query] Searches over _id, name, server and login to match query
   * @property {string} [provisioningProfileId] Provisioning profile id
   */

  /**
   * Returns trading accounts belonging to the current user (see https://metaapi.cloud/docs/provisioning/api/account/readAccounts/)
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
    return this._httpClient.request(opts, 'getAccounts');
  }

  /**
   * Returns trading account by id (see https://metaapi.cloud/docs/provisioning/api/account/readAccount/)
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
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
    return this._httpClient.request(opts, 'getAccount');
  }

  /**
   * Returns trading account replica by trading account id and replica id (see 
   * https://metaapi.cloud/docs/provisioning/api/accountReplica/readAccountReplica/)
   * Method is accessible only with API access token
   * @param {string} accountId MetaTrader primary account id
   * @param {string} replicaId MetaTrader account replica id
   * @return {Promise<MetatraderAccountReplicaDto>} promise resolving with MetaTrader account replica found
   */
  getAccountReplica(accountId, replicaId) {
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/replicas/${replicaId}`,
      method: 'GET',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'getAccountReplica');
  }

  /**
   * Returns replicas for a trading account (see 
   * https://metaapi.cloud/docs/provisioning/api/accountReplica/readAccountReplicas/)
   * Method is accessible only with API access token
   * @param {string} accountId Primary account id
   * @return {Promise<Array<MetatraderAccountReplicaDto>>} promise resolving with MetaTrader account replicas found
   */
  getAccountReplicas(accountId) {
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/replicas`,
      method: 'GET',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'getAccountReplicas');
  }


  /**
   * Returns trading account by access token
   * (see https://metaapi.cloud/docs/provisioning/api/account/readAccountByAccessToken/)
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
    return this._httpClient.request(opts, 'getAccountByToken');
  }

  /**
   * New MetaTrader account model
   * @typedef {Object} NewMetatraderAccountDto
   * @property {string} [symbol] Any MetaTrader symbol your broker provides historical market data for. 
   * This value should be specified for G1 accounts only and only in case your MT account fails to connect to broker.
   * @property {number} magic Magic value the trades should be performed using.
   * When manualTrades field is set to true, magic value must be 0
   * @property {string} [quoteStreamingIntervalInSeconds] Quote streaming interval in seconds. Set to 0 in order to 
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported only for G2
   * @property {Array<string>} [tags] User-defined account tags
   * @property {Object} [metadata] Extra information which can be stored together with your account. 
   * Total length of this field after serializing it to JSON is limited to 1024 characters
   * @property {Reliability} [reliability] Used to increase the reliability of the account. High is a recommended value 
   * for production environment. Default value is high
   * @property {number} [resourceSlots] Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots. Default is 1.
   * @property {number} [copyFactoryResourceSlots] Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   * @property {string} region Region id to deploy account at. One of returned by the /users/current/regions endpoint
   * @property {string} name Human-readable account name
   * @property {boolean} [manualTrades] Flag indicating if trades should be placed as manual trades.
   * Supported on G2 only. Default is false.
   * @property {number} [slippage] Default trade slippage in points. Should be greater or equal to zero. If not
   * specified, system internal setting will be used which we believe is reasonable for most cases
   * @property {string} [provisioningProfileId] Id of the provisioning profile that was used as the basis for creating 
   * this account. Required for cloud account
   * @property {string} [login] MetaTrader account login. Only digits are allowed
   * @property {string} [password] MetaTrader account password. The password can be either investor password for read-only
   * access or master password to enable trading features.
   * @property {string} server MetaTrader server name to connect to 
   * @property {Platform} [platform] MetaTrader platform
   * @property {Type} [type] Account type. Executing accounts as cloud-g2 is faster and cheaper. 
   * Default value is cloud-g2
   * @property {string} [baseCurrency] 3-character ISO currency code of the account base currency. Default value is USD.
   * The setting is to be used for copy trading accounts which use national currencies only, such as some Brazilian
   * brokers. You should not alter this setting unless you understand what you are doing.
   * @property {Array<CopyFactoryRoles>} [copyFactoryRoles] Account roles for CopyFactory2 API
   * @property {boolean} [riskManagementApiEnabled] Flag indicating that risk management API should be enabled on
   * account. Default is false
   * @property {boolean} [metastatsHourlyTarificationEnabled] Flag indicating that MetaStats hourly tarification
   * should be enabled on account. Default is false
   * @property {Array<String>} [keywords] Keywords to be used for broker server search.
   * We recommend to include exact broker company name in this list 
   */

  /**
   * MetaTrader account id model
   * @typedef {Object} MetatraderAccountIdDto
   * @property {string} id MetaTrader account unique identifier
   * @property {string} state State of the account. Possible values are 'UNDEPLOYED', 'DEPLOYED', 'DRAFT'
   */

  /**
   * Adds a trading account and starts a cloud API server for the trading account (see 
   * https://metaapi.cloud/docs/provisioning/api/account/createAccount/).
   * It can take some time for the API server and trading terminal to start and connect to broker.
   * You can use the `connectionStatus` replica field to monitor the current status of the trading account.
   * Method is accessible only with API access token
   * @param {NewMetatraderAccountDto} account MetaTrader account data
   * @return {Promise<MetatraderAccountIdDto>} promise resolving with an id and state of the MetaTrader account created
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
    return this._httpClient.request(opts, 'createAccount');
  }

  /**
   * New MetaTrader account replica model
   * @typedef {Object} NewMetaTraderAccountReplicaDto
   * @property {string} [symbol] Any MetaTrader symbol your broker provides historical market data for. 
   * This value should be specified for G1 accounts only and only in case your MT account fails to connect to broker.
   * @property {number} magic Magic value the trades should be performed using.
   * When manualTrades field is set to true, magic value must be 0
   * @property {string} [quoteStreamingIntervalInSeconds] Quote streaming interval in seconds. Set to 0 in order to 
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported only for G2
   * @property {Array<string>} [tags] User-defined account replica tags
   * @property {Object} [metadata] Extra information which can be stored together with your account replica. 
   * Total length of this field after serializing it to JSON is limited to 1024 characters
   * @property {Reliability} [reliability] Used to increase the reliability of the account replica. High is a recommended value 
   * for production environment. Default value is high
   * @property {number} [resourceSlots] Number of resource slots to allocate to account replica. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots. Default is 1.
   * @property {number} [copyFactoryResourceSlots] Number of CopyFactory 2 resource slots to allocate to account replica.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   * @property {string} region Region id to deploy account replica at. One of returned by the /users/current/regions endpoint
   */

  /**
   * Creates a trading account replica in a region different from trading account region and starts a cloud API server for it
   * (see https://metaapi.cloud/docs/provisioning/api/accountReplica/createAccountReplica/).
   * It can take some time for the API server and trading terminal to start and connect to broker.
   * You can use the `connectionStatus` replica field to monitor the current status of the replica.
   * Method is accessible only with API access token
   * @param {string} accountId primary account id
   * @param {NewMetaTraderAccountReplicaDto} account MetaTrader account data
   * @return {Promise<MetatraderAccountIdDto>} promise resolving with an id and state of the MetaTrader account replica created
   */
  createAccountReplica(accountId, account) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createAccountReplica');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/replicas`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: account
    };
    return this._httpClient.request(opts, 'createAccountReplica');
  }

  /**
   * Starts API server and trading terminal for trading account.
   * This request will be ignored if the account is already deployed.
   * (see https://metaapi.cloud/docs/provisioning/api/account/deployAccount/)
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
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
    return this._httpClient.request(opts, 'deployAccount');
  }

  /**
   * Starts API server and trading terminal for trading account replica.
   * This request will be ignored if the replica is already deployed
   * (see https://metaapi.cloud/docs/provisioning/api/accountReplica/deployAccountReplica/)
   * Method is accessible only with API access token
   * @param {string} accountId MetaTrader account id
   * @param {string} replicaId MetaTrader account replica id
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for deployment
   */
  deployAccountReplica(accountId, replicaId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('deployAccountReplica');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/replicas/${replicaId}/deploy`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'deployAccountReplica');
  }

  /**
   * Stops API server and trading terminal for trading account.
   * This request will be ignored if trading account is already undeployed
   * (see https://metaapi.cloud/docs/provisioning/api/account/undeployAccount/)
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
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
    return this._httpClient.request(opts, 'undeployAccount');
  }

  /**
   * Stops API server and trading terminal for trading account replica.
   * The request will be ignored if trading account replica is already undeployed
   * (see https://metaapi.cloud/docs/provisioning/api/accountReplica/undeployAccountReplica/)
   * Method is accessible only with API access token
   * @param {string} accountId MetaTrader primary account id
   * @param {string} replicaId MetaTrader account replica id
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for undeployment
   */
  undeployAccountReplica(accountId, replicaId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('undeployAccountReplica');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/replicas/${replicaId}/undeploy`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'undeployAccountReplica');
  }

  /**
   * Redeploys trading account. This is equivalent to undeploy immediately followed by deploy
   * (see https://metaapi.cloud/docs/provisioning/api/account/redeployAccount/)
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
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
    return this._httpClient.request(opts, 'redeployAccount');
  }

  /**
   * Redeploys trading account replica. This is equivalent to undeploy immediately followed by deploy.
   * (see https://metaapi.cloud/docs/provisioning/api/account/redeployAccountReplica/)
   * Method is accessible only with API access token
   * @param {string} accountId MetaTrader primary account id
   * @param {string} replicaId MetaTrader account replica id
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for redeployment
   */
  redeployAccountReplica(accountId, replicaId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('redeployAccountReplica');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/replicas/${replicaId}/redeploy`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'redeployAccountReplica');
  }

  /**
   * Removes a trading account and stops the API server serving the account.
   * The account state such as downloaded market data history will be removed as well when you remove the account.
   * (see https://metaapi.cloud/docs/provisioning/api/account/deleteAccount/).
   * Method is accessible only with API access token
   * @param {string} id Id of the account to be deleted
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
    return this._httpClient.request(opts, 'deleteAccount');
  }

  /**
   * Removes a trading account replica and stops the API server serving the replica
   * (see https://metaapi.cloud/docs/provisioning/api/account/deleteAccountReplica/).
   * Method is accessible only with API access token
   * @param {string} accountId primary account id
   * @param {string} replicaId Id of the account replica to be deleted
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for deletion
   */
  deleteAccountReplica(accountId, replicaId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('deleteAccountReplica');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/replicas/${replicaId}`,
      method: 'DELETE',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'deleteAccountReplica');
  }

  /**
   * Updated MetaTrader account data
   * @typedef {Object} MetatraderAccountUpdateDto
   * @property {string} name Human-readable account name
   * @property {string} [password] MetaTrader account password. The password can be either investor password for read-only
   * access or master password to enable trading features
   * @property {string} server MetaTrader server name to connect to
   * @property {number} [magic] Magic value the trades should be performed using.
   * When manualTrades field is set to true, magic value must be 0
   * @property {boolean} [manualTrades] Flag indicating if trades should be placed as manual trades. Supported for G2 only.
   * Default is false.
   * @property {number} [slippage] Default trade slippage in points. Should be greater or equal to zero. If not specified,
   * system internal setting will be used which we believe is reasonable for most cases
   * @property {number} [quoteStreamingIntervalInSeconds] Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Intervals less than 2.5 seconds are supported only for G2.
   * Default value is 2.5 seconds
   * @property {Array<string>} [tags] MetaTrader account tags
   * @property {Object} [metadata] extra information which can be stored together with your account
   * @property {number} [resourceSlots] Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Default is 1
   * @property {number} [copyFactoryResourceSlots] Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1. 
   */

  /**
   * Updates trading account. 
   * Please redeploy the trading account in order for updated settings to take effect
   * (see https://metaapi.cloud/docs/provisioning/api/account/updateAccount/).
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @param {MetatraderAccountUpdateDto} account updated account information
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
    return this._httpClient.request(opts, 'updateAccount');
  }

  /**
   * Updated MetaTrader account replica data
   * @typedef {Object} UpdatedMetatraderAccountReplicaDto
   * @property {number} [magic] Magic value the trades should be performed using.
   * When manualTrades field is set to true, magic value must be 0
   * @property {number} [quoteStreamingIntervalInSeconds] Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   * @property {Array<string>} [tags] MetaTrader account tags
   * @property {Object} [metadata] extra information which can be stored together with your account
   * @property {number} [resourceSlots] Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Default is 1
   * @property {number} [copyFactoryResourceSlots] Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   */

  /**
   * Updates trading account replica (see
   * https://metaapi.cloud/docs/provisioning/api/account/updateAccountReplica/).
   * Method is accessible only with API access token
   * @param {string} accountId MetaTrader primary account id
   * @param {string} replicaId MetaTrader account replica id
   * @param {UpdatedMetatraderAccountReplicaDto} metatraderAccount updated account replica information
   * @return {Promise} promise resolving when MetaTrader account replica is updated
   */
  updateAccountReplica(accountId, replicaId, metatraderAccount) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('updateAccountReplica');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/replicas/${replicaId}`,
      method: 'PUT',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: metatraderAccount
    };
    return this._httpClient.request(opts, 'updateAccountReplica');
  }

  /**
   * Increases trading account reliability in order to increase the expected account uptime.
   * The account will be temporary stopped to perform this action.
   * Note that increasing reliability is a paid option (see
   * https://metaapi.cloud/docs/provisioning/api/account/increaseReliability/).
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
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
    return this._httpClient.request(opts, 'increaseReliability');
  }

  /**
   * Enables risk management API for trading account.
   * The account will be temporary stopped to perform this action.
   * Note that risk management API is a paid option (see
   * https://metaapi.cloud/docs/provisioning/api/account/enableRiskManagementApi/).
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @return {Promise} promise resolving when account risk management is enabled
   */
  enableRiskManagementApi(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('enableRiskManagementApi');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}/enable-risk-management-api`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'enableRiskManagementApi');
  }

  /**
   * Enables MetaStats hourly tarification for trading account.
   * The account will be temporary stopped to perform this action.
   * Note that this is a paid option (see
   * https://metaapi.cloud/docs/provisioning/api/account/enableMetaStatsHourlyTarification/).
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @return {Promise} promise resolving when account MetaStats hourly tarification is enabled
   */
  enableMetastatsHourlyTarification(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('enableMetastatsHourlyTarification');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${id}/enable-metastats-hourly-tarification`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'enableMetastatsHourlyTarification');
  }

  /**
   * Configuration link
   * @typedef {Object} ConfigurationLink
   * @property {string} configurationLink Secure link to allow end user to configure account directly
   */

  /**
   * Generates trading account configuration link by account id.
   * (see https://metaapi.cloud/docs/provisioning/api/account/createConfigurationLink/)
   * This link can be used by the end user to enter trading account login and password or change the password.
   * Method is accessible only with API access token
   * @param {string} accountId Trading account id
   * @param {number} [ttlInDays] Lifetime of the link in days. Default is 7.
   * @return {Promise<ConfigurationLink>} promise resolving with configuration link
   */
  createConfigurationLink(accountId, ttlInDays) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createConfigurationLink');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/configuration-link`,
      method: 'PUT',
      headers: {
        'auth-token': this._token
      },
      qs: {
        ttlInDays: ttlInDays
      },
      json: true
    };
    return this._httpClient.request(opts, 'createConfigurationLink');
  }

}
