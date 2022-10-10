'use strict';

import randomstring from 'randomstring';

/**
 * Manager for handling tracking event listeners
 */
export default class TrackerEventListenerManager {

  /**
   * Constructs tracker event listener manager instance
   * @param {DomainClient} domainClient domain client
   */
  constructor(domainClient) {
    this._domainClient = domainClient;
    this._trackerEventListeners = {};
    this._errorThrottleTime = 1000;
  }

  /**
   * Returns the dictionary of tracker event listeners
   * @returns {{[listenerId: string]: TrackerEventListener}} dictionary of tracker event listeners
   */
  get trackerEventListeners() {
    return this._trackerEventListeners;
  }

  /**
   * Adds a tracker event listener
   * @param {TrackerEventListener} listener tracker event listener 
   * @param {String} [accountId] account id
   * @param {String} [trackerId] tracker id
   * @param {Number} [sequenceNumber] event sequence number
   * @returns {String} tracker event listener id
   */
  addTrackerEventListener(listener, accountId, trackerId, sequenceNumber) {
    const listenerId = randomstring.generate(10);
    this._trackerEventListeners[listenerId] = listener;
    this._startTrackerEventJob(listenerId, listener, accountId, trackerId, sequenceNumber);
    return listenerId;
  }

  /**
   * Removes tracker event listener by id
   * @param {String} listenerId listener id 
   */
  removeTrackerEventListener(listenerId) {
    delete this._trackerEventListeners[listenerId];
  }

  async _startTrackerEventJob(listenerId, listener, accountId, trackerId, sequenceNumber) {
    let throttleTime = this._errorThrottleTime;

    while (this._trackerEventListeners[listenerId]) {
      try {
        const packets = await this._domainClient.requestApi({
          url: '/users/current/tracker-events/stream',
          method: 'GET',
          qs: {
            previousSequenceNumber: sequenceNumber,
            accountId, trackerId,
            limit: 1000
          }
        }, true);
        for (let packet of packets) {
          await listener.onTrackerEvent(packet);
        }
        throttleTime = this._errorThrottleTime;
        if (this._trackerEventListeners[listenerId] && packets.length) {
          sequenceNumber = packets.slice(-1)[0].sequenceNumber;
        }
      } catch (error) {
        await new Promise(res => setTimeout(res, throttleTime));
        throttleTime = Math.min(throttleTime * 2, 30000);
      }
    }
  }

}
