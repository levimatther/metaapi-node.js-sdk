import MetatraderAccountGeneratorClient, { MetatraderAccountCredentialsDto, NewMT4DemoAccount, NewMT4LiveAccount, NewMT5DemoAccount, NewMT5LiveAccount } from "../clients/metaApi/metatraderAccountGenerator.client";
import MetatraderAccountCredentials from "./metatraderAccountCredentials";

/**
 * Exposes MetaTrader account generator API logic to the consumers
 */
export default class MetatraderAccountGeneratorApi {
  
  /**
   * Constructs a MetaTrader account generator API instance
   * @param {MetatraderAccountGeneratorClient} metatraderAccountGeneratorClient MetaTrader account generator REST API
   * client
   */
  constructor(metatraderAccountGeneratorClient: MetatraderAccountGeneratorClient);

  /**
   * Creates new MetaTrader 4 demo account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT4DemoAccount/
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT4DemoAccount} account account to create
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  createMT4DemoAccount(profileId: string, account: NewMT4DemoAccount): Promise<MetatraderAccountCredentials>;

  /**
   * Creates new MetaTrader 4 live account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT4LiveAccount/
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT4LiveAccount} account account to create
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  createMT4LiveAccount(profileId: string, account: NewMT4LiveAccount): Promise<MetatraderAccountCredentials>;

  /**
   * Creates new MetaTrader 5 demo account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT5DemoAccount/
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT5DemoAccount} account account to create
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  createMT5DemoAccount(profileId: string, account: NewMT5DemoAccount): Promise<MetatraderAccountCredentials>;

  /**
   * Creates new MetaTrader 5 live account
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT5LiveAccount} account account to create
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  createMT5LiveAccount(profileId: string, account: NewMT5LiveAccount): Promise<MetatraderAccountCredentials>;

}