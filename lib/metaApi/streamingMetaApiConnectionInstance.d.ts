import MetaApiWebsocketClient from "../clients/metaApi/metaApiWebsocket.client";
import MetatraderAccount from "./metatraderAccount";
import HistoryStorage from "./historyStorage";
import { MarketDataSubscription, MarketDataUnsubscription } from "../clients/metaApi/metaApiWebsocket.client";
import TerminalState from "./terminalState";
import ConnectionHealthMonitor from "./connectionHealthMonitor";
import MetaApiConnectionInstance from "./metaApiConnectionInstance";
import StreamingMetaApiConnection from "./streamingMetaApiConnection";
import SynchronizationListener from "../clients/metaApi/synchronizationListener";

/**
 * Exposes MetaApi MetaTrader streaming API connection to consumers
 */
export default class StreamingMetaApiConnectionInstance extends MetaApiConnectionInstance {
  
  /**
   * Constructs MetaApi MetaTrader streaming Api connection
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {StreamingMetaApiConnection} metaApiConnection streaming MetaApi connection
   */
  constructor(websocketClient: MetaApiWebsocketClient, metaApiConnection: StreamingMetaApiConnection);

  /**
   * Opens the connection. Can only be called the first time, next calls will be ignored.
   * @return {Promise} promise resolving when the connection is opened
   */
  connect(): Promise<any>;
  
  /**
   * Clears the order and transaction history of a specified application and removes application (see
   * https://metaapi.cloud/docs/client/websocket/api/removeApplication/).
   * @return {Promise} promise resolving when the history is cleared and application is removed
   */
  removeApplication(): Promise<any>;

  /**
   * Subscribes on market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/subscribeToMarketData/).
   * @param {string} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataSubscription>} subscriptions array of market data subscription to create or update. Please
   * note that this feature is not fully implemented on server-side yet
   * @param {number} [timeoutInSeconds] timeout to wait for prices in seconds, default is 30
   * @returns {Promise} promise which resolves when subscription request was processed
   */
  subscribeToMarketData(symbol: string, subscriptions: Array<MarketDataSubscription>, timeoutInSeconds?: number): Promise<any>;
  
  /**
   * Unsubscribes from market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/unsubscribeFromMarketData/).
   * @param {string} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataUnsubscription>} subscriptions array of subscriptions to cancel
   * @returns {Promise} promise which resolves when unsubscription request was processed
   */
  unsubscribeFromMarketData(symbol: string, subscriptions: MarketDataUnsubscription): Promise<any>;

  /**
   * Returns list of the symbols connection is subscribed to
   * @returns {Array<string>} list of the symbols connection is subscribed to
   */
  get subscribedSymbols(): Array<string>;
  
  /**
   * Returns subscriptions for a symbol
   * @param {string} symbol symbol to retrieve subscriptions for
   * @returns {Array<MarketDataSubscription>} list of market data subscriptions for the symbol
   */
  subscriptions(symbol: string): Array<MarketDataSubscription>;
  
  /**
   * Sends client uptime stats to the server.
   * @param {Object} uptime uptime statistics to send to the server
   * @returns {Promise} promise which resolves when uptime statistics is submitted
   */
  saveUptime(uptime: Object): Promise<any>;
  
  /**
   * Returns local copy of terminal state
   * @returns {TerminalState} local copy of terminal state
   */
  get terminalState(): TerminalState;
  
  /**
   * Returns local history storage
   * @returns {HistoryStorage} local history storage
   */
  get historyStorage(): HistoryStorage;
  
  /**
   * Adds synchronization listener
   * @param {SynchronizationListener} listener synchronization listener to add
   */
  addSynchronizationListener(listener: SynchronizationListener): void;
  
  /**
   * Removes synchronization listener for specific account
   * @param {SynchronizationListener} listener synchronization listener to remove
   */
  removeSynchronizationListener(listener: SynchronizationListener): void;

  /**
   * Waits until synchronization to MetaTrader terminal is completed
   * @param {SynchronizationOptions} opts synchronization options
   * @return {Promise} promise which resolves when synchronization to MetaTrader terminal is completed
   */
  waitSynchronized(opts: SynchronizationOptions): Promise<any>;

  /**
   * Returns synchronization status
   * @return {boolean} synchronization status
   */
  get synchronized(): boolean;
  
  /**
   * Returns MetaApi account
   * @return {MetatraderAccount} MetaApi account
   */
  get account(): MetatraderAccount;
  
  /**
   * Returns connection health monitor instance
   * @return {ConnectionHealthMonitor} connection health monitor instance
   */
  get healthMonitor(): ConnectionHealthMonitor;
}

/**
 * Synchronization options
 */
export declare type SynchronizationOptions = {

  /**
   * application regular expression pattern, default is .*
   */
  applicationPattern?: string,

  /**
   * synchronization id, last synchronization request id will be used by
   * default
   */
  synchronizationId?: string,

  /**
   * index of an account instance to ensure synchronization on, default is to wait
   * for the first instance to synchronize
   */
  instanceIndex?: number,

  /**
   * wait timeout in seconds, default is 5m
   */
  timeoutInSeconds?: number,

  /**
   * interval between account reloads while waiting for a change, default is 1s
   */
  intervalInMilliseconds?: number
}