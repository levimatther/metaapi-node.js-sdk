import { MetatraderAccountInformation, MetatraderOrder, MetatraderPosition, MetatraderSymbolPrice, MetatraderSymbolSpecification } from "../clients/metaApi/metaApiWebsocket.client";
import SynchronizationListener from "../clients/metaApi/synchronizationListener";

/**
 * Responsible for storing a local copy of remote terminal state
 */
export default class TerminalState extends SynchronizationListener {
  
  /**
   * Constructs the instance of terminal state class
   */
  constructor();
  
  /**
   * Returns true if MetaApi have connected to MetaTrader terminal
   * @return {Boolean} true if MetaApi have connected to MetaTrader terminal
   */
  get connected(): Boolean;
  
  /**
   * Returns true if MetaApi have connected to MetaTrader terminal and MetaTrader terminal is connected to broker
   * @return {Boolean} true if MetaApi have connected to MetaTrader terminal and MetaTrader terminal is connected to
   * broker
   */
  get connectedToBroker(): Boolean;
  
  /**
   * Returns a local copy of account information
   * @returns {MetatraderAccountInformation} local copy of account information
   */
  get accountInformation(): MetatraderAccountInformation;
  
  /**
   * Returns a local copy of MetaTrader positions opened
   * @returns {Array<MetatraderPosition>} a local copy of MetaTrader positions opened
   */
  get positions(): Array<MetatraderPosition>;
  
  /**
   * Returns a local copy of MetaTrader orders opened
   * @returns {Array<MetatraderOrder>} a local copy of MetaTrader orders opened
   */
  get orders(): Array<MetatraderOrder>;
  
  /**
   * Returns a local copy of symbol specifications available in MetaTrader trading terminal
   * @returns {Array<MetatraderSymbolSpecification>} a local copy of symbol specifications available in MetaTrader
   * trading terminal
   */
  get specifications(): Array<MetatraderSymbolSpecification>;
  
  /**
   * Returns hashes of terminal state data for incremental synchronization
   * @param {String} accountType account type
   * @param {String} instanceIndex index of instance to get hashes of
   * @returns {Object} hashes of terminal state data
   */
  getHashes(accountType: String, instanceIndex: String): Object;
  
  /**
   * Returns MetaTrader symbol specification by symbol
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolSpecification} MetatraderSymbolSpecification found or undefined if specification for a
   * symbol is not found
   */
  specification(symbol: String): MetatraderSymbolSpecification;
  
  /**
   * Returns MetaTrader symbol price by symbol
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolPrice} MetatraderSymbolPrice found or undefined if price for a symbol is not found
   */
  price(symbol: String): MetatraderSymbolPrice;
  
  /**
   * Waits for price to be received
   * @param {string} symbol symbol (e.g. currency pair or an index)
   * @param {number} [timeoutInSeconds] timeout in seconds, default is 30
   * @return {Promise<MetatraderSymbolPrice>} promise resolving with price or undefined if price has not been received
   */
  waitForPrice(symbol: String, timeoutInSeconds?: Number): Promise<MetatraderSymbolPrice>;
  
  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {String} instanceIndex index of an account instance connected
   */
  onConnected(instanceIndex: String);
  
  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} instanceIndex index of an account instance connected
   */
  onDisconnected(instanceIndex: String);
  
  /**
   * Invoked when broker connection status have changed
   * @param {String} instanceIndex index of an account instance connected
   * @param {Boolean} connected is MetaTrader terminal is connected to broker
   */
  onBrokerConnectionStatusChanged(instanceIndex: String, connected: Boolean);
  
  /**
   * Invoked when MetaTrader terminal state synchronization is started
   * @param {String} instanceIndex index of an account instance connected
   * @param {Boolean} specificationsUpdated whether specifications are going to be updated during synchronization
   * @param {Boolean} positionsUpdated whether positions are going to be updated during synchronization
   * @param {Boolean} ordersUpdated whether orders are going to be updated during synchronization
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSynchronizationStarted(instanceIndex: String, specificationsUpdated: Boolean, positionsUpdated: Boolean, ordersUpdated: Boolean): Promise<any>;
  
  /**
   * Invoked when MetaTrader account information is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderAccountInformation} accountInformation updated MetaTrader account information
   */
  onAccountInformationUpdated(instanceIndex: String, accountInformation: MetatraderAccountInformation);
  
  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderPosition>} positions updated array of positions
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsReplaced(instanceIndex: String, positions: Array<MetatraderPosition>): Promise<any>;
  
  /**
   * Invoked when position synchronization fnished to indicate progress of an initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsSynchronized(instanceIndex: String, synchronizationId: String): Promise<any>;
  
  /**
   * Invoked when MetaTrader position is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderPosition} position updated MetaTrader position
   */
  onPositionUpdated(instanceIndex: String, position: MetatraderPosition);
  
  /**
   * Invoked when MetaTrader position is removed
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} positionId removed MetaTrader position id
   */
  onPositionRemoved(instanceIndex: String, positionId: String);
  
  /**
   * Invoked when the orders are replaced as a result of initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderOrder>} orders updated array of pending orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrdersReplaced(instanceIndex: String, orders: Array<MetatraderOrder>): Promise<any>;
  
  /**
   * Invoked when pending order synchronization fnished to indicate progress of an initial terminal state
   * synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrdersSynchronized(instanceIndex: String, synchronizationId: String): Promise<any>;
  
  /**
   * Invoked when MetaTrader pending order is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} order updated MetaTrader pending order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrderUpdated(instanceIndex: String, order: MetatraderOrder): Promise<any>;
 
  /**
   * Invoked when MetaTrader pending order is completed (executed or canceled)
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} orderId completed MetaTrader pending order id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrderCompleted(instanceIndex: String, orderId: String): Promise<any>;
  
  /**
   * Invoked when a symbol specification was updated
   * @param {String} instanceIndex index of account instance connected
   * @param {Array<MetatraderSymbolSpecification>} specifications updated specifications
   * @param {Array<String>} removedSymbols removed symbols
   */
  onSymbolSpecificationsUpdated(instanceIndex: String, specifications: Array<MetatraderSymbolSpecification>, removedSymbols: Array<String>);
  
  /**
   * Invoked when prices for several symbols were updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderSymbolPrice>} prices updated MetaTrader symbol prices
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   */
  onSymbolPricesUpdated(instanceIndex: String, prices: Array<MetatraderSymbolPrice>, equity: Number, margin: Number, freeMargin: Number, marginLevel: Number);
  
  /**
   * Invoked when a stream for an instance index is closed
   * @param {String} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onStreamClosed(instanceIndex: String): Promise<any>;  
}