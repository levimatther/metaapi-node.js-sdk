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
  constructor(outOfOrderListener, orderingTimeoutInSeconds = 10) {
    this._outOfOrderListener = outOfOrderListener;
    this._orderingTimeoutInSeconds = orderingTimeoutInSeconds;
    this._isOutOfOrderEmitted = {};
  }

  /**
   * Initializes the packet orderer
   */
  start() {
    this._sequenceNumberByAccount = {};
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
    if (!packet.sequenceNumber) {
      return [packet];
    }
    if (packet.type === 'specifications' && packet.synchronizationId) {
      // synchronization packet sequence just started
      this._isOutOfOrderEmitted[packet.accountId] = false;
      this._sequenceNumberByAccount[packet.accountId] = packet.sequenceNumber;
      delete this._packetsByAccountId[packet.accountId];
      return [packet];
    } else if (packet.sequenceNumber < this._sequenceNumberByAccount[packet.accountId]) {
      // filter out previous packets
      return [];
    } else if (packet.sequenceNumber === this._sequenceNumberByAccount[packet.accountId]) {
      // let the duplicate s/n packet to pass through
      return [packet];
    } else if (packet.sequenceNumber === this._sequenceNumberByAccount[packet.accountId] + 1) {
      // in-order packet was received
      this._sequenceNumberByAccount[packet.accountId]++;
      let result = [packet];
      let waitList = this._packetsByAccountId[packet.accountId] || [];
      while (waitList.length && [this._sequenceNumberByAccount[packet.accountId], 
        this._sequenceNumberByAccount[packet.accountId] + 1].includes(waitList[0].sequenceNumber)) {
        result.push(waitList[0].packet);
        if(waitList[0].sequenceNumber === this._sequenceNumberByAccount[packet.accountId] + 1) {
          this._sequenceNumberByAccount[packet.accountId]++;
        }
        waitList.splice(0, 1);
      }
      if (!waitList.length) {
        delete this._packetsByAccountId[packet.accountId];
      }
      return result;
    } else if (this._sequenceNumberByAccount[packet.accountId]) {
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
      return [];
    } else {
      return [packet];
    }
  }


  _emitOutOfOrderEvents() {
    for (let waitList of Object.values(this._packetsByAccountId)) {
      if (waitList.length && waitList[0].receivedAt.getTime() + this._orderingTimeoutInSeconds * 1000 < Date.now()) {
        const accountId = waitList[0].accountId;
        if(!this._isOutOfOrderEmitted[accountId]) {
          this._isOutOfOrderEmitted[accountId] = true;
          this._outOfOrderListener.onOutOfOrderPacket(waitList[0].accountId,
            this._sequenceNumberByAccount[accountId] + 1, waitList[0].sequenceNumber, waitList[0].packet,
            waitList[0].receivedAt);
        }
      }
    }
  }

}
