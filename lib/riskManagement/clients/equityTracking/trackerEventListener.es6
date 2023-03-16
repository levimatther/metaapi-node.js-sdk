'use strict';

/**
 * Tracker event listener for handling a stream of profit/drawdown events
 */
export default class TrackerEventListener {

  /**
   * Creates a tracker event listener instance
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
   * Processes profit/drawdown event which occurs when a profit/drawdown limit is exceeded in a tracker
   * @param {TrackerEvent} trackerEvent profit/drawdown event
   */
  async onTrackerEvent(trackerEvent) {
    throw Error('Abstract method onTrackerEvent has no implementation');
  }

  /**
   * Processes an error event
   * @param {Error} error error received 
   */
  async onError(error) {}

}