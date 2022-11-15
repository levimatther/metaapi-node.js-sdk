import MetaApiWebsocketClient from "../clients/metaApi/metaApiWebsocket.client";
import MetaApiConnection from "./metaApiConnection";
import MetatraderAccount from "./metatraderAccount";

/**
 * Exposes MetaApi MetaTrader RPC API connection to consumers
 */
export default class RpcMetaApiConnection extends MetaApiConnection {
  
  /**
   * Constructs MetaApi MetaTrader RPC Api connection
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   */
  constructor(websocketClient: MetaApiWebsocketClient, account: MetatraderAccount);

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {string} instanceIndex index of an account instance connected
   * @param {number} replicas number of account replicas launched
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onConnected(instanceIndex: string, replicas: number): Promise<any>;

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {string} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDisconnected(instanceIndex: string): Promise<any>;

  /**
   * Invoked when a stream for an instance index is closed
   * @param {string} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onStreamClosed(instanceIndex: string): Promise<any>;

  /**
   * Returns flag indicating status of state synchronization with MetaTrader terminal
   * @returns {Promise} promise which resolves with a flag indicating status of state synchronization
   * with MetaTrader terminal
   */
  isSynchronized(): boolean;

  /**
   * Waits until synchronization to RPC application is completed
   * @param {number} timeoutInSeconds synchronization timeout in seconds
   * @return {Promise} promise which resolves when synchronization to RPC application is completed
   */
  waitSynchronized(timeoutInSeconds?: number): Promise<any>;

  /**
   * Invoked when connection to MetaApi websocket API restored after a disconnect
   * @param {string} region reconnected region
   * @param {number} instanceNumber reconnected instance number
   * @return {Promise} promise which resolves when connection to MetaApi websocket API restored after a disconnect
   */
  onReconnected(region: string, instanceNumber: number): Promise<any>;
}