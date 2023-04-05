import { MetatraderAccountDto, MetatraderAccountIdDto } from "../clients/metaApi/metatraderAccount.client";
import MetaApiWebsocketClient, { MetatraderCandle, MetatraderTick } from "../clients/metaApi/metaApiWebsocket.client";
import ConnectionRegistry from "./connectionRegistry";
import ExpertAdvisorClient, { NewExpertAdvisorDto } from "../clients/metaApi/expertAdvisor.client";
import HistoricalMarketDataClient from "../clients/metaApi/historicalMarketData.client";
import HistoryStorage from "./historyStorage";
import RpcMetaApiConnectionInstance from "./rpcMetaApiConnectionInstance";
import ExpertAdvisor from "./expertAdvisor";
import StreamingMetaApiConnectionInstance from "./streamingMetaApiConnectionInstance";
import MetatraderAccountReplica from './metatraderAccountReplica';
import MetatraderAccountClient, {Reliability, State, Version, ConnectionStatus, CopyFactoryRoles, Type, AccountConnection} from '../clients/metaApi/metatraderAccount.client'

/**
 * Implements a MetaTrader account entity
 */
export default class MetatraderAccount {
  
  /**
   * Constructs a MetaTrader account entity
   * @param {MetatraderAccountDto} data MetaTrader account data
   * @param {MetatraderAccountClient} metatraderAccountClient MetaTrader account REST API client
   * @param {MetaApiWebsocketClient} metaApiWebsocketClient MetaApi websocket client
   * @param {ConnectionRegistry} connectionRegistry metatrader account connection registry
   * @param {ExpertAdvisorClient} expertAdvisorClient expert advisor REST API client
   * @param {HistoricalMarketDataClient} historicalMarketDataClient historical market data HTTP API client
   * @param {string} application application name
   */
  constructor(data: MetatraderAccountDto, metatraderAccountClient: MetatraderAccountClient, metaApiWebsocketClient: MetaApiWebsocketClient, connectionRegistry: ConnectionRegistry, expertAdvisorClient: ExpertAdvisorClient, 
    historicalMarketDataClient: HistoricalMarketDataClient, application: string);
  
  /**
   * Returns unique account id
   * @return {string} unique account id
   */
  get id(): string;

  /**
   * Returns current account state. One of CREATED, DEPLOYING, DEPLOYED, DEPLOY_FAILED, UNDEPLOYING,
   * UNDEPLOYED, UNDEPLOY_FAILED, DELETING, DELETE_FAILED, REDEPLOY_FAILED, DRAFT
   * @return {State} current account state
   */
  get state(): State;

  /**
   * Returns MetaTrader magic to place trades using
   * @return {number} MetaTrader magic to place trades using
   */
  get magic(): number;

  /**
   * Returns terminal & broker connection status, one of CONNECTED, DISCONNECTED, DISCONNECTED_FROM_BROKER
   * @return {ConnectionStatus} terminal & broker connection status
   */
  get connectionStatus(): ConnectionStatus;
  
  /**
   * Returns quote streaming interval in seconds 
   * @return {number} quote streaming interval in seconds
   */
  get quoteStreamingIntervalInSeconds(): number;
  
  /**
   * Returns symbol provided by broker 
   * @return {string} any symbol provided by broker
   */
  get symbol(): string;
  
  /**
   * Returns reliability value. Possible values are regular and high
   * @return {Reliability} account reliability value
   */
  get reliability(): Reliability;
  
  /**
   * Returns user-defined account tags
   * @return {Array<string>} user-defined account tags
   */
  get tags(): Array<string>;

  /**
   * Returns extra information which can be stored together with your account
   * @return {Object} extra information which can be stored together with your account
   */
  get metadata(): Object;

   /**
   * Returns number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CopyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots.
   * @return {number} number of resource slots to allocate to account
   */
  get resourceSlots(): number;

  /**
   * Returns the number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * @return {number} number of CopyFactory 2 resource slots to allocate to account
   */
  get copyFactoryResourceSlots(): number;

  /**
   * Returns account region
   * @return {string} account region value
   */
  get region(): string;

  /**
   * Returns the time account was created at, in ISO format
   * @returns {string} the time account was created at, in ISO format
   */
  get createdAt(): Date;

  /**
   * Returns human-readable account name
   * @return {string} human-readable account name
   */
  get name(): string;
  
  /**
   * Returns flag indicating if trades should be placed as manual trades on this account
   * @return {boolean} flag indicating if trades should be placed as manual trades on this account
   */
  get manualTrades(): boolean;

  /**
   * Returns default trade slippage in points
   * @return {number} default trade slippage in points
   */
  get slippage(): number;
  
  /**
   * Returns id of the account's provisioning profile
   * @return {string} id of the account's provisioning profile
   */
  get provisioningProfileId(): string;
  
  /**
   * Returns MetaTrader account login
   * @return {string} MetaTrader account number
   */
  get login(): string;
  
  /**
   * Returns MetaTrader server name to connect to
   * @return {string} MetaTrader server name to connect to
   */
  get server(): string;

  /**
   * Returns account type. Possible values are cloud-g1, cloud-g2
   * @return {Type} account type
   */
  get type(): Type;

  /**
   * Returns MT version. Possible values are 4 and 5
   * @return {Version} MT version
   */
  get version(): Version;

  /**
   * Returns hash-code of the account
   * @return {number} hash-code of the account
   */
  get hash(): number;

  /**
   * Returns 3-character ISO currency code of the account base currency. The setting is to be used
   * for copy trading accounts which use national currencies only, such as some Brazilian brokers. You should not alter
   * this setting unless you understand what you are doing.
   * @return {number} 3-character ISO currency code of the account base currency
   */
  get baseCurrency(): number;

  /**
   * Returns account roles for CopyFactory2 application. Possible values are `PROVIDER` and `SUBSCRIBER`
   * @return {Array<CopyFactoryRoles>} account roles for CopyFactory2 application
   */
  get copyFactoryRoles(): Array<CopyFactoryRoles>;
  
  /**
   * Returns flag indicating that risk management API is enabled on account
   * @return {boolean} flag indicating that risk management API is enabled on account
   */
  get riskManagementApiEnabled(): boolean;

  /**
   * Returns flag indicating that MetaStats hourly tarification is enabled on account
   * @return {boolean} flag indicating that MetaStats hourly tarification is enabled on account
   */
  get metastatsHourlyTarificationEnabled(): boolean;
    
  /**
   * Returns authorization access token to be used for accessing single account data.
   * Intended to be used in browser API.
   * @return {string} authorization token
   */
  get accessToken(): string;
  
  /**
   * Returns active account connections
   * @return {Array<AccountConnection>} active account connections
   */
  get connections(): Array<AccountConnection>;

  /**
   * Returns flag indicating that account is primary
   * @return {boolean} flag indicating that account is primary
   */
  get primaryReplica(): boolean;

  /**
   * Returns user id
   * @return {string} user id
   */
  get userId(): string;

  /**
   * Returns primary account id
   * @return {string} primary account id
   */
  get primaryAccountId(): string

  /**
   * Returns account replicas from DTO
   * @return {MetatraderAccountReplica[]} account replicas from DTO
   */
  get accountReplicas(): MetatraderAccountReplica[];

  /**
   * Returns account replica list
   * @return {MetatraderAccountReplica[]} account replica list
   */
  get replicas(): MetatraderAccountReplica[];

  /**
   * Returns a dictionary with account's available regions and replicas
   * @returns {[id: string]: string}
   */
  get accountRegions(): {[id: string]: string};

  /**
   * Reloads MetaTrader account from API
   * @return {Promise} promise resolving when MetaTrader account is updated
   */
  reload(): Promise<any>;
  
  /**
   * Removes a trading account and stops the API server serving the account.
   * The account state such as downloaded market data history will be removed as well when you remove the account.
   * @return {Promise} promise resolving when account is scheduled for deletion
   */
  remove(): Promise<any>;
  
  /**
   * Starts API server and trading terminal for trading account.
   * This request will be ignored if the account is already deployed.
   * @returns {Promise} promise resolving when account is scheduled for deployment
   */
  deploy(): Promise<any>;
  
  /**
   * Stops API server and trading terminal for trading account.
   * This request will be ignored if trading account is already undeployed
   * @returns {Promise} promise resolving when account is scheduled for undeployment
   */
  undeploy(): Promise<any>;
  
  /**
   * Redeploys trading account. This is equivalent to undeploy immediately followed by deploy
   * @returns {Promise} promise resolving when account is scheduled for redeployment
   */
  redeploy(): Promise<any>;
  
  /**
   * Increases trading account reliability in order to increase the expected account uptime.
   * The account will be temporary stopped to perform this action.
   * Note that increasing reliability is a paid option
   * @returns {Promise} promise resolving when account reliability is increased
   */
  increaseReliability(): Promise<any>;
  
  /**
   * Enables risk management API for trading account.
   * The account will be temporary stopped to perform this action.
   * Note that risk management API is a paid option
   * @returns {Promise} promise resolving when account risk management is enabled
   */
  enableRiskManagementApi(): Promise<any>;

  /**
   * Enables MetaStats hourly tarification for trading account.
   * The account will be temporary stopped to perform this action.
   * Note that this is a paid option
   * @returns {Promise} promise resolving when account MetaStats hourly tarification is enabled
   */
  enableMetastatsHourlyTarification(): Promise<any>;

  /**
   * Waits until API server has finished deployment and account reached the DEPLOYED state
   * @param {number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account is deployed
   */
  waitDeployed(timeoutInSeconds?: number, intervalInMilliseconds?: number): Promise<any>;
  
  /**
   * Waits until API server has finished undeployment and account reached the UNDEPLOYED state
   * @param {number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account is deployed
   */
  waitUndeployed(timeoutInSeconds?: number, intervalInMilliseconds?: number): Promise<any>;
  
  /**
   * Waits until account has been deleted
   * @param {number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account is deleted
   */
  waitRemoved(timeoutInSeconds?: number, intervalInMilliseconds?: number): Promise<any>;
  
  /**
   * Waits until API server has connected to the terminal and terminal has connected to the broker
   * @param {number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when API server is connected to the broker
   */
  waitConnected(timeoutInSeconds?: number, intervalInMilliseconds?: number): Promise<any>;
  
  /**
   * Connects to MetaApi. There is only one connection per account. Subsequent calls to this method will return the same connection.
   * @param {HistoryStorage} historyStorage optional history storage
   * @param {Date} [historyStartTime] history start time. Used for tests
   * @return {StreamingMetaApiConnectionInstance} MetaApi connection instance
   */
  getStreamingConnection(historyStorage?: HistoryStorage, historyStartTime?: Date): StreamingMetaApiConnectionInstance;
  
  /**
   * Connects to MetaApi via RPC connection instance.
   * @returns {RpcMetaApiConnectionInstance} MetaApi connection instance
   */
  getRPCConnection(): RpcMetaApiConnectionInstance;
  
  /**
   * Creates a trading account replica in a region different from trading account region and starts a cloud API server for it
   * @param {NewMetaTraderAccountReplicaDto} account MetaTrader account data
   * @return {Promise<MetatraderAccountReplica>} promise resolving with created MetaTrader account replica entity
   */
  createReplica(account: NewMetaTraderAccountReplicaDto): Promise<MetatraderAccountReplica>;

  /**
   * Updates trading account. 
   * Please redeploy the trading account in order for updated settings to take effect
   * @param {MetatraderAccountUpdateDto} account updated account information
   * @return {Promise} promise resolving when account is updated
   */
  update(account: MetatraderAccountUpdateDto): Promise<any>;
  
  /**
   * Retrieves expert advisor of current account
   * @returns {Promise<ExpertAdvisor[]>} promise resolving with an array of expert advisor entities
   */
  getExpertAdvisors(): Promise<ExpertAdvisor[]>;
  
  /**
   * Retrieves a expert advisor of current account by id
   * @param {string} expertId expert advisor id
   * @returns {Promise<ExpertAdvisor>} promise resolving with expert advisor entity
   */
  getExpertAdvisor(expertId: string): Promise<ExpertAdvisor>;
  
  /**
   * Creates an expert advisor
   * @param {string} expertId expert advisor id
   * @param {NewExpertAdvisorDto} expert expert advisor data
   * @returns {Promise<ExpertAdvisor>} promise resolving with expert advisor entity
   */
  createExpertAdvisor(expertId: string, expert: NewExpertAdvisorDto): Promise<ExpertAdvisor>;
  
  /**
   * Returns historical candles for a specific symbol and timeframe from the MetaTrader account.
   * See https://metaapi.cloud/docs/client/restApi/api/retrieveMarketData/readHistoricalCandles/
   * @param {string} symbol symbol to retrieve candles for (e.g. a currency pair or an index)
   * @param {string} timeframe defines the timeframe according to which the candles must be generated. Allowed values
   * for MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed
   * values for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   * @param {Date} [startTime] time to start loading candles from. Note that candles are loaded in backwards direction, so
   * this should be the latest time. Leave empty to request latest candles.
   * @param {number} [limit] maximum number of candles to retrieve. Must be less or equal to 1000
   * @return {Promise<Array<MetatraderCandle>>} promise resolving with historical candles downloaded
   */
  getHistoricalCandles(symbol: string, timeframe: string, startTime?: Date, limit?: number): Promise<Array<MetatraderCandle>>;
  
  /**
   * Returns historical ticks for a specific symbol from the MetaTrader account. This API is not supported by MT4
   * accounts.
   * See https://metaapi.cloud/docs/client/restApi/api/retrieveMarketData/readHistoricalTicks/
   * @param {string} symbol symbol to retrieve ticks for (e.g. a currency pair or an index)
   * @param {Date} [startTime] time to start loading ticks from. Note that candles are loaded in forward direction, so
   * this should be the earliest time. Leave empty to request latest candles.
   * @param {number} [offset] number of ticks to skip (you can use it to avoid requesting ticks from previous request
   * twice)
   * @param {number} [limit] maximum number of ticks to retrieve. Must be less or equal to 1000
   * @return {Promise<Array<MetatraderTick>>} promise resolving with historical ticks downloaded
   */
  getHistoricalTicks(symbol: string, startTime?: Date, offset?: number, limit?: number): Promise<Array<MetatraderTick>>;

  /**
   * Generates trading account configuration link by account id.
   * @param {number} [ttlInDays] Lifetime of the link in days. Default is 7.
   * @return {Promise<ConfigurationLink>} promise resolving with configuration link
   */
  createConfigurationLink(ttlInDays?: number): Promise<ConfigurationLink>
}
