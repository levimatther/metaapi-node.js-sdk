import MetaApiConnection from './metaApiConnection';

/**
 * Manages account connections
 */
export default class ConnectionRegistry {

  /**
   * Constructs a MetaTrader connection registry instance
   * @param {MetaApiWebsocketClient} metaApiWebsocketClient MetaApi websocket client
   * @param {String} application application id
   */
  constructor(metaApiWebsocketClient, application = 'MetaApi') {
    this._metaApiWebsocketClient = metaApiWebsocketClient;
    this._application = application;
    this._connections = {};
  }
  
  /**
   * Creates and returns a new account connection if doesnt exist, otherwise returns old
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {HistoryStorage} historyStorage terminal history storage
   */
  async connect(account, historyStorage) {
    if (this._connections[account.id]) {
      return this._connections[account.id];
    } else {
      const connection = new MetaApiConnection(this._metaApiWebsocketClient, account, historyStorage, this);
      await connection.initialize();
      await connection.subscribe();
      this._connections[account.id] = connection;
      return connection;
    }
  }

  /**
   * Removes an account from registry
   * @param {string} accountId MetaTrader account id to remove
   */
  remove(accountId) {
    if (this._connections[accountId]) {
      delete this._connections[accountId];
    }
  }

  /**
   * Returns application type
   * @return {String} application type
   */
  get application() {
    return this._application;
  }
}
