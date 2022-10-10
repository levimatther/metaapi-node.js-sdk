import DomainClient from '../domain.client';
import TrackerEventListener from './trackerEventListener';

/**
 * Manager for handling tracking event listeners
 */
export default class TrackerEventListenerManager {

  /**
   * Constructs tracker event listener manager instance
   * @param {DomainClient} domainClient domain client
   */
  constructor(domainClient: DomainClient);

  /**
   * Returns the dictionary of tracker event listeners
   * @returns {{[listenerId: string]: TrackerEventListener}} dictionary of tracker event listeners
   */
  get trackerEventListeners(): {[listenerId: string]: TrackerEventListener};

  /**
   * Adds a tracker event listener
   * @param {TrackerEventListener} listener 
   * @param {String} [accountId] account id
   * @param {String} [trackerId] tracker id
   * @param {Number} [sequenceNumber] event sequence number
   * @returns {String} tracker event listener id
   */
  addTrackerEventListener(listener: TrackerEventListener, accountId?: string, trackerId?: string,
    sequenceNumber?: number): string;

  /**
   * Removes tracker event listener by id
   * @param {String} listenerId listener id 
   */
  removeTrackerEventListener(listenerId: string): void;

}
