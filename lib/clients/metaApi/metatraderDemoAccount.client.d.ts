import MetaApiClient from "../metaApi.client"

/**
 * metaapi.cloud MetaTrader demo account API client
 */
export default class MetatraderDemoAccountClient extends MetaApiClient {
  
  /**
   * Creates new MetaTrader 4 demo account
   * Method is accessible only with API access token
   * @param {String} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT4DemoAccount} account demo account to create
   * @return {Promise<MetatraderDemoAccountDto>} promise resolving with MetaTrader demo account created
   */
  createMT4DemoAccount(profileId: String, account: NewMT4DemoAccount): Promise<MetatraderDemoAccountDto>;
  
  /**
   * Creates new MetaTrader 5 demo account
   * Method is accessible only with API access token
   * @param {String} profileId id of the provisioning profile that will be used as the basis for creating this account
   * @param {NewMT5DemoAccount} account demo account to create
   * @return {Promise<MetatraderDemoAccountDto>} promise resolving with MetaTrader demo account created
   */
   createMT5DemoAccount(profileId: String, account: NewMT5DemoAccount): Promise<MetatraderDemoAccountDto>;
}

/**
 * New MetaTrader 4 demo account model
 */
export declare type NewMT4DemoAccount = {

  /**
   * account type
   */
  accountType?: String,

  /**
   * account holder's address
   */
  address?: String,

  /**
   * account balance
   */
  balance: Number,

  /**
   * account holder's city
   */
  city?: String,

  /**
   * account holder's country
   */
  country?: String,

  /**
   * account holder's email
   */
  email: String,

  /**
   * account leverage
   */
  leverage: Number,

  /**
   * account holder's name
   */
  name?: String,

  /**
   * account holder's phone
   */
  phone?: String,

  /**
   * server name
   */
  serverName?: String,

  /**
   * account holder's state
   */
  state?: String,

  /**
   * zip address
   */
  zip?: String
}

/**
 * New MetaTrader 5 demo account model
 */
export declare type NewMT5DemoAccount = {

  /**
   * account holder's address
   */
  address?: String,

  /**
   * account balance
   */
  balance: Number,

  /**
   * account holder's city
   */
  city?: String,

  /**
   * account holder's country
   */
  country?: String;

  /**
   * account holder's email
   */
  email: String,

  /**
   * language id (default is 1)
   */
  languageId?: Number,

  /**
   * account leverage
   */
  leverage: Number,

  /**
   * account holder's name
   */
  name?: String,

  /**
   * account holder's phone
   */
  phone?: String,

  /**
   * server name
   */
  serverName: String,

  /**
   * account holder's state
   */
  state?: String,

  /**
   * zip address
   */
  zip?: String
}

/**
 * MetaTrader demo account model
 */
export declare type MetatraderDemoAccountDto = {

  /**
   * account login
   */
  login: String,

  /**
   * account password
   */
  password: String,

  /**
   * MetaTrader server name
   */
  serverName: String,

  /**
   * account investor (read-only) password
   */
  investorPassword: String
}