import { MetatraderDemoAccountDto } from "../clients/metaApi/metatraderDemoAccount.client";

/**
 * Implements a MetaTrader demo account entity
 */
export default class MetatraderDemoAccount {
  
  /**
   * Constructs a MetaTrader demo account entity
   * @param {MetatraderDemoAccountDto} data MetaTrader demo account data
   */
  constructor(data: MetatraderDemoAccountDto);
  
  /**
   * Returns account login
   * @return {String} account login
   */
  get login(): String;
  
  /**
   * Returns account password
   * @return {String} account password
   */
  get password(): String;
  
  /**
   * Returns account serverName
   * @return {String} account serverName
   */
  get serverName(): String;
  
  /**
   * Returns account investor password
   * @return {String} account investor password
   */
  get investorPassword(): String
}