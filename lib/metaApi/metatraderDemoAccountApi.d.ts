import MetatraderDemoAccountClient, { MetatraderDemoAccountDto, NewMT4DemoAccount, NewMT5DemoAccount } from "../clients/metaApi/metatraderDemoAccount.client";
import MetatraderDemoAccount from "./metatraderDemoAccount";

/**
 * Exposes MetaTrader demo account API logic to the consumers
 */
export default class MetatraderDemoAccountApi {
  
  /**
   * Constructs a MetaTrader demo account API instance
   * @param {MetatraderDemoAccountClient} metatraderDemoAccountClient MetaTrader demo account REST API client
   */
  constructor(metatraderDemoAccountClient: MetatraderDemoAccountClient);
  
  /**
   * Creates new MetaTrader 4 demo account
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT4DemoAccount} account demo account to create
   * @return {Promise<MetatraderDemoAccount>} promise resolving with MetaTrader demo account entity
   */
  createMT4DemoAccount(profileId: string, account: NewMT4DemoAccount): Promise<MetatraderDemoAccount>;
  
  /**
   * Creates new MetaTrader 5 demo account
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT5DemoAccount} account demo account to create
   * @return {Promise<MetatraderDemoAccount>} promise resolving with MetaTrader demo account entity
   */
  createMT5DemoAccount(profileId: string, account: NewMT5DemoAccount): Promise<MetatraderDemoAccount>;
}