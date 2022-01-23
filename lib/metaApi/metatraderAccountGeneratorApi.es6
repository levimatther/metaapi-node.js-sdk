'use strict';

import MetatraderAccountCredentials from './metatraderAccountCredentials';

/**
 * Exposes MetaTrader account generator API logic to the consumers
 */
export default class MetatraderAccountGeneratorApi {

  /**
   * Constructs a MetaTrader account generator API instance
   * @param {MetatraderAccountGeneratorClient} metatraderAccountGeneratorClient MetaTrader account generator REST API
   * client
   */
  constructor(metatraderAccountGeneratorClient) {
    this._metatraderAccountGeneratorClient = metatraderAccountGeneratorClient;
  }

  /**
   * Creates new MetaTrader 4 demo account.
   * See (https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT4DemoAccount/)
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT4Account} account account to create
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  async createMT4DemoAccount(profileId, account) {
    let mtAccount = await this._metatraderAccountGeneratorClient.createMT4DemoAccount(profileId, account);
    return new MetatraderAccountCredentials(mtAccount);
  }

  /**
   * Creates new MetaTrader 4 live account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT4LiveAccount/
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT4Account} account account to create
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  async createMT4LiveAccount(profileId, account) {
    let mtAccount = await this._metatraderAccountGeneratorClient.createMT4LiveAccount(profileId, account);
    return new MetatraderAccountCredentials(mtAccount);
  }

  /**
   * Creates new MetaTrader 5 demo account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT5DemoAccount/
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT5Account} account account to create
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  async createMT5DemoAccount(profileId, account) {
    let mtAccount = await this._metatraderAccountGeneratorClient.createMT5DemoAccount(profileId, account);
    return new MetatraderAccountCredentials(mtAccount);
  }

  /**
   * Creates new MetaTrader 5 live account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT5LiveAccount/
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT5Account} account account to create
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  async createMT5LiveAccount(profileId, account) {
    let mtAccount = await this._metatraderAccountGeneratorClient.createMT5LiveAccount(profileId, account);
    return new MetatraderAccountCredentials(mtAccount);
  }

}
