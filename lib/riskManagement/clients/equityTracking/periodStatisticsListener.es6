'use strict';

/**
 * Period statistics event listener for handling a stream of period statistics events
 */
export default class PeriodStatisticsListener {

  /**
   * Creates a period statistics listener instance
   * @param {string} accountId account id
   * @param {string} trackerId tracker id
   */
  constructor(accountId, trackerId) {
    if(!accountId) {
      throw Error('Account id parameter required');
    }
    if(!trackerId) {
      throw Error('Tracker id parameter required');
    }
    this._accountId = accountId;
    this._trackerId = trackerId;
  }

  /**
   * Returns account id
   */
  get accountId() {
    return this._accountId;
  }

  /**
   * Returns tracker id
   */
  get trackerId() {
    return this._trackerId;
  }

  /**
   * Processes period statistics event which occurs when new period statistics data arrives
   * @param {PeriodStatistics[]} periodStatisticsEvent period statistics event
   */
  async onPeriodStatisticsUpdated(periodStatisticsEvent) {
    throw Error('Abstract method onPeriodStatisticsUpdated has no implementation');
  }

  /**
   * Processes period statistics event which occurs when a statistics period ends
   */
  async onPeriodStatisticsCompleted() {
    throw Error('Abstract method onPeriodStatisticsCompleted has no implementation');
  }

  /**
   * Processes period statistics event which occurs when the tracker period ends
   */
  async onTrackerCompleted(){
    throw Error('Abstract method onTrackerCompleted has no implementation');
  }

  /**
   * Processes an event which occurs when connection has been established
   */
  async onConnected() {
    throw Error('Abstract method onConnected has no implementation');
  }

  /**
   * Processes an event which occurs when connection has been lost
   */
  async onDisconnected() {
    throw Error('Abstract method onDisconnected has no implementation');
  }

  /**
   * Processes an error event
   * @param {Error} error error received 
   */
  async onError(error) {}

}