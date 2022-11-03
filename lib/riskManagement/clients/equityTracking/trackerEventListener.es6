'use strict';

/**
 * Tracker event listener for handling a stream of profit/drawdown events
 */
export default class TrackerEventListener {

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