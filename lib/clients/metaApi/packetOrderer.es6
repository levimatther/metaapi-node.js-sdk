'use strict';

/**
 * Class which orders the synchronization packerts
 */
export default class PacketOrderer {

  /**
   * Constructs the class
   * @param {Function} outOfOrderListener function which will receive out of order packet events
   * @param {Number} orderingTimeoutInSeconds packet ordering timeout
   */
  constructor(outOfOrderListener, orderingTimeoutInSeconds) {
    this._outOfOrderListener = outOfOrderListener;
    this._orderingTimeoutInSeconds = orderingTimeoutInSeconds;
    this._isOutOfOrderEmitted = {};
    this._waitListSizeLimit = 100;
  }

  /**
   * Initializes the packet orderer
   */
  start() {
    this._sequenceNumberByAccount = {};
    this._lastSessionStartTimestamp = {};
    this._packetsByAccountId = {};
    if (!this._outOfOrderInterval) {
      this._outOfOrderInterval = setInterval(() => this._emitOutOfOrderEvents(), 1000);
    }
  }

  /**
   * Deinitialized the packet orderer
   */
  stop() {
    clearInterval(this._outOfOrderInterval);
  }

  /**
   * Processes the packet and resolves in the order of packet sequence number
   * @param {Object} packet packet to process
   * @return {Array<Object>} ordered packets when the packets are ready to be processed in order
   */
  // eslint-disable-next-line complexity
  restoreOrder(packet) {
    if (packet.sequenceNumber === undefined) {
      return [packet];
    }
    if (packet.type === 'synchronizationStarted' && packet.synchronizationId) {
      // synchronization packet sequence just started
      this._isOutOfOrderEmitted[packet.accountId] = false;
      this._sequenceNumberByAccount[packet.accountId] = packet.sequenceNumber;
      this._lastSessionStartTimestamp[packet.accountId] = packet.sequenceTimestamp;
      this._packetsByAccountId[packet.accountId] = (this._packetsByAccountId[packet.accountId] || [])
        .filter(waitPacket => waitPacket.packet.sequenceTimestamp >= packet.sequenceTimestamp);
      return [packet].concat(this._findNextPacketsFromWaitList(packet.accountId));
    } else if (packet.sequenceTimestamp < this._lastSessionStartTimestamp[packet.accountId]) {
      // filter out previous packets
      return [];
    } else if (packet.sequenceNumber === this._sequenceNumberByAccount[packet.accountId]) {
      // let the duplicate s/n packet to pass through
      return [packet];
    } else if (packet.sequenceNumber === this._sequenceNumberByAccount[packet.accountId] + 1) {
      // in-order packet was received
      this._sequenceNumberByAccount[packet.accountId]++;
      return [packet].concat(this._findNextPacketsFromWaitList(packet.accountId));
    } else {
      // out-of-order packet was received, add it to the wait list
      this._packetsByAccountId[packet.accountId] = this._packetsByAccountId[packet.accountId] || [];
      let waitList = this._packetsByAccountId[packet.accountId];
      waitList.push({
        accountId: packet.accountId,
        sequenceNumber: packet.sequenceNumber,
        packet: packet,
        receivedAt: new Date()
      });
      waitList.sort((e1, e2) => e1.sequenceNumber - e2.sequenceNumber);
      while (waitList.length > this._waitListSizeLimit) {
        waitList.shift();
      }
      return [];
    }
  }

  _findNextPacketsFromWaitList(accountId) {
    let result = [];
    let waitList = this._packetsByAccountId[accountId] || [];
    while (waitList.length && [this._sequenceNumberByAccount[accountId],
      this._sequenceNumberByAccount[accountId] + 1].includes(waitList[0].sequenceNumber)) {
      result.push(waitList[0].packet);
      if (waitList[0].sequenceNumber === this._sequenceNumberByAccount[accountId] + 1) {
        this._sequenceNumberByAccount[accountId]++;
      }
      waitList.splice(0, 1);
    }
    if (!waitList.length) {
      delete this._packetsByAccountId[accountId];
    }
    return result;
  }

  _emitOutOfOrderEvents() {
    for (let waitList of Object.values(this._packetsByAccountId)) {
      if (waitList.length && waitList[0].receivedAt.getTime() + this._orderingTimeoutInSeconds * 1000 < Date.now()) {
        const accountId = waitList[0].accountId;
        if(!this._isOutOfOrderEmitted[accountId]) {
          this._isOutOfOrderEmitted[accountId] = true;
          // Do not emit onOutOfOrderPacket for packets that come before synchronizationStarted
          if (this._sequenceNumberByAccount[accountId] !== undefined) {
            this._outOfOrderListener.onOutOfOrderPacket(waitList[0].accountId,
              this._sequenceNumberByAccount[accountId] + 1, waitList[0].sequenceNumber, waitList[0].packet,
              waitList[0].receivedAt);
          }
        }
      }
    }
  }

}
