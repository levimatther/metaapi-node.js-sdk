'use strict';

/**
 * Implements a MetaTrader demo account entity
 */
export default class MetatraderDemoAccount {

  /**
   * Constructs a MetaTrader demo account entity
   * @param {MetatraderDemoAccountDto} data MetaTrader demo account data
   */
  constructor(data) {
    this._data = data;
  }

  /**
   * Returns account login
   * @return {String} account login
   */
  get login() {
    return this._data.login;
  }

  /**
   * Returns account password
   * @return {String} account password
   */
  get password() {
    return this._data.password;
  }

  /**
   * Returns account serverName
   * @return {String} account login
   */
  get serverName() {
    return this._data.serverName;
  }

}
