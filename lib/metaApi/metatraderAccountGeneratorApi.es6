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
   * @param {NewMT4DemoAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  async createMT4DemoAccount(account, profileId) {
    let mtAccount = await this._metatraderAccountGeneratorClient.createMT4DemoAccount(account, profileId);
    return new MetatraderAccountCredentials(mtAccount);
  }

  /**
   * Creates new MetaTrader 5 demo account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT5DemoAccount/
   * @param {NewMT5DemoAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  async createMT5DemoAccount(account, profileId) {
    let mtAccount = await this._metatraderAccountGeneratorClient.createMT5DemoAccount(account, profileId);
    return new MetatraderAccountCredentials(mtAccount);
  }

}
