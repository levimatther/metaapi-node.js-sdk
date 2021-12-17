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
   * @return {string} account login
   */
  get login(): string;
  
  /**
   * Returns account password
   * @return {string} account password
   */
  get password(): string;
  
  /**
   * Returns account serverName
   * @return {string} account serverName
   */
  get serverName(): string;
  
  /**
   * Returns account investor password
   * @return {string} account investor password
   */
  get investorPassword(): string
}