'use strict';

import MetatraderDemoAccount from './metatraderDemoAccount';

/**
 * Exposes MetaTrader demo account API logic to the consumers
 */
export default class MetatraderDemoAccountApi {

  /**
   * Constructs a MetaTrader demo account API instance
   * @param {MetatraderDemoAccountClient} metatraderDemoAccountClient MetaTrader demo account REST API client
   */
  constructor(metatraderDemoAccountClient) {
    this._metatraderDemoAccountClient = metatraderDemoAccountClient;
  }

  /**
   * Creates new MetaTrader 4 demo account
   * @param {String} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT5DemoAccount} account demo account to create
   * @return {Promise<MetatraderDemoAccount>} promise resolving with MetaTrader demo account entity
   */
  async createMT4DemoAccount(profileId, account) {
    let demoAccount = await this._metatraderDemoAccountClient.createMT4DemoAccount(profileId, account);
    return new MetatraderDemoAccount(demoAccount);
  }

  /**
   * Creates new MetaTrader 5 demo account
   * @param {String} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT5DemoAccount} account demo account to create
   * @return {Promise<MetatraderDemoAccount>} promise resolving with MetaTrader demo account entity
   */
  async createMT5DemoAccount(profileId, account) {
    let demoAccount = await this._metatraderDemoAccountClient.createMT5DemoAccount(profileId, account);
    return new MetatraderDemoAccount(demoAccount);
  }

}
