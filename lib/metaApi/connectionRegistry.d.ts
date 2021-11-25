import MetaApiWebsocketClient from "../clients/metaApi/metaApiWebsocket.client";
import HistoryStorage from "./historyStorage";
import MetatraderAccount from "./metatraderAccount";
import StreamingMetaApiConnection from "./streamingMetaApiConnection";

/**
 * Manages account connections
 */
export default class ConnectionRegistry {
  
  /**
   * Constructs a MetaTrader connection registry instance
   * @param {MetaApiWebsocketClient} metaApiWebsocketClient MetaApi websocket client
   * @param {String} application application id
   * @param {String} refreshSubscriptionsOpts subscriptions refresh options
   */
  constructor(metaApiWebsocketClient: MetaApiWebsocketClient, application: String, refreshSubscriptionsOpts: String);
  
  /**
   * Creates and returns a new account connection if doesnt exist, otherwise returns old
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {HistoryStorage} historyStorage terminal history storage
   * @param {Date} [historyStartTime] history start time
   * @return {StreamingMetaApiConnection} streaming metaapi connection
   */
  connect(account: MetatraderAccount, historyStorage: HistoryStorage, historyStartTime?: Date): StreamingMetaApiConnection;
  
  /**
   * Removes an account from registry
   * @param {string} accountId MetaTrader account id to remove
   */
  remove(accountId: String);
  
  /**
   * Returns application type
   * @return {String} application type
   */
  get application(): String;
}