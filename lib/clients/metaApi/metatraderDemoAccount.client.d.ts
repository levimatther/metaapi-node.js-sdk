import MetaApiClient from "../metaApi.client"

/**
 * metaapi.cloud MetaTrader demo account API client
 */
export default class MetatraderDemoAccountClient extends MetaApiClient {
  
  /**
   * Creates new MetaTrader 4 demo account
   * Method is accessible only with API access token
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT4DemoAccount} account demo account to create
   * @return {Promise<MetatraderDemoAccountDto>} promise resolving with MetaTrader demo account created
   */
  createMT4DemoAccount(profileId: string, account: NewMT4DemoAccount): Promise<MetatraderDemoAccountDto>;
  
  /**
   * Creates new MetaTrader 5 demo account
   * Method is accessible only with API access token
   * @param {string} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT5DemoAccount} account demo account to create
   * @return {Promise<MetatraderDemoAccountDto>} promise resolving with MetaTrader demo account created
   */
   createMT5DemoAccount(profileId: string, account: NewMT5DemoAccount): Promise<MetatraderDemoAccountDto>;
}

/**
 * New MetaTrader 4 demo account model
 */
export declare type NewMT4DemoAccount = {

  /**
   * account type
   */
  accountType?: string,

  /**
   * account holder's address
   */
  address?: string,

  /**
   * account balance
   */
  balance: number,

  /**
   * account holder's city
   */
  city?: string,

  /**
   * account holder's country
   */
  country?: string,

  /**
   * account holder's email
   */
  email: string,

  /**
   * account leverage
   */
  leverage: number,

  /**
   * account holder's name
   */
  name?: string,

  /**
   * account holder's phone
   */
  phone?: string,

  /**
   * server name
   */
  serverName?: string,

  /**
   * account holder's state
   */
  state?: string,

  /**
   * zip address
   */
  zip?: string
}

/**
 * New MetaTrader 5 demo account model
 */
export declare type NewMT5DemoAccount = {

  /**
   * account holder's address
   */
  address?: string,

  /**
   * account balance
   */
  balance: number,

  /**
   * account holder's city
   */
  city?: string,

  /**
   * account holder's country
   */
  country?: string;

  /**
   * account holder's email
   */
  email: string,

  /**
   * language id (default is 1)
   */
  languageId?: number,

  /**
   * account leverage
   */
  leverage: number,

  /**
   * account holder's name
   */
  name?: string,

  /**
   * account holder's phone
   */
  phone?: string,

  /**
   * server name
   */
  serverName: string,

  /**
   * account holder's state
   */
  state?: string,

  /**
   * zip address
   */
  zip?: string
}

/**
 * MetaTrader demo account model
 */
export declare type MetatraderDemoAccountDto = {

  /**
   * account login
   */
  login: string,

  /**
   * account password
   */
  password: string,

  /**
   * MetaTrader server name
   */
  serverName: string,

  /**
   * account investor (read-only) password
   */
  investorPassword: string
}