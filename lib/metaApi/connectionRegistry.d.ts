import MetaApiWebsocketClient from "../clients/metaApi/metaApiWebsocket.client";
import ClientApiClient from "../clients/metaApi/clientApi.client";
import HistoryStorage from "./historyStorage";
import MetatraderAccount from "./metatraderAccount";
import StreamingMetaApiConnection from "./streamingMetaApiConnection";
import RpcMetaApiConnection from "./rpcMetaApiConnection";

/**
 * Manages account connections
 */
export default class ConnectionRegistry {
  
  /**
   * Constructs a MetaTrader connection registry instance
   * @param {MetaApiWebsocketClient} metaApiWebsocketClient MetaApi websocket client
   * @param {ClientApiClient} clientApiClient client API client
   * @param {string} application application id
   * @param {string} refreshSubscriptionsOpts subscriptions refresh options
   */
  constructor(metaApiWebsocketClient: MetaApiWebsocketClient, clientApiClient: ClientApiClient, application: string, refreshSubscriptionsOpts: string);
  
  /**
   * Creates and returns a new account streaming connection if doesnt exist, otherwise returns old
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {HistoryStorage} historyStorage terminal history storage
   * @param {Date} [historyStartTime] history start time
   * @return {StreamingMetaApiConnection} streaming metaapi connection
   */
  connectStreaming(account: MetatraderAccount, historyStorage: HistoryStorage, historyStartTime?: Date): StreamingMetaApiConnection;

  /**
   * Removes a streaming connection from registry
   * @param {MetatraderAccount} account MetaTrader account to remove from registry
   */
  removeStreaming(account: MetatraderAccount): void;

  /**
   * Creates and returns a new account rpc connection if doesnt exist, otherwise returns old
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @returns {RpcMetaApiConnection} rpc metaapi connection
   */
  connectRpc(account: MetatraderAccount): RpcMetaApiConnection;

  /**
   * Removes an RPC connection from registry
   * @param {MetatraderAccount} account MetaTrader account to remove from registry
   */
  removeRpc(account: MetatraderAccount): void;
  
  /**
   * Removes an account from registry
   * @param {string} accountId MetaTrader account id to remove
   */
  remove(accountId: string): void;
  
  /**
   * Returns application type
   * @return {string} application type
   */
  get application(): string;
}