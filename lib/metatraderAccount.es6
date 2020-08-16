'use strict';

import TimeoutError from './clients/timeoutError';
import MetaApiConnection from './metaApiConnection';
import HistoryFileManager from './historyFileManager/index';

/**
 * Implements a MetaTrader account entity
 */
export default class MetatraderAccount {

  /**
   * Constructs a MetaTrader account entity
   * @param {MetatraderAccountDto} data MetaTrader account data
   * @param {MetatraderAccountClient} metatraderAccountClient MetaTrader account REST API client
   * @param {MetaApiWebsocketClient} metaApiWebsocketClient MetaApi websocket client
   */
  constructor(data, metatraderAccountClient, metaApiWebsocketClient) {
    this._data = data;
    this._metatraderAccountClient = metatraderAccountClient;
    this._metaApiWebsocketClient = metaApiWebsocketClient;
  }

  /**
   * Returns account id
   * @return {String} account id
   */
  get id() {
    return this._data._id;
  }

  /**
   * Returns account name
   * @return {String} account name
   */
  get name() {
    return this._data.name;
  }

  /**
   * Returns account type. Possible values are cloud and self-hosted.
   * @return {String} account type
   */
  get type() {
    return this._data.type;
  }

  /**
   * Returns account login
   * @return {String} account login
   */
  get login() {
    return this._data.login;
  }

  /**
   * Returns MetaTrader server which hosts the account
   * @return {String} MetaTrader server which hosts the account
   */
  get server() {
    return this._data.server;
  }

  /**
   * Returns synchronization mode, can be automatic or user. See
   * https://metaapi.cloud/docs/client/websocket/synchronizationMode/ for more details.
   * @return {String} synchronization mode
   */
  get synchronizationMode() {
    return this._data.synchronizationMode;
  }

  /**
   * Returns id of the account's provisioning profile
   * @return {String} id of the account's provisioning profile
   */
  get provisioningProfileId() {
    return this._data.provisioningProfileId;
  }

  /**
   * Returns algorithm used to parse your broker timezone. Supported values are icmarkets for
   * America/New_York DST switch and roboforex for EET DST switch (the values will be changed soon)
   * @return {String} algorithm used to parse your broker timezone
   */
  get timeConverter() {
    return this._data.timeConverter;
  }

  /**
   * Returns application name to connect the account to. Currently allowed values are MetaApi and AgiliumTrade
   * @return {String} application name to connect the account to
   */
  get application() {
    return this._data.application;
  }

  /**
   * Returns MetaTrader magic to place trades using
   * @return {Number} MetaTrader magic to place trades using
   */
  get magic() {
    return this._data.magic;
  }

  /**
   * Returns account deployment state. One of CREATED, DEPLOYING, DEPLOYED, UNDEPLOYING, UNDEPLOYED, DELETING
   * @return {String} account deployment state
   */
  get state() {
    return this._data.state;
  }

  /**
   * Returns terminal & broker connection status, one of CONNECTED, DISCONNECTED, DISCONNECTED_FROM_BROKER
   * @return {String} terminal & broker connection status
   */
  get connectionStatus() {
    return this._data.connectionStatus;
  }

  /**
   * Returns authorization access token to be used for accessing single account data.
   * Intended to be used in browser API.
   * @return {String} authorization token
   */
  get accessToken() {
    return this._data.accessToken;
  }

  /**
   * Returns flag indicating if trades should be placed as manual trades on this account
   * @return {Boolean} flag indicating if trades should be placed as manual trades on this account
   */
  get manualTrades() {
    return !!this._data.manualTrades;
  }

  /**
   * Reloads MetaTrader account from API
   * @return {Promise} promise resolving when MetaTrader account is updated
   */
  async reload() {
    this._data = await this._metatraderAccountClient.getAccount(this.id);
  }

  /**
   * Removes MetaTrader account. Cloud account transitions to DELETING state. 
   * It takes some time for an account to be eventually deleted. Self-hosted 
   * account is deleted immediately.
   * @return {Promise} promise resolving when account is scheduled for deletion
   */
  async remove() {
    await this._metatraderAccountClient.deleteAccount(this.id);
    const fileManager = new HistoryFileManager(this.id);
    await fileManager.deleteStorageFromDisk();
    if (this.type !== 'self-hosted') {
      try {
        await this.reload();
      } catch (err) {
        if (err.name !== 'NotFoundError') {
          throw err;
        }
      }
    }
  }

  /**
   * Schedules account for deployment. It takes some time for API server to be started and account to reach the DEPLOYED
   * state
   * @returns {Promise} promise resolving when account is scheduled for deployment
   */
  async deploy() {
    await this._metatraderAccountClient.deployAccount(this.id);
    await this.reload();
  }

  /**
   * Schedules account for undeployment. It takes some time for API server to be stopped and account to reach the
   * UNDEPLOYED state
   * @returns {Promise} promise resolving when account is scheduled for undeployment
   */
  async undeploy() {
    await this._metatraderAccountClient.undeployAccount(this.id);
    await this.reload();
  }

  /**
   * Schedules account for redeployment. It takes some time for API server to be restarted and account to reach the
   * DEPLOYED state
   * @returns {Promise} promise resolving when account is scheduled for redeployment
   */
  async redeploy() {
    await this._metatraderAccountClient.redeployAccount(this.id);
    await this.reload();
  }

  /**
   * Waits until API server has finished deployment and account reached the DEPLOYED state
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account is deployed
   * @throws {TimeoutError} if account have not reached the DEPLOYED state withing timeout allowed
   */
  async waitDeployed(timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    let startTime = Date.now();
    await this.reload();
    while (this.state !== 'DEPLOYED' && (startTime + timeoutInSeconds * 1000) > Date.now()) {
      await this._delay(intervalInMilliseconds);
      await this.reload();
    }
    if (this.state !== 'DEPLOYED') {
      throw new TimeoutError('Timed out waiting for account ' + this.id + ' to be deployed');
    }
  }

  /**
   * Waits until API server has finished undeployment and account reached the UNDEPLOYED state
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account is deployed
   * @throws {TimeoutError} if account have not reached the UNDEPLOYED state withing timeout allowed
   */
  async waitUndeployed(timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    let startTime = Date.now();
    await this.reload();
    while (this.state !== 'UNDEPLOYED' && (startTime + timeoutInSeconds * 1000) > Date.now()) {
      await this._delay(intervalInMilliseconds);
      await this.reload();
    }
    if (this.state !== 'UNDEPLOYED') {
      throw new TimeoutError('Timed out waiting for account ' + this.id + ' to be undeployed');
    }
  }

  /**
   * Waits until account has been deleted
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account is deleted
   * @throws {TimeoutError} if account was not deleted withing timeout allowed
   */
  async waitRemoved(timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    let startTime = Date.now();
    try {
      await this.reload();
      while (startTime + timeoutInSeconds * 1000 > Date.now()) {
        await this._delay(intervalInMilliseconds);
        await this.reload();
      }
      throw new TimeoutError('Timed out waiting for account ' + this.id + ' to be deleted');
    } catch (err) {
      if (err.name === 'NotFoundError') {
        return;
      } else {
        throw err;
      }
    }
  }

  /**
   * Waits until API server has connected to the terminal and terminal has connected to the broker
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when API server is connected to the broker
   * @throws {TimeoutError} if account have not connected to the broker withing timeout allowed
   */
  async waitConnected(timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    let startTime = Date.now();
    await this.reload();
    while (this.connectionStatus !== 'CONNECTED' && (startTime + timeoutInSeconds * 1000) > Date.now()) {
      await this._delay(intervalInMilliseconds);
      await this.reload();
    }
    if (this.connectionStatus !== 'CONNECTED') {
      throw new TimeoutError('Timed out waiting for account ' + this.id + ' to connect to the broker');
    }
  }

  /**
   * Connects to MetaApi
   * @param {HistoryStorage} historyStorage optional history storage
   * @returns {MetaApiConnection} MetaApi connection
   */
  async connect(historyStorage) {
    let connection = new MetaApiConnection(this._metaApiWebsocketClient, this, historyStorage);
    if(this.synchronizationMode === 'user') {
      await connection.initialize();
    }
    await connection.subscribe();
    return connection;
  }

  /**
   * Updates MetaTrader account data
   * @param {MetatraderAccountUpdateDto} account MetaTrader account update
   * @return {Promise} promise resolving when account is updated
   */
  async update(account) {
    await this._metatraderAccountClient.updateAccount(this.id, account);
    await this.reload();
  }

  _delay(timeoutInMilliseconds) {
    return new Promise(res => setTimeout(res, timeoutInMilliseconds));
  }

}
