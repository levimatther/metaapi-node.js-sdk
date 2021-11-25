/**
 * A class which records packets into log files
 */
export default class PacketLogger {
  
  /**
   * Constructs the class
   * @param {PacketLoggerOpts} opts packet logger options
   */
  constructor(opts: PacketLoggerOpts);
  
  /**
   * Processes packets and pushes them into save queue
   * @param {Object} packet packet to log
   */
  logPacket(packet: Object);
  
  /**
   * Returns log messages within date bounds as an array of objects
   * @param {String} accountId account id 
   * @param {Date} dateAfter date to get logs after
   * @param {Date} dateBefore date to get logs before
   * @returns {Array<Object>} log messages
   */
  readLogs(accountId: String, dateAfter: Date, dateBefore: Date): Array<Object>;
  
  /**
   * Returns path for account log file
   * @param {String} accountId account id
   * @returns {String} file path
   */
  getFilePath(accountId: String): String;
  
  /**
   * Initializes the packet logger
   */
  start();
  
  /**
   * Deinitializes the packet logger
   */
  stop();  
}

/**
 * Packet logger options
 */
declare type PacketLoggerOpts = {  

  /**
   * whether packet logger is enabled
   */
  enabled?: Boolean,

  /**
   * maximum amount of files per account, default value is 12
   */
  fileNumberLimit?: Number,

  /**
   * amount of logged hours per account file, default value is 4
   */
  logFileSizeInHours?: Number,

  /**
   * whether to compress specifications packets, default value is true
   */
  compressSpecifications?: Boolean,

  /**
   * whether to compress specifications packets, default value is true
   */
  compressPrices?: Boolean
}