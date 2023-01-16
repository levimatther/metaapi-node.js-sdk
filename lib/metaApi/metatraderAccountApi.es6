'use strict';

import MetatraderAccount from './metatraderAccount';
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
  constructor(metatraderAccountClient, metaApiWebsocketClient, connectionRegistry, expertAdvisorClient, 
    historicalMarketDataClient, application) {
    this._metatraderAccountClient = metatraderAccountClient;
    this._metaApiWebsocketClient = metaApiWebsocketClient;
    this._connectionRegistry = connectionRegistry;
    this._expertAdvisorClient = expertAdvisorClient;
    this._historicalMarketDataClient = historicalMarketDataClient;
    this._application = application;
  }

  /**
   * Returns trading accounts belonging to the current user
   * @param {AccountsFilter} accountsFilter optional filter
   * @return {Promise<Array<MetatraderAccount>>} promise resolving with an array of MetaTrader account entities
   */
  async getAccounts(accountsFilter) {
    let accounts = await this._metatraderAccountClient.getAccounts(accountsFilter);
    if (accounts.items) {
      accounts = accounts.items;
    }
    return accounts.map(a => new MetatraderAccount(a, this._metatraderAccountClient, this._metaApiWebsocketClient, 
      this._connectionRegistry, this._expertAdvisorClient, this._historicalMarketDataClient, this._application));
  }

  /**
   * Returns trading account by id
   * @param {string} accountId MetaTrader account id
   * @return {Promise<MetatraderAccount>} promise resolving with MetaTrader account entity
   */
  async getAccount(accountId) {
    let account = await this._metatraderAccountClient.getAccount(accountId);
    return new MetatraderAccount(account, this._metatraderAccountClient, this._metaApiWebsocketClient, 
      this._connectionRegistry,  this._expertAdvisorClient, this._historicalMarketDataClient, this._application);
  }

  /**
   * Returns trading account replica by trading account id and replica id
   * @param {string} accountId MetaTrader primary account id
   * @param {string} replicaId MetaTrader account replica id
   * @return {Promise<MetatraderAccountReplica>} promise resolving with MetaTrader account replica found
   */
  async getAccountReplica(accountId, replicaId) {
    let account = await this._metatraderAccountClient.getAccount(accountId);
    let replica = await this._metatraderAccountClient.getAccountReplica(accountId, replicaId);
    return new MetatraderAccountReplica(replica, account, this._metatraderAccountClient);
  }

  /**
   * Returns replicas for a trading account
   * @param {string} accountId Primary account id
   * @return {Promise<Array<MetatraderAccountReplica>>} promise resolving with MetaTrader account replicas found
   */
  async getAccountReplicas(accountId) {
    let account = await this._metatraderAccountClient.getAccount(accountId);
    let replicas = await this._metatraderAccountClient.getAccountReplicas(accountId);
    if (replicas.items) {
      replicas = replicas.items;
    }
    return replicas.map(replica => new MetatraderAccountReplica(replica, account, this._metatraderAccountClient));
  }

  /**
   * Returns trading account by access token
   * @return {Promise<MetatraderAccount>} promise resolving with MetaTrader account entity
   */
  async getAccountByToken() {
    let account = await this._metatraderAccountClient.getAccountByToken();
    return new MetatraderAccount(account, this._metatraderAccountClient, this._metaApiWebsocketClient, 
      this._connectionRegistry, this._expertAdvisorClient, this._historicalMarketDataClient, this._application);
  }

  /**
   * Adds a trading account and starts a cloud API server for the trading account
   * @param {NewMetatraderAccountDto} account MetaTrader account data
   * @return {Promise<MetatraderAccountIdDto>} promise resolving with an id and state of the MetaTrader account created
   */
  async createAccount(account) {
    let id = await this._metatraderAccountClient.createAccount(account);
    return this.getAccount(id.id);
  }

}
