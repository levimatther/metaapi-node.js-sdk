import StreamingMetaApiConnection from './streamingMetaApiConnection';
import RpcMetaApiConnection from './rpcMetaApiConnection';
import randomstring from 'randomstring';
import StreamingMetaApiConnectionInstance from './streamingMetaApiConnectionInstance';
import RpcMetaApiConnectionInstance from './rpcMetaApiConnectionInstance';

/**
 * Manages account connections
 */
export default class ConnectionRegistry {

  /**
   * Constructs a MetaTrader connection registry instance
   * @param {MetaApiWebsocketClient} metaApiWebsocketClient MetaApi websocket client
   * @param {ClientApiClient} clientApiClient client API client
   * @param {String} application application id
   * @param {String} refreshSubscriptionsOpts subscriptions refresh options
   */
  constructor(metaApiWebsocketClient, clientApiClient, application = 'MetaApi', refreshSubscriptionsOpts) {
    refreshSubscriptionsOpts = refreshSubscriptionsOpts || {};
    this._metaApiWebsocketClient = metaApiWebsocketClient;
    this._clientApiClient = clientApiClient;
    this._application = application;
    this._refreshSubscriptionsOpts = refreshSubscriptionsOpts;
    this._rpcConnections = {};
    this._streamingConnections = {};
    this._connectionLocks = {};
  }
  
  /**
   * Creates and returns a new account streaming connection if doesnt exist, otherwise returns old
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {HistoryStorage} historyStorage terminal history storage
   * @param {Date} [historyStartTime] history start time
   * @return {StreamingMetaApiConnection} streaming metaapi connection
   */
  connectStreaming(account, historyStorage, historyStartTime) {
    if (!this._streamingConnections[account.id]) {
      this._streamingConnections[account.id] = new StreamingMetaApiConnection(this._metaApiWebsocketClient, 
        this._clientApiClient, account, historyStorage, this, historyStartTime, this._refreshSubscriptionsOpts);
    }
    return new StreamingMetaApiConnectionInstance(this._metaApiWebsocketClient, 
      this._streamingConnections[account.id]);
  }

  /**
   * Removes a streaming connection from registry
   * @param {MetatraderAccount} account MetaTrader account to remove from registry
   */
  async removeStreaming(account) {
    if (this._streamingConnections[account.id]) {
      delete this._streamingConnections[account.id];
    }
    if(!this._rpcConnections[account.id]) {
      await this._closeLastConnection(account);
    }
  }

  /**
   * Creates and returns a new account rpc connection if doesnt exist, otherwise returns old
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @returns {RpcMetaApiConnection} rpc metaapi connection
   */
  connectRpc(account) {
    if (!this._rpcConnections[account.id]) {
      this._rpcConnections[account.id] = new RpcMetaApiConnection(this._metaApiWebsocketClient, account, this);
    }
    return new RpcMetaApiConnectionInstance(this._metaApiWebsocketClient, 
      this._rpcConnections[account.id]);
  }

  /**
   * Removes an RPC connection from registry
   * @param {MetatraderAccount} account MetaTrader account to remove from registry
   */
  async removeRpc(account) {
    if (this._rpcConnections[account.id]) {
      delete this._rpcConnections[account.id];
    }
    if(!this._streamingConnections[account.id]) {
      await this._closeLastConnection(account);
    }
  }

  /**
   * Removes an account from registry
   * @param {string} accountId MetaTrader account id to remove
   */
  remove(accountId) {
    delete this._rpcConnections[accountId];
    delete this._streamingConnections[accountId];
  }

  /**
   * Returns application type
   * @return {String} application type
   */
  get application() {
    return this._application;
  }

  async _closeLastConnection(account) {
    const accountRegions = account.accountRegions;
    await Promise.all(Object.values(accountRegions).map(replicaId =>
      this._metaApiWebsocketClient.unsubscribe(replicaId)));
  }
}
