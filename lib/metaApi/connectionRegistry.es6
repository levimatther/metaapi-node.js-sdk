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
    this._connectionLocks = {};
  }
  
  /**
   * Creates and returns a new account connection if doesnt exist, otherwise returns old
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {HistoryStorage} historyStorage terminal history storage
   * @param {Date} [historyStartTime] history start time
   */
  async connect(account, historyStorage, historyStartTime) {
    if (this._connections[account.id]) {
      return this._connections[account.id];
    } else {
      while (this._connectionLocks[account.id]) {
        await this._connectionLocks[account.id].promise;
      }
      if (this._connections[account.id]) {
        return this._connections[account.id];
      }
      let connectionLockResolve;
      this._connectionLocks[account.id] = {promise: new Promise(res => connectionLockResolve = res)};
      const connection = new MetaApiConnection(this._metaApiWebsocketClient, account, historyStorage, this,
        historyStartTime);
      try {
        await connection.initialize();
        await connection.subscribe();
        this._connections[account.id] = connection;
      } finally {
        delete this._connectionLocks[account.id];
        connectionLockResolve();
      }
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
