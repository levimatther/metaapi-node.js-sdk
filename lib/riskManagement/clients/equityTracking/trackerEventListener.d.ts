import {TrackerEvent} from './equityTracking.client';

/**
 * Tracker event listener for handling a stream of profit/drawdown events
 */
export default class TrackerEventListener {

  /**
   * Processes profit/drawdown event which occurs when a profit/drawdown limit is exceeded in a tracker
   * @param {TrackerEvent} trackerEvent profit/drawdown event
   */
  onTrackerEvent(trackerEvent: TrackerEvent): Promise<void>;

  /**
   * Processes an error event
   * @param {Error} error error received 
   */
  onError(error: Error): Promise<void>;

}
