'use strict';
import fs from 'fs-extra';
import moment from 'moment';

/**
 * A class which records packets into log files
 */
export default class PacketLogger {

  /**
   * Constructs the class
   * @param {Object} opts packet logger options
   */
  constructor(opts) {
    opts = opts || {};
    this._fileNumberLimit = opts.fileNumberLimit || 12;
    this._logFileSizeInHours = opts.logFileSizeInHours || 4;
    this._compressSpecifications = opts.compressSpecifications !== undefined ? opts.compressSpecifications : true;
    this._compressPrices = opts.compressPrices !== undefined ? opts.compressPrices : true;
    this._previousPrices = {};
    this._writeQueue = {};
    this._root = './.metaapi/logs';
    fs.ensureDir(this._root);
  }

  /**
   * Processes packets and pushes them into save queue
   * @param {Object} packet packet to log
   */
  // eslint-disable-next-line complexity
  logPacket(packet) {
    if(!this._writeQueue[packet.accountId]) {
      this._writeQueue[packet.accountId] = {isWriting: false, queue: []};
    }
    if(packet.type === 'status') {
      return;
    }
    const queue = this._writeQueue[packet.accountId].queue;
    const prevPrice = this._previousPrices[packet.accountId];
    if(packet.type !== 'prices') {
      if(prevPrice) {
        this._recordPrices(packet.accountId);
      }
      if(packet.type === 'specifications' && this._compressSpecifications) {
        queue.push(JSON.stringify({type: packet.type, sequenceNumber: packet.sequenceNumber}));
      } else {
        queue.push(JSON.stringify(packet));
      }
    } else {
      if(!this._compressPrices) {
        queue.push(JSON.stringify(packet));
      } else {
        if(prevPrice) {
          if(![prevPrice.last.sequenceNumber, prevPrice.last.sequenceNumber + 1].includes(packet.sequenceNumber)) {
            this._recordPrices(packet.accountId);
            this._previousPrices[packet.accountId] = {first: packet, last: packet};
            queue.push(JSON.stringify(packet));
          } else {
            this._previousPrices[packet.accountId].last = packet;
          }
        } else {
          this._previousPrices[packet.accountId] = {first: packet, last: packet};
          queue.push(JSON.stringify(packet));
        }
      }
    }
  }

  /**
   * Returns log messages within date bounds as an array of objects
   * @param {String} accountId account id 
   * @param {Date} dateAfter date to get logs after
   * @param {Date} dateBefore date to get logs before
   * @returns {Array<Object>} log messages
   */
  async readLogs(accountId, dateAfter, dateBefore) {
    const folders = await fs.readdir(this._root);
    const packets = [];
    for (let folder of folders) {
      const filePath = `${this._root}/${folder}/${accountId}.log`;
      if(await fs.pathExists(filePath)) {
        const contents = await fs.readFile(filePath, 'utf8');
        let messages = contents.split('\r\n').filter(message => message.length).map(message => {
          return {date: new Date(message.slice(1, 24)), message: message.slice(26)};
        });
        if(dateAfter) {
          messages = messages.filter(message => message.date > dateAfter);
        }
        if(dateBefore) {
          messages = messages.filter(message => message.date < dateBefore);
        }
        packets.push(...messages);
      }
    }

    return packets;
  }

  /**
   * Returns path for account log file
   * @param {String} accountId account id
   * @returns {String} file path
   */
  getFilePath(accountId) {
    const fileIndex = Math.floor(new Date().getHours() / this._logFileSizeInHours);
    const folderName = `${moment().format('YYYY-MM-DD')}-${fileIndex > 9 ? fileIndex : '0' + fileIndex}`;
    fs.ensureDir(`${this._root}/${folderName}`);
    return `${this._root}/${folderName}/${accountId}.log`;
  }

  /**
   * Initializes the packet logger
   */
  start() {
    this._previousPrices = {};
    if (!this._recordInteval) {
      this._recordInteval = setInterval(() => this._appendLogs(), 1000);
      this._deleteOldLogsInterval = setInterval(() => this._deleteOldData(), 10000);
    }
  }

  /**
   * Deinitializes the packet logger
   */
  stop() {
    clearInterval(this._recordInteval);
    clearInterval(this._deleteOldLogsInterval);
  }

  /**
   * Records price packet messages to log files
   * @param {String} accountId account id
   */
  _recordPrices(accountId) {
    const prevPrice = this._previousPrices[accountId];
    const queue = this._writeQueue[accountId].queue;
    delete this._previousPrices[accountId];
    if(prevPrice.first.sequenceNumber !== prevPrice.last.sequenceNumber) {
      queue.push(JSON.stringify(prevPrice.last));
      queue.push(`Recorded price packets ${prevPrice.first.sequenceNumber}` +
        `-${prevPrice.last.sequenceNumber}`);
    }
  }

  /**
   * Writes logs to files
   */
  async _appendLogs() {
    Object.keys(this._writeQueue).forEach(async key => {
      const queue = this._writeQueue[key];
      if (!queue.isWriting && queue.queue.length) {
        queue.isWriting = true;
        try {
          const filePath = this.getFilePath(key);
          const writeString = queue.queue.reduce((a,b) => a + 
          `[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${b}\r\n` ,'');
          queue.queue = [];
          await fs.appendFile(filePath, writeString);  
        } catch(err) {
          console.log('Error writing log', err);
        }
        queue.isWriting = false;
      }
    });
  }

  /**
   * Deletes folders when the folder limit is exceeded
   */
  async _deleteOldData() {
    const contents = await fs.readdir(this._root);
    contents.reverse().slice(this._fileNumberLimit).forEach(async folderName => {
      await fs.remove(`${this._root}/${folderName}`); 
    });
  }

}
