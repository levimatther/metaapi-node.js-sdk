import MetaApiWebsocketClient, { MetatraderAccountInformation, MetatraderCandle, MetatraderDeal, MetatraderDeals, MetatraderHistoryOrders, MetatraderOrder, MetatraderPosition, MetatraderSymbolPrice, MetatraderSymbolSpecification, MetatraderTick } from "../clients/metaApi/metaApiWebsocket.client";
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
   * Returns account information (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readAccountInformation/).
   * @returns {Promise<MetatraderAccountInformation>} promise resolving with account information
   */
  getAccountInformation(): Promise<MetatraderAccountInformation>;
  
  /**
   * Returns positions (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPositions/).
   * @returns {Promise<Array<MetatraderPosition>} promise resolving with array of open positions
   */
  getPositions(): Promise<Array<MetatraderPosition>>;
  
  /**
   * Returns specific position (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPosition/).
   * @param {String} positionId position id
   * @return {Promise<MetatraderPosition>} promise resolving with MetaTrader position found
   */
  getPosition(positionId: String): Promise<MetatraderPosition>;
  
  /**
   * Returns open orders (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrders/).
   * @return {Promise<Array<MetatraderOrder>>} promise resolving with open MetaTrader orders
   */
  getOrders(): Promise<Array<MetatraderOrder>>;
  
  /**
   * Returns specific open order (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrder/).
   * @param {String} orderId order id (ticket number)
   * @return {Promise<MetatraderOrder>} promise resolving with metatrader order found
   */
  getOrder(orderId: String): Promise<MetatraderOrder>;
  
  /**
   * Returns the history of completed orders for a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTicket/).
   * @param {String} ticket ticket number (order id)
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByTicket(ticket: String): Promise<MetatraderHistoryOrders>;
  
  /**
   * Returns the history of completed orders for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByPosition/)
   * @param {String} positionId position id
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByPosition(positionId: String): Promise<MetatraderHistoryOrders>;
  
  /**
   * Returns the history of completed orders for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTimeRange/)
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {Number} offset pagination offset, default is 0
   * @param {Number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByTimeRange(startTime: Date, endTime: Date, offset?: Number, limit?: Number): Promise<MetatraderHistoryOrders>;
  
  /**
   * Returns history deals with a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTicket/).
   * @param {String} ticket ticket number (deal id for MT5 or order id for MT4)
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByTicket(ticket: String): Promise<MetatraderDeals>;
  
  /**
   * Returns history deals for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByPosition/).
   * @param {String} positionId position id
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByPosition(positionId: String): Promise<MetatraderDeals>;
  
  /**
   * Returns history deals with for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTimeRange/).
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {Number} offset pagination offset, default is 0
   * @param {Number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByTimeRange(startTime: Date, endTime: Date, offset?: Number, limit?: Number): Promise<MetatraderDeals>;
  
  /**
   * Clears the order and transaction history of a specified application so that it can be synchronized from scratch
   * (see https://metaapi.cloud/docs/client/websocket/api/removeHistory/).
   * @param {String} [application] application to remove history for
   * @return {Promise} promise resolving when the history is cleared
   */
  removeHistory(application?: String): Promise<any>;
  
  /**
   * Retrieves available symbols for an account (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbols/).
   * @returns {Promise<Array<string>>} promise which resolves when symbols are retrieved
   */
  getSymbols(): Promise<Array<String>>;
  
  /**
   * Retrieves specification for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolSpecification/).
   * @param {String} symbol symbol to retrieve specification for
   * @returns {Promise<MetatraderSymbolSpecification>} promise which resolves when specification is retrieved
   */
  getSymbolSpecification(symbol: String): Promise<MetatraderSymbolSpecification>;
  
  /**
   * Retrieves latest price for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolPrice/).
   * @param {String} symbol symbol to retrieve price for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderSymbolPrice>} promise which resolves when price is retrieved
   */
  getSymbolPrice(symbol: String, keepSubscription: Boolean): Promise<MetatraderSymbolPrice>;
  
  /**
   * Retrieves latest candle for a symbol and timeframe (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readCandle/).
   * @param {String} symbol symbol to retrieve candle for
   * @param {string} timeframe defines the timeframe according to which the candle must be generated. Allowed values for
   * MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed values
   * for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderCandle>} promise which resolves when candle is retrieved
   */
  getCandle(symbol: String, timeframe: String, keepSubscription?: Boolean): Promise<MetatraderCandle>;
  
  /**
   * Retrieves latest tick for a symbol. MT4 G1 accounts do not support this API (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readTick/).
   * @param {String} symbol symbol to retrieve tick for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderTick>} promise which resolves when tick is retrieved
   */
  getTick(symbol: String, keepSubscription?: Boolean): Promise<MetatraderTick>;
  
  /**
   * Retrieves latest order book for a symbol. MT4 accounts do not support this API (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readBook/).
   * @param {string} symbol symbol to retrieve order book for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderTick>} promise which resolves when order book is retrieved
   */
  getBook(symbol: String, keepSubscription?: Boolean): Promise<MetatraderTick>;
  
  /**
   * Waits until synchronization to RPC application is completed
   * @param {Number} timeoutInSeconds synchronization timeout in seconds
   * @return {Promise} promise which resolves when synchronization to RPC application is completed
   */
   waitSynchronized(timeoutInSeconds?: Number): Promise<any>;
}