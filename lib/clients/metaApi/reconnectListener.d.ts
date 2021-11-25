/**
 * Defines interface for a websocket reconnect listener class
 */
export default class ReconnectListener {
  
  /**
   * Invoked when connection to MetaTrader terminal re-established
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
   onReconnected(): Promise<any>;
}