import MetatraderAccountClient, { AccountsFilter, NewMetatraderAccountDto, MetatraderAccountIdDto } from "../clients/metaApi/metatraderAccount.client";
import MetaApiWebsocketClient from "../clients/metaApi/metaApiWebsocket.client";
import ConnectionRegistry from "./connectionRegistry";
import ExpertAdvisorClient from "../clients/metaApi/expertAdvisor.client";
import HistoricalMarketDataClient from "../clients/metaApi/historicalMarketData.client";
import MetatraderAccount from "./metatraderAccount";
import MetatraderAccountReplica from './metatraderAccountReplica';

/**
 * Exposes MetaTrader account API logic to the consumers
 */
export default class MetatraderAccountApi {
  
  /**
   * Constructs a MetaTrader account API instance
   * @param {MetatraderAccountClient} metatraderAccountClient MetaTrader account REST API client
   * @param {MetaApiWebsocketClient} metaApiWebsocketClient MetaApi websocket client
   * @param {ConnectionRegistry} connectionRegistry metatrader account connection registry
   * @param {ExpertAdvisorClient} expertAdvisorClient expert advisor REST API client
   * @param {HistoricalMarketDataClient} historicalMarketDataClient historical market data HTTP API client
   * @param {string} application application name
   */
  constructor(metatraderAccountClient: MetatraderAccountClient, metaApiWebsocketClient: MetaApiWebsocketClient, connectionRegistry: ConnectionRegistry, expertAdvisorClient: ExpertAdvisorClient, 
    historicalMarketDataClient: HistoricalMarketDataClient, application: string);
  
  /**
   * Returns trading accounts belonging to the current user
   * @param {AccountsFilter} accountsFilter optional filter
   * @return {Promise<Array<MetatraderAccount>>} promise resolving with an array of MetaTrader account entities
   */
  getAccounts(accountsFilter: AccountsFilter): Promise<Array<MetatraderAccount>>;
  
  /**
   * Returns trading account by id
   * @param {string} accountId MetaTrader account id
   * @return {Promise<MetatraderAccount>} promise resolving with MetaTrader account entity
   */
  getAccount(accountId: string): Promise<MetatraderAccount>;
  
  /**
   * Returns trading account replica by trading account id and replica id
   * @param {string} accountId MetaTrader primary account id
   * @param {string} replicaId MetaTrader account replica id
   * @return {Promise<MetatraderAccountReplica>} promise resolving with MetaTrader account replica found
   */
  async getAccountReplica(accountId: string, replicaId: string): Promise<MetatraderAccountReplica>;

  /**
   * Returns replicas for a trading account
   * @param {string} accountId Primary account id
   * @return {Promise<Array<MetatraderAccountReplica>>} promise resolving with MetaTrader account replicas found
   */
  async getAccountReplicas(accountId: string): Promise<Array<MetatraderAccountReplica>>;

  /**
   * Returns trading account by access token
   * @return {Promise<MetatraderAccount>} promise resolving with MetaTrader account entity
   */
  getAccountByToken(): Promise<MetatraderAccount>;
  
  /**
   * Adds a trading account and starts a cloud API server for the trading account
   * @param {NewMetatraderAccountDto} account MetaTrader account data
   * @return {Promise<MetatraderAccount>} promise resolving with created MetaTrader account entity
   */
  createAccount(account: NewMetatraderAccountDto): Promise<MetatraderAccount>;

}