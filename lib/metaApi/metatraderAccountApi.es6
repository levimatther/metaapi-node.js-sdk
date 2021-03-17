'use strict';

import MetatraderAccount from './metatraderAccount';

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
   */
  constructor(metatraderAccountClient, metaApiWebsocketClient, connectionRegistry, expertAdvisorClient) {
    this._metatraderAccountClient = metatraderAccountClient;
    this._metaApiWebsocketClient = metaApiWebsocketClient;
    this._connectionRegistry = connectionRegistry;
    this._expertAdvisorClient = expertAdvisorClient;
  }

  /**
   * Retrieves MetaTrader accounts
   * @param {AccountsFilter} accountsFilter optional filter
   * @return {Promise<Array<MetatraderAccount>>} promise resolving with an array of MetaTrader account entities
   */
  async getAccounts(accountsFilter) {
    let accounts = await this._metatraderAccountClient.getAccounts(accountsFilter);
    if (accounts.items) {
      accounts = accounts.items;
    }
    return accounts.map(a => new MetatraderAccount(a, this._metatraderAccountClient, this._metaApiWebsocketClient, 
      this._connectionRegistry, this._expertAdvisorClient));
  }

  /**
   * Retrieves a MetaTrader account by id
   * @param {String} accountId MetaTrader account id
   * @return {Promise<MetatraderAccount>} promise resolving with MetaTrader account entity
   */
  async getAccount(accountId) {
    let account = await this._metatraderAccountClient.getAccount(accountId);
    return new MetatraderAccount(account, this._metatraderAccountClient, this._metaApiWebsocketClient, 
      this._connectionRegistry, this._expertAdvisorClient);
  }

  /**
   * Retrieves a MetaTrader account by token
   * @return {Promise<MetatraderAccount>} promise resolving with MetaTrader account entity
   */
  async getAccountByToken() {
    let account = await this._metatraderAccountClient.getAccountByToken();
    return new MetatraderAccount(account, this._metatraderAccountClient, this._metaApiWebsocketClient, 
      this._connectionRegistry, this._expertAdvisorClient);
  }

  /**
   * Creates a MetaTrader account
   * @param {NewMetatraderAccountDto} account MetaTrader account data
   * @return {Promise<MetatraderAccount>} promise resolving with MetaTrader account entity
   */
  async createAccount(account) {
    let id = await this._metatraderAccountClient.createAccount(account);
    return this.getAccount(id.id);
  }

}
