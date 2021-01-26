'use strict';

import SynchronizationListener from '../clients/metaApi/synchronizationListener';

/**
 * Abstract class which defines MetaTrader history storage interface.
 */
export default class HistoryStorage extends SynchronizationListener {

  /**
   * Constructs the history storage
   */
  constructor() {
    super();
    this._orderSynchronizationFinished = {};
    this._dealSynchronizationFinished = {};
  }

  /**
   * Returns flag indicating whether order history synchronization have finished
   * @return {Boolean} flag indicating whether order history synchronization have finished
   */
  get orderSynchronizationFinished() {
    return Object.values(this._orderSynchronizationFinished).reduce((acc, r) => acc || r, false);
  }

  /**
   * Returns flag indicating whether deal history synchronization have finished
   * @return {Boolean} flag indicating whether deal history synchronization have finished
   */
  get dealSynchronizationFinished() {
    return Object.values(this._dealSynchronizationFinished).reduce((acc, r) => acc || r, false);
  }

  /**
   * Returns the time of the last history order record stored in the history storage
   * @param {Number} [instanceIndex] index of an account instance connected
   * @returns {Date} the time of the last history order record stored in the history storage
   */
  async lastHistoryOrderTime(instanceIndex) {}

  /**
   * Returns the time of the last history deal record stored in the history storage
   * @param {Number} [instanceIndex] index of an account instance connected
   * @returns {Date} the time of the last history deal record stored in the history storage
   */
  async lastDealTime(instanceIndex) {}

  /**
   * Invoked when a new MetaTrader history order is added
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHistoryOrderAdded(instanceIndex, historyOrder) {}

  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderDeal} deal new MetaTrader history deal
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealAdded(instanceIndex, deal) {}

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished
   * @param {Number} instanceIndex index of an account instance connected
   */
  onDealSynchronizationFinished(instanceIndex) {
    this._dealSynchronizationFinished['' + instanceIndex] = true;
  }

  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished
   * @param {Number} instanceIndex index of an account instance connected
   */
  onOrderSynchronizationFinished(instanceIndex) {
    this._orderSynchronizationFinished['' + instanceIndex] = true;
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {Number} instanceIndex index of an account instance connected
   */
  onConnected(instanceIndex) {
    this._orderSynchronizationFinished['' + instanceIndex] = false;
    this._dealSynchronizationFinished['' + instanceIndex] = false;
  }

}
