import {TrackerEvent} from './equityTracking.client';

/**
 * Tracker event listener for handling a stream of profit/drawdown events
 */
export default class TrackerEventListener {

  /**
   * Creates a tracker event listener instance
   * @param {string} accountId account id
   * @param {string} trackerId tracker id
   */
  constructor(accountId: string, trackerId: string);

  /**
   * Returns account id
   */
  get accountId(): string;

  /**
   * Returns tracker id
   */
  get trackerId(): string;

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
