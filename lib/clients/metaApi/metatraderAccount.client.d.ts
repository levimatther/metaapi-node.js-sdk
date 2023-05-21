/**
 * metaapi.cloud MetaTrader account API client (see https://metaapi.cloud/docs/provisioning/)
 */
export default class MetatraderAccountClient {
  
  /**
   * Returns trading accounts belonging to the current user (see https://metaapi.cloud/docs/provisioning/api/account/readAccounts/)
   * Method is accessible only with API access token
   * @param {AccountsFilter} accountsFilter optional filter
   * @return {Promise<Array<MetatraderAccountDto>>} promise resolving with MetaTrader accounts found
   */
  getAccounts(accountsFilter?: AccountsFilter): Promise<Array<MetatraderAccountDto>>;
  
  /**
   * Returns trading account by id (see https://metaapi.cloud/docs/provisioning/api/account/readAccount/)
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @return {Promise<MetatraderAccountDto>} promise resolving with MetaTrader account found
   */
  getAccount(id: string): Promise<MetatraderAccountDto>;
  
  /**
   * Returns trading account replica by trading account id and replica id (see 
   * https://metaapi.cloud/docs/provisioning/api/accountReplica/readAccountReplica/)
   * Method is accessible only with API access token
   * @param {string} accountId MetaTrader primary account id
   * @param {string} replicaId MetaTrader account replica id
   * @return {Promise<MetatraderAccountReplicaDto>} promise resolving with MetaTrader account replica found
   */
  getAccountReplica(accountId: string, replicaId: string): Promise<MetatraderAccountReplicaDto>

  /**
   * Returns replicas for a trading account (see 
   * https://metaapi.cloud/docs/provisioning/api/accountReplica/readAccountReplicas/)
   * Method is accessible only with API access token
   * @param {string} accountId Primary account id
   * @return {Promise<Array<MetatraderAccountReplicaDto>>} promise resolving with MetaTrader account replicas found
   */
  getAccountReplicas(accountId: string): Promise<Array<MetatraderAccountReplicaDto>>

  /**
   * Returns trading account by access token
   * (see https://metaapi.cloud/docs/provisioning/api/account/readAccountByAccessToken/)
   * Method is accessible only with account access token
   * @return {Promise<MetatraderAccountDto>} promise resolving with MetaTrader account found
   */
  getAccountByToken(): Promise<MetatraderAccountDto>;
  
  /**
   * Adds a trading account and starts a cloud API server for the trading account (see 
   * https://metaapi.cloud/docs/provisioning/api/account/createAccount/).
   * It can take some time for the API server and trading terminal to start and connect to broker.
   * You can use the `connectionStatus` replica field to monitor the current status of the trading account.
   * Method is accessible only with API access token
   * @param {NewMetatraderAccountDto} account MetaTrader account data
   * @return {Promise<MetatraderAccountIdDto>} promise resolving with an id and state of the MetaTrader account created
   */
  createAccount(account: NewMetatraderAccountDto): Promise<MetatraderAccountIdDto>;

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
  createAccountReplica(accountId: string, account: NewMetaTraderAccountReplicaDto): Promise<MetatraderAccountIdDto>;

  /**
   * Starts API server and trading terminal for trading account.
   * This request will be ignored if the account is already deployed.
   * (see https://metaapi.cloud/docs/provisioning/api/account/deployAccount/)
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @return {Promise} promise resolving when MetaTrader account is scheduled for deployment
   */
  deployAccount(id: string): Promise<any>

  /**
   * Starts API server and trading terminal for trading account replica.
   * This request will be ignored if the replica is already deployed
   * (see https://metaapi.cloud/docs/provisioning/api/accountReplica/deployAccountReplica/)
   * Method is accessible only with API access token
   * @param {string} accountId MetaTrader account id
   * @param {string} replicaId MetaTrader account replica id
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for deployment
   */
  deployAccountReplica(accountId: string, replicaId: string): Promise<any>

  /**
   * Stops API server and trading terminal for trading account.
   * This request will be ignored if trading account is already undeployed
   * (see https://metaapi.cloud/docs/provisioning/api/account/undeployAccount/)
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @return {Promise} promise resolving when MetaTrader account is scheduled for undeployment
   */
  undeployAccount(id: string): Promise<any>

  /**
   * Stops API server and trading terminal for trading account replica.
   * The request will be ignored if trading account replica is already undeployed
   * (see https://metaapi.cloud/docs/provisioning/api/accountReplica/undeployAccountReplica/)
   * Method is accessible only with API access token
   * @param {string} accountId MetaTrader primary account id
   * @param {string} replicaId MetaTrader account replica id
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for undeployment
   */
  undeployAccountReplica(primaryAccountId: string, replicaId: string): Promise<any>
  
  /**
   * Redeploys trading account. This is equivalent to undeploy immediately followed by deploy
   * (see https://metaapi.cloud/docs/provisioning/api/account/redeployAccount/)
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @return {Promise} promise resolving when MetaTrader account is scheduled for redeployment
   */
  redeployAccount(id: string): Promise<any>

  /**
   * Redeploys trading account replica. This is equivalent to undeploy immediately followed by deploy.
   * (see https://metaapi.cloud/docs/provisioning/api/account/redeployAccountReplica/)
   * Method is accessible only with API access token
   * @param {string} accountId MetaTrader primary account id
   * @param {string} replicaId MetaTrader account replica id
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for redeployment
   */
  redeployAccountReplica(accountId: string, replicaId: string): Promise<any>

  /**
   * Removes a trading account and stops the API server serving the account.
   * The account state such as downloaded market data history will be removed as well when you remove the account.
   * (see https://metaapi.cloud/docs/provisioning/api/account/deleteAccount/).
   * Method is accessible only with API access token
   * @param {string} id Id of the account to be deleted
   * @return {Promise} promise resolving when MetaTrader account is scheduled for deletion
   */
  deleteAccount(id: string): Promise<any>

  /**
   * Removes a trading account replica and stops the API server serving the replica
   * (see https://metaapi.cloud/docs/provisioning/api/account/deleteAccountReplica/).
   * Method is accessible only with API access token
   * @param {string} accountId primary account id
   * @param {string} replicaId Id of the account replica to be deleted
   * @return {Promise} promise resolving when MetaTrader account replica is scheduled for deletion
   */
  deleteAccountReplica(accountId: string, replicaId: string): Promise<any>
  
  /**
   * Updates trading account. 
   * Please redeploy the trading account in order for updated settings to take effect
   * (see https://metaapi.cloud/docs/provisioning/api/account/updateAccount/).
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @param {MetatraderAccountUpdateDto} account updated account information
   * @return {Promise} promise resolving when MetaTrader account is updated
   */
  updateAccount(id: string, account: MetatraderAccountUpdateDto): Promise<any>

  /**
   * Updates trading account replica (see
   * https://metaapi.cloud/docs/provisioning/api/account/updateAccountReplica/).
   * Method is accessible only with API access token
   * @param {string} accountId MetaTrader primary account id
   * @param {string} replicaId MetaTrader account replica id
   * @param {UpdatedMetatraderAccountReplicaDto} metatraderAccount updated account replica information
   * @return {Promise} promise resolving when MetaTrader account replica is updated
   */
  updateAccountReplica(accountId: string, replicaId: string, metatraderAccount: UpdatedMetatraderAccountReplicaDto): Promise<any>
  
  /**
   * Increases trading account reliability in order to increase the expected account uptime.
   * The account will be temporary stopped to perform this action.
   * Note that increasing reliability is a paid option (see
   * https://metaapi.cloud/docs/provisioning/api/account/increaseReliability/).
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @return {Promise} promise resolving when MetaTrader account reliability is increased
   */
  increaseReliability(id: string): Promise<any>

  /**
   * Enables risk management API for trading account.
   * The account will be temporary stopped to perform this action.
   * Note that risk management API is a paid option (see
   * https://metaapi.cloud/docs/provisioning/api/account/enableRiskManagementApi/).
   * Method is accessible only with API access token
   * @param {String} id MetaTrader account id
   * @return {Promise} promise resolving when account risk management is enabled
   */
  enableRiskManagementApi(id: string): Promise<any>

  /**
   * Enables MetaStats API for trading account.
   * The account will be temporary stopped to perform this action.
   * Note that this is a paid option (see
   * https://metaapi.cloud/docs/provisioning/api/account/enableMetaStatsApi/).
   * Method is accessible only with API access token
   * @param {string} id MetaTrader account id
   * @return {Promise} promise resolving when account MetaStats API is enabled
   */
  enableMetaStatsApi(id: string): Promise<any>

  /**
   * Generates trading account configuration link by account id.
   * (see https://metaapi.cloud/docs/provisioning/api/account/createConfigurationLink/)
   * This link can be used by the end user to enter trading account login and password or change the password.
   * Method is accessible only with API access token
   * @param {string} accountId Trading account id
   * @param {number} [ttlInDays] Lifetime of the link in days. Default is 7.
   * @return {Promise<ConfigurationLink>} promise resolving with configuration link
   */
  createConfigurationLink(accountId: string, ttlInDays?: number): Promise<ConfigurationLink>
}

/**
 * Account type
 */
export declare type Type = 'cloud-g1' | 'cloud-g2'

/**
 * Account state
 */
export declare type State = 'CREATED' | 'DEPLOYING' | 'DEPLOYED' | 'DEPLOY_FAILED' | 'UNDEPLOYING' | 'UNDEPLOYED' |
 'UNDEPLOY_FAILED' | 'DELETING' | 'DELETE_FAILED' | 'REDEPLOY_FAILED' | 'DRAFT'

/**
 * MT version
 */
export declare type Version = 4 | 5

/**
 * MT platform
 */
export declare type Platform = 'mt4' | 'mt5'

/**
 * Account connection status
 */
export declare type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'DISCONNECTED_FROM_BROKER'

/**
 * Account reliability
 */
export declare type Reliability = 'high' | 'regular'

/**
 * CopyFactory roles
 */
export declare type CopyFactoryRoles = 'SUBSCRIBER' | 'PROVIDER'

/**
 * Account filter
 */
export declare type AccountsFilter = {

  /**
   * search offset (defaults to 0) (must be greater or equal to 0)
   */
  offset?: number,

  /**
   * search limit (defaults to 1000) 
   * (must be greater or equal to 1 and less or equal to 1000)
   */
  limit?: number,

  /**
   * MT version
   */
  version?: Array<Version> | Version,

  /**
   * account type
   */
  type?: Array<Type> | Type,

  /**
   * account state
   */
  state?: Array<State> | State,

  /**
   * connection status
   */
  connectionStatus?: Array<ConnectionStatus> | ConnectionStatus,

  /**
   * searches over _id, name, server and login to match query
   */
  query?: string,

  /**
   * provisioning profile id
   */
  provisioningProfileId?: string
}

/**
 * Metatrader account replica model
 */
export declare type MetatraderAccountReplicaDto = {

  /**
   * Unique account replica id
   */
  _id: string,
  
  /**
   * Current account replica state
   */
  state: State,

  /**
   * Magic value the trades should be performed using
   */
  magic: number,

  /**
   * Connection status of the MetaTrader terminal to the application
   */
  connectionStatus: ConnectionStatus,

  /**
   * Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Intervals less than 2.5 seconds are supported
   * only for G2
   */
  quoteStreamingIntervalInSeconds: number,
  
  /**
   * Any symbol provided by broker (required for G1 only) 
   */
  symbol?: string,
  
  /**
   * Used to increase the reliability of the account replica. High is a recommended value
   * for production environment
   */
  reliability: Reliability,

  /**
   * User-defined account replica tags
   */
  tags: Array<string>,

  /**
   * Extra information which can be stored together with your account replica. 
   * Total length of this field after serializing it to JSON is limited to 1024 characters
   */
  metadata?: Object,

  /**
   * Number of resource slots to allocate to account replica. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots.
   */
  resourceSlots: number,

  /**
   * Number of CopyFactory 2 resource slots to allocate to account replica.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   */
  copyFactoryResourceSlots: number,

  /**
   * Region id to deploy account replica at. One of returned by the /users/current/regions endpoint
   */
  region: string,

  /**
   * The time account replica was created at, in ISO format
   */
  createdAt: string,

  /**
   * Primary account
   */
  primaryAccount: MetatraderAccountDto
}

/**
 * MetaTrader account model
 */
export declare type MetatraderAccountDto = {

  /**
   * Unique account id
   */
  _id: string,
  
  /**
   * Current account state
   */
  state: State,

  /**
   * Magic value the trades should be performed using
   */
  magic: number,

  /**
   * Connection status of the MetaTrader terminal to the application
   */
  connectionStatus: ConnectionStatus,

  /**
   * Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Intervals less than 2.5 seconds are supported
   * only for G2
   */
  quoteStreamingIntervalInSeconds: number,
  
  /**
   * Any symbol provided by broker (required for G1 only) 
   */
  symbol?: string,
  
  /**
   * Used to increase the reliability of the account. High is a recommended value
   * for production environment
   */
  reliability: Reliability,

  /**
   * User-defined account tags
   */
  tags: Array<string>,

  /**
   * Extra information which can be stored together with your account. 
   * Total length of this field after serializing it to JSON is limited to 1024 characters
   */
  metadata?: Object,

  /**
   * Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots.
   */
  resourceSlots: number,

  /**
   * Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   */
  copyFactoryResourceSlots: number,

  /**
   * Region id to deploy account at. One of returned by the /users/current/regions endpoint
   */
  region: string,

  /**
   * The time account was created at, in ISO format
   */
  createdAt: string,

  /**
   * Human-readable account name
   */
  name: string,

  /**
   * Flag indicating if trades should be placed as manual trades. Supported on G2 only
   */
  manualTrades: boolean,

  /**
   * Default trade slippage in points. Should be greater or equal to zero. If not
   * specified, system internal setting will be used which we believe is reasonable for most cases
   */
  slippage?: number,
  
  /**
   * Id of the provisioning profile that was used as the basis for creating this account
   */
  provisioningProfileId?: string,

  /**
   * MetaTrader account number
   */
  login?: string,

  /**
   * MetaTrader server name to connect to
   */
  server: string,

  /**
   * Account type. Executing accounts as cloud-g2 is faster and cheaper
   */
  type: Type,

  /**
   * MT version
   */
  version: Version,

  /**
   * Hash-code of the account
   */
  hash: number,
  
  /**
   * 3-character ISO currency code of the account base currency.
   * The setting is to be used for copy trading accounts which use national currencies only, such as some Brazilian
   * brokers. You should not alter this setting unless you understand what you are doing.
   */
  baseCurrency: string,

  /**
   * Account roles for CopyFactory2 application. Allowed values are
   * `PROVIDER` and `SUBSCRIBER`
   */
  copyFactoryRoles: Array<CopyFactoryRoles>,

  /**
   * Flag indicating that risk management API is enabled on account
   */
  riskManagementApiEnabled?: boolean,

  /**
   * Flag indicating that MetaStats API is enabled on account
   */
  metastatsApiEnabled?: boolean,

  /**
   * Authorization token to be used for accessing single account data.
   * Intended to be used in browser API.
   */
  accessToken: string,

  /**
   * Active account connections
   */
  connections: Array<AccountConnection>

  /**
   * Flag indicating that account is primary
   */
  primaryReplica: boolean,

  /**
   * User id
   */
  userId: string,
  
  /**
   * Primary account id. Only replicas can have this field
   */
  primaryAccountId?: string,

  /**
   * MetaTrader account replicas
   */
  accountReplicas: Array<MetatraderAccountReplicaDto>,

}

/**
 * Account connection
 */
export declare type AccountConnection = {

  /**
   * Region the account is connected at
   */
  region: string,

  /**
   * Availability zone the account is connected at
   */
  zone: string,

  /**
   * Application the account is connected to
   */
  application: string

}

/**
 * New MetaTrader account model
 */
export declare type NewMetatraderAccountDto = {
 
  /**
   * Any MetaTrader symbol your broker provides historical market data for. 
   * This value should be specified for G1 accounts only and only in case
   * your MT account fails to connect to broker.
   */
  symbol?: string,

  /**
   * Magic value the trades should be performed using.
   * When manualTrades field is set to true, magic value must be 0
   */
  magic: number,

  /**
   * Quote streaming interval in seconds. Set to 0 in order to receive quotes on each tick.
   * Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   */
  quoteStreamingIntervalInSeconds?: number,

  /**
   * User-defined account tags
   */
  tags?: Array<string>,

  /**
   * Extra information which can be stored together with your account. 
   * Total length of this field after serializing it to JSON is limited to 1024 characters
   */
  metadata?: Object,

  /**
   * Used to increase the reliability of the account. High is a recommended value
   * for production environment. Default value is high
   */
  reliability?: Reliability,

  /**
   * Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots. Default is 1.
   */
  resourceSlots?: number,

  /**
   * Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   */
  copyFactoryResourceSlots?: number,

  /**
   * Region id to deploy account at. One of returned by the /users/current/regions endpoint
   */
  region: string,
 
  /**
   * Human-readable account name
   */
  name: string,

  /**
   * Flag indicating if trades should be placed as manual trades. Supported on G2 only.
   * Default is false.
   */
  manualTrades?: boolean,

  /**
   * Default trade slippage in points. Should be greater or equal to zero. If not
   * specified, system internal setting will be used which we believe is reasonable for most cases
   */
  slippage?: number,
  
  /**
   * Id of the provisioning profile that was used as the basis for creating this account.
   * Required for cloud account
   */
  provisioningProfileId?: string,

  /**
   * MetaTrader account login. Only digits are allowed
   */
  login?: string,

  /**
   * MetaTrader account password. The password can be either investor password for read-only
   * access or master password to enable trading features. Required for cloud account
   */
  password?: string,

  /**
   * MetaTrader server name to connect to
   */
  server: string,

  /**
   * MetaTrader platform
   */
  platform?: Platform,

  /**
   * Account type. Executing accounts as cloud-g2 is faster and cheaper. Default value is cloud-g2
   */
  type?: Type,
  
  /**
   * 3-character ISO currency code of the account base currency. Default value is USD.
   * The setting is to be used for copy trading accounts which use national currencies only, such as some Brazilian
   * brokers. You should not alter this setting unless you understand what you are doing.
   */
  baseCurrency: string,

  /**
   * Account roles for CopyFactory2 API
   */
  copyFactoryRoles?: Array<CopyFactoryRoles>,

  /**
   * Flag indicating that risk management API is enabled on account. Default is false
   */
  riskManagementApiEnabled?: boolean,

  /**
   * Flag indicating that MetaStats API is enabled on account. Default is false
   */
  metastatsApiEnabled?: boolean,

  /**
   * Keywords to be used for broker server search. We recommend to include exact broker company name in this list
   */
  keywords?: Array<String>,
}

/**
 * New MetaTrader account replica model
 */
export declare type NewMetaTraderAccountReplicaDto = {
 
  /**
   * Any MetaTrader symbol your broker provides historical market data for. 
   * This value should be specified for G1 accounts only and only in case
   * your MT account fails to connect to broker.
   */
  symbol?: string,

  /**
   * Magic value the trades should be performed using.
   * When manualTrades field is set to true, magic value must be 0
   */
  magic: number,

  /**
   * Quote streaming interval in seconds. Set to 0 in order to receive quotes on each tick.
   * Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   */
  quoteStreamingIntervalInSeconds?: number,

  /**
   * User-defined account tags
   */
  tags?: Array<string>,

  /**
   * Extra information which can be stored together with your account. 
   * Total length of this field after serializing it to JSON is limited to 1024 characters
   */
  metadata?: Object,

  /**
   * Used to increase the reliability of the account. High is a recommended value
   * for production environment. Default value is high
   */
  reliability?: Reliability,

  /**
   * Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots. Default is 1.
   */
  resourceSlots?: number,

  /**
   * Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   */
  copyFactoryResourceSlots?: number,

  /**
   * Region id to deploy account at. One of returned by the /users/current/regions endpoint
   */
  region: string,
}

/**
 * MetaTrader account id and state model
 */
export declare type MetatraderAccountIdDto = {

  /**
   * MetaTrader account unique identifier
   */
  id: string,
  
  /**
   * State of the account. Possible values are 'UNDEPLOYED', 'DEPLOYED', 'DRAFT'
   */
  state: string
}

/**
 * Updated MetaTrader account data
 */
export declare type MetatraderAccountUpdateDto = {

  /**
   * Human-readable account name
   */
  name: string,

  /**
   * MetaTrader account password. The password can be either investor password for read-only
   * access or master password to enable trading features
   */
  password?: string,

  /**
   * MetaTrader server name to connect to
   */
  server: string,

  /**
   * Magic value the trades should be performed using.
   * When manualTrades field is set to true, magic value must be 0
   */
  magic: number,

  /**
   * Flag indicating if trades should be placed as manual trades. Supported for G2 only. Default is false
   */
  manualTrades?: boolean,

  /**
   * Default trade slippage in points. Should be greater or equal to zero. If not specified,
   * system internal setting will be used which we believe is reasonable for most cases
   */
  slippage?: number, 

  /**
   * Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Intervals less than 2.5 seconds are supported only for G2.
   * Default value is 2.5 seconds
   */
  quoteStreamingIntervalInSeconds?: number,

  /**
   * MetaTrader account tags
   */
  tags?: Array<string>,

  /**
   * Extra information which can be stored together with your account
   */
  metadata?: Object,

  /**
   * Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Default is 1
   */
  resourceSlots?: number,

  /**
   * Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   */
  copyFactoryResourceSlots?: number
}

/**
 * Updated MetaTrader account replica data
 */
export declare type UpdatedMetatraderAccountReplicaDto = {

  /**
   * MetaTrader magic to place trades using
   */
  magic: number,

  /**
   * Quote streaming interval in seconds. Set to 0 in order to
   * receive quotes on each tick. Default value is 2.5 seconds. Intervals less than 2.5 seconds are supported
   * only for G2
   */
  quoteStreamingIntervalInSeconds?: number,

  /**
   * MetaTrader account tags
   */
  tags?: Array<string>,

  /**
   * Extra information which can be stored together with your account
   */
  metadata?: Object,

  /**
   * Number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Default is 1
   */
  resourceSlots?: number,

  /**
   * Number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   */
  copyFactoryResourceSlots?: number
}

/**
 * Trading account credentials
 */
export declare type TradingAccountCredentials = {

  /**
   * Trading account login. Only digits are allowed. Required for accounts in draft state
   */
  login?: string,

  /**
   * Trading account password
   */
  password: string,

}

/**
 * Configuration link
 */
export declare type ConfigurationLink = {

  /**
   * Secure link to allow end user to configure account directly
   */
  configurationLink: string,

}

/**
 * Trading account configuration information
 */
export declare type TradingAccountConfigurationInformation = {

  /**
   * Flag indicating the account has been configured
   */
  configured?: boolean,

  /**
   * Trading account login
   */
  login?: string,

  /**
   * Trading account server name
   */
  server: string,

  /**
   * Trading account platform
   */
  platform: Platform

}

