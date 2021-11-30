import HttpClient from "../httpClient";
import { TooManyRequestsErrorMetadata } from "../errorHandler";
import SynchronizationListener from "./synchronizationListener";
import LatencyListener from "./latencyListener"
import ReconnectListener from "./reconnectListener";

/**
 * MetaApi websocket API client (see https://metaapi.cloud/docs/client/websocket/overview/)
 */
export default class MetaApiWebsocketClient {
  
  /**
   * Constructs MetaApi websocket API client instance
   * @param {HttpClient} httpClient HTTP client
   * @param {String} token authorization token
   * @param {Object} opts websocket client options
   */
  constructor(httpClient: HttpClient, token: String, opts: Object);
  
  /**
   * Restarts the account synchronization process on an out of order packet
   * @param {String} accountId account id
   * @param {Number} instanceIndex instance index
   * @param {Number} expectedSequenceNumber expected s/n
   * @param {Number} actualSequenceNumber actual s/n
   * @param {Object} packet packet data
   * @param {Date} receivedAt time the packet was received at
   */
   onOutOfOrderPacket(accountId: String, instanceIndex: Number, expectedSequenceNumber: Number, actualSequenceNumber: Number, packet: Object, receivedAt: Date): void;
  
   /**
   * Patch server URL for use in unit tests
   * @param {String} url patched server URL
   */
  set url(url: String);
  
  /**
   * Returns the list of socket instance dictionaries
   * @return {Object[]} list of socket instance dictionaries
   */
  get socketInstances(): Object[];
  
  /**
   * Returns the dictionary of socket instances by account ids
   * @return {Object} dictionary of socket instances by account ids
   */
  get socketInstancesByAccounts(): Object;
  
  /**
   * Returns the list of subscribed account ids
   * @param {String} socketInstanceIndex socket instance index
   * @return {String[]} list of subscribed account ids
   */
  subscribedAccountIds(socketInstanceIndex: String): String[];
  
  /**
   * Returns websocket client connection status
   * @param {Number} socketInstanceIndex socket instance index
   * @returns {Boolean} websocket client connection status
   */
  connected(socketInstanceIndex: Number): Boolean;
  
  /**
   * Returns list of accounts assigned to instance
   * @param {Number} socketInstanceIndex socket instance index
   * @returns {Array<Number>}
   */
  getAssignedAccounts(socketInstanceIndex: Number): Array<Number>;
  
  /**
   * Locks subscription for a socket instance based on TooManyRequestsError metadata
   * @param {Number} socketInstanceIndex socket instance index
   * @param {TooManyRequestsErrorMetadata} metadata TooManyRequestsError metadata
   */
  lockSocketInstance(socketInstanceIndex: Number, metadata: TooManyRequestsErrorMetadata): Promise<void>;
  
  /**
   * Connects to MetaApi server via socket.io protocol
   * @returns {Promise} promise which resolves when connection is established
   */
  connect(): Promise<any>
  
  /**
   * Closes connection to MetaApi server
   */
  close(): void;
  
  /**
   * Returns account information for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readAccountInformation/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @returns {Promise<MetatraderAccountInformation>} promise resolving with account information
   */
  getAccountInformation(accountId: String): MetatraderAccountInformation;
  
  /**
   * Returns positions for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPositions/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @returns {Promise<Array<MetatraderPosition>} promise resolving with array of open positions
   */
  getPositions(accountId: String): Promise<Array<MetatraderPosition>>;
  
  /**
   * Returns specific position for a MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPosition/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} positionId position id
   * @return {Promise<MetatraderPosition>} promise resolving with MetaTrader position found
   */
  getPosition(accountId: String, positionId: String): Promise<MetatraderPosition>;
  
  /**
   * Returns open orders for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrders/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @return {Promise<Array<MetatraderOrder>>} promise resolving with open MetaTrader orders
   */
  getOrders(accountId: String): Promise<Array<MetatraderOrder>>;
  
  /**
   * Returns specific open order for a MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrder/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} orderId order id (ticket number)
   * @return {Promise<MetatraderOrder>} promise resolving with metatrader order found
   */
  getOrder(accountId: String, orderId: String): Promise<MetatraderOrder>;
  
  /**
   * Returns the history of completed orders for a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTicket/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} ticket ticket number (order id)
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByTicket(accountId: String, ticket: String): Promise<MetatraderHistoryOrders>;
  
  /**
   * Returns the history of completed orders for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByPosition/)
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} positionId position id
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByPosition(accountId: String, positionId: String): Promise<MetatraderHistoryOrders>;
  
  /**
   * Returns the history of completed orders for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTimeRange/)
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {Number} offset pagination offset, default is 0
   * @param {Number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByTimeRange(accountId: String, startTime: Date, endTime: Date, offset: Number, limit: Number): Promise<MetatraderHistoryOrders>;
  
  /**
   * Returns history deals with a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTicket/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} ticket ticket number (deal id for MT5 or order id for MT4)
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByTicket(accountId: String, ticket: String): Promise<MetatraderDeals>;
  
  /**
   * Returns history deals for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByPosition/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} positionId position id
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByPosition(accountId: String, positionId: String): Promise<MetatraderDeals>;
  
  /**
   * Returns history deals with for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTimeRange/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {Number} offset pagination offset, default is 0
   * @param {Number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByTimeRange(accountId: String, startTime: Date, endTime: Date, offset: Number, limit: Number): Promise<MetatraderDeals>;
  
  /**
   * Clears the order and transaction history of a specified application so that it can be synchronized from scratch
   * (see https://metaapi.cloud/docs/client/websocket/api/removeHistory/).
   * @param {String} accountId id of the MetaTrader account to remove history for
   * @param {String} [application] application to remove history for
   * @return {Promise} promise resolving when the history is cleared
   */
  removeHistory(accountId: String, application: String): Promise<any>;
  
  /**
   * Clears the order and transaction history of a specified application and removes the application (see
   * https://metaapi.cloud/docs/client/websocket/api/removeApplication/).
   * @param {String} accountId id of the MetaTrader account to remove history and application for
   * @return {Promise} promise resolving when the history is cleared
   */
  removeApplication(accountId: String): Promise<any>;
  
  /**
   * Execute a trade on a connected MetaTrader account (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} accountId id of the MetaTrader account to execute trade for
   * @param {MetatraderTrade} trade trade to execute (see docs for possible trade types)
   * @param {String} [application] application to use
   * @returns {Promise<MetatraderTradeResponse>} promise resolving with trade result
   */
  trade(accountId: String, trade: MetatraderTrade, application: String): Promise<MetatraderTradeResponse>;
  
  /**
   * Creates a task that ensures the account gets subscribed to the server
   * @param {String} accountId account id to subscribe
   * @param {Number} [instanceNumber] instance index number
   */
  ensureSubscribe(accountId: String, instanceNumber: Number): void;
  
  /**
   * Subscribes to the Metatrader terminal events (see https://metaapi.cloud/docs/client/websocket/api/subscribe/).
   * @param {String} accountId id of the MetaTrader account to subscribe to
   * @param {Number} [instanceNumber] instance index number
   * @returns {Promise} promise which resolves when subscription started
   */
  subscribe(accountId: String, instanceNumber: Number): Promise<any>;
  
  /**
   * Reconnects to the Metatrader terminal (see https://metaapi.cloud/docs/client/websocket/api/reconnect/).
   * @param {String} accountId id of the MetaTrader account to reconnect
   * @returns {Promise} promise which resolves when reconnection started
   */
  reconnect(accountId: String): Promise<any>;
  
  /**
   * Requests the terminal to start synchronization process
   * (see https://metaapi.cloud/docs/client/websocket/synchronizing/synchronize/).
   * @param {String} accountId id of the MetaTrader account to synchronize
   * @param {Number} instanceIndex instance index
   * @param {String} host name of host to synchronize with
   * @param {String} synchronizationId synchronization request id
   * @param {Date} startingHistoryOrderTime from what date to start synchronizing history orders from. If not specified,
   * the entire order history will be downloaded.
   * @param {Date} startingDealTime from what date to start deal synchronization from. If not specified, then all
   * history deals will be downloaded.
   * @param {String} specificationsMd5 specifications MD5 hash
   * @param {String} positionsMd5 positions MD5 hash
   * @param {String} ordersMd5 orders MD5 hash
   * @returns {Promise} promise which resolves when synchronization started
   */
  synchronize(accountId: String, instanceIndex: Number, host: String, synchronizationId: String, startingHistoryOrderTime: Date, startingDealTime: Date, 
    specificationsMd5: String, positionsMd5: String, ordersMd5: String): Promise<any>;
  
    /**
   * Waits for server-side terminal state synchronization to complete.
   * (see https://metaapi.cloud/docs/client/websocket/synchronizing/waitSynchronized/).
   * @param {String} accountId id of the MetaTrader account to synchronize
   * @param {Number} instanceNumber instance index number
   * @param {String} applicationPattern MetaApi application regular expression pattern, default is .*
   * @param {Number} timeoutInSeconds timeout in seconds, default is 300 seconds
   * @param {String} [application] application to synchronize with
   * @returns {Promise} promise which resolves when synchronization started
   */
  waitSynchronized(accountId: String, instanceNumber: Number, applicationPattern: String, timeoutInSeconds: Number, application: String): Promise<any>;
  
  /**
   * Subscribes on market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/subscribeToMarketData/).
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceNumber instance index number
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataSubscription>} subscriptions array of market data subscription to create or update
   * @returns {Promise} promise which resolves when subscription request was processed
   */
  subscribeToMarketData(accountId: String, instanceNumber: Number, symbol: String, subscriptions: Array<MarketDataSubscription>): Promise<any>;
  
  /**
   * Refreshes market data subscriptions on the server to prevent them from expiring
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceNumber instance index number
   * @param {Array} subscriptions array of subscriptions to refresh
   */
  refreshMarketDataSubscriptions(accountId: String, instanceNumber: Number, subscriptions: Array<MarketDataSubscription>): Promise<any>;
  
  /**
   * Unsubscribes from market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/unsubscribeFromMarketData/).
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceNumber instance index
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataUnsubscription>} subscriptions array of subscriptions to cancel
   * @returns {Promise} promise which resolves when unsubscription request was processed
   */
  unsubscribeFromMarketData(accountId: String, instanceNumber: Number, symbol: String, subscriptions: Array<MarketDataUnsubscription>): Promise<any>;
  
  /**
   * Retrieves symbols available on an account (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbols/).
   * @param {String} accountId id of the MetaTrader account to retrieve symbols for
   * @returns {Promise<Array<String>>} promise which resolves when symbols are retrieved
   */
  getSymbols(accountId: String): Promise<Array<String>>;
  
  /**
   * Retrieves specification for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolSpecification/).
   * @param {String} accountId id of the MetaTrader account to retrieve symbol specification for
   * @param {String} symbol symbol to retrieve specification for
   * @returns {Promise<MetatraderSymbolSpecification>} promise which resolves when specification is retrieved
   */
  getSymbolSpecification(accountId: String, symbol: String): Promise<MetatraderSymbolSpecification>;
  
  /**
   * Retrieves price for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolPrice/).
   * @param {String} accountId id of the MetaTrader account to retrieve symbol price for
   * @param {String} symbol symbol to retrieve price for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderSymbolPrice>} promise which resolves when price is retrieved
   */
  getSymbolPrice(accountId: String, symbol: String, keepSubscription?: Boolean): Promise<MetatraderSymbolPrice>;
  
  /**
   * Retrieves price for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readCandle/).
   * @param {string} accountId id of the MetaTrader account to retrieve candle for
   * @param {string} symbol symbol to retrieve candle for
   * @param {string} timeframe defines the timeframe according to which the candle must be generated. Allowed values for
   * MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed values
   * for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderCandle>} promise which resolves when candle is retrieved
   */
  getCandle(accountId: String, symbol: String, timeframe: String, keepSubscription?: Boolean): Promise<MetatraderCandle>;
  
  /**
   * Retrieves latest tick for a symbol. MT4 G1 accounts do not support this API (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readTick/).
   * @param {string} accountId id of the MetaTrader account to retrieve symbol tick for
   * @param {string} symbol symbol to retrieve tick for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderTick>} promise which resolves when tick is retrieved
   */
  getTick(accountId: String, symbol: String, keepSubscription?: Boolean): Promise<MetatraderTick>;
  
  /**
   * Retrieves latest order book for a symbol. MT4 accounts do not support this API (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readBook/).
   * @param {string} accountId id of the MetaTrader account to retrieve symbol order book for
   * @param {string} symbol symbol to retrieve order book for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderBook>} promise which resolves when order book is retrieved
   */
  getBook(accountId: String, symbol: String, keepSubscription?: Boolean): Promise<MetatraderBook>
  
  /**
   * Sends client uptime stats to the server.
   * @param {String} accountId id of the MetaTrader account to save uptime
   * @param {Object} uptime uptime statistics to send to the server
   * @returns {Promise} promise which resolves when uptime statistics is submitted
   */
  saveUptime(accountId: String, uptime: Object): Promise<any>;
  
  /**
   * Unsubscribe from account (see
   * https://metaapi.cloud/docs/client/websocket/api/synchronizing/unsubscribe).
   * @param {String} accountId id of the MetaTrader account to unsubscribe
   * @returns {Promise} promise which resolves when socket unsubscribed
   */
  unsubscribe(accountId: String): Promise<void>;

  /**
   * Adds synchronization listener for specific account
   * @param {String} accountId account id
   * @param {SynchronizationListener} listener synchronization listener to add
   */
  addSynchronizationListener(accountId: String, listener: SynchronizationListener): void;
  
  /**
   * Removes synchronization listener for specific account
   * @param {String} accountId account id
   * @param {SynchronizationListener} listener synchronization listener to remove
   */
  removeSynchronizationListener(accountId: String, listener: SynchronizationListener): void;
  
  /**
   * Adds latency listener
   * @param {LatencyListener} listener latency listener to add
   */
  addLatencyListener(listener: LatencyListener): void;
  
  /**
   * Removes latency listener
   * @param {LatencyListener} listener latency listener to remove
   */
  removeLatencyListener(listener: LatencyListener): void;
  
  /**
   * Adds reconnect listener
   * @param {ReconnectListener} listener reconnect listener to add
   * @param {String} accountId account id of listener
   */
  addReconnectListener(listener: ReconnectListener, accountId: String): void;
  
  /**
   * Removes reconnect listener
   * @param {ReconnectListener} listener listener to remove
   */
  removeReconnectListener(listener: ReconnectListener): void;
  
  /**
   * Removes all listeners. Intended for use in unit tests.
   */
  removeAllListeners(): void;
  
  /**
   * Queues an account packet for processing
   * @param {Object} packet packet to process
   */
  queuePacket(packet: Object): void;
  
  /**
   * Queues account event for processing
   * @param {String} accountId account id
   * @param {Promise} event event to execute
   */
  queueEvent(accountId: String, event: Promise<any>): void;
  
  /**
   * Makes a RPC request
   * @param {String} accountId metatrader account id
   * @param {Object} request base request data
   * @param {Number} [timeoutInSeconds] request timeout in seconds
   */
  rpcRequest(accountId: String, request: Object, timeoutInSeconds: Number): Promise<any>;
}

/**
 * MetaTrader account information (see https://metaapi.cloud/docs/client/models/metatraderAccountInformation/)
 */
export declare type MetatraderAccountInformation = {

  /**
   * platform id (mt4 or mt5)
   */
  platform: String,

  /**
   * broker name
   */
  broker: String,

  /**
   * account base currency ISO code
   */
  currency: String,

  /**
   * broker server name
   */
  server: String,

  /**
   * account balance
   */
  balance: Number,

  /**
   * account liquidation value
   */
  equity: Number,

  /**
   * used margin
   */
  margin: Number,

  /**
   * free margin
   */
  freeMargin: Number,

  /**
   * account leverage coefficient
   */
  leverage: Number,

  /**
   * margin level calculated as % of equity/margin
   */
  marginLevel: Number,

  /**
   * flag indicating that trading is allowed
   */
  tradeAllowed: Boolean,

  /**
   * flag indicating that investor password was used (supported for g2 only)
   */
  investorMode?: Boolean,

  /**
   * margin calculation mode, one of ACCOUNT_MARGIN_MODE_EXCHANGE,
   * ACCOUNT_MARGIN_MODE_RETAIL_NETTING, ACCOUNT_MARGIN_MODE_RETAIL_HEDGING
   */
  marginMode: String,

  /**
   * Account owner name
   */
  name: String,

  /**
   * Account login
   */
  login: Number,

  /**
   * Account credit in the deposit currency
   */
  credit: Number
}

/**
 * MetaTrader position
 */
export declare type MetatraderPosition = {

  /**
   * position id (ticket number)
   */
  id: Number,

  /**
   * position type (one of POSITION_TYPE_BUY, POSITION_TYPE_SELL)
   */
  type: String,

  /**
   * position symbol
   */
  symbol: String,

  /**
   * position magic number, identifies the EA which opened the position
   */
  magic: Number,

  /**
   * time position was opened at
   */
  time: Date,

  /**
   * time position was opened at, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: String,

  /**
   * last position modification time
   */
  updateTime: Date,

  /**
   * position open price
   */
  openPrice: Number,

  /**
   * current price
   */
  currentPrice: Number,

  /**
   * current tick value
   */
  currentTickValue: Number,

  /**
   * optional position stop loss price
   */
  stopLoss?: Number,

  /**
   * optional position take profit price
   */
  takeProfit?: Number,

  /**
   * position volume
   */
  volume: Number,

  /**
   * position cumulative swap
   */
  swap: Number,

  /**
   * position cumulative profit
   */
  profit: Number,

  /**
   * optional position comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 26. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   */
  comment?: String,

  /**
   * optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   */
  clientId?: String,

  /**
   * profit of the part of the position which is not yet closed, including swap
   */
  unrealizedProfit: Number,

  /**
   * profit of the already closed part, including commissions and swap
   */
  realizedProfit: Number,

  /**
   * position commission
   */
  commission: Number,

  /**
   * position opening reason. One of POSITION_REASON_CLIENT, POSITION_REASON_EXPERT,
   * POSITION_REASON_MOBILE, POSITION_REASON_WEB, POSITION_REASON_UNKNOWN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/positionproperties#enum_position_reason',
   */
  reason: String,

  /**
   * current exchange rate of account currency into account base
   * currency (USD if you did not override it)
   */
  accountCurrencyExchangeRate?: Number,

  /**
   * current comment value on broker side (possibly overriden by the broker)
   */
  brokerComment?: String
}

/**
 * MetaTrader order
 */
export declare type MetatraderOrder = {

  /**
   * order id (ticket number)
   */
  id: Number,

  /**
   * order type (one of ORDER_TYPE_SELL, ORDER_TYPE_BUY, ORDER_TYPE_BUY_LIMIT,
   * ORDER_TYPE_SELL_LIMIT, ORDER_TYPE_BUY_STOP, ORDER_TYPE_SELL_STOP). See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type
   */
  type: String,

  /**
   * order state one of (ORDER_STATE_STARTED, ORDER_STATE_PLACED, ORDER_STATE_CANCELED,
   * ORDER_STATE_PARTIAL, ORDER_STATE_FILLED, ORDER_STATE_REJECTED, ORDER_STATE_EXPIRED, ORDER_STATE_REQUEST_ADD,
   * ORDER_STATE_REQUEST_MODIFY, ORDER_STATE_REQUEST_CANCEL). See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_state
   */
  state: String,

  /**
   * order magic number, identifies the EA which created the order
   */
  magic: Number,

  /**
   * time order was created at
   */
  time: Date,

  /**
   * time time order was created at, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: String,

  /**
   * time order was executed or canceled at. Will be specified for
   * completed orders only
   */
  doneTime?: Date,

  /**
   * time order was executed or canceled at, in broker timezone,
   * YYYY-MM-DD HH:mm:ss.SSS format. Will be specified for completed orders only
   */
  doneBrokerTime?: String,

  /**
   * order symbol
   */
  symbol: String,

  /**
   * order open price (market price for market orders, limit price for limit orders or stop
   * price for stop orders)
   */
  openPrice: Number,

  /**
   * current price, filled for pending orders only. Not filled for history orders.
   */
  currentPrice?: Number,

  /**
   * order stop loss price
   */
  stopLoss?: Number,

  /**
   * order take profit price
   */
  takeProfit?: Number,

  /**
   * order requested quantity
   */
  volume: Number,

  /**
   * order remaining quantity, i.e. requested quantity - filled quantity
   */
  currentVolume: Number,

  /**
   * order position id. Present only if the order has a position attached to it
   */
  positionId: String,

  /**
   * order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 26. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   */
  comment?: String,

  /**
   * current comment value on broker side (possibly overriden by the broker)
   */
  brokerComment?: String,

  /**
   * client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   */
  clientId?: String,

  /**
   * platform id (mt4 or mt5)
   */
  platform: String,

  /**
   * order opening reason. One of ORDER_REASON_CLIENT, ORDER_REASON_MOBILE, ORDER_REASON_WEB,
   * ORDER_REASON_EXPERT, ORDER_REASON_SL, ORDER_REASON_TP, ORDER_REASON_SO, ORDER_REASON_UNKNOWN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_reason.
   */
  reason: String,

  /**
   * order filling mode. One of ORDER_FILLING_FOK, ORDER_FILLING_IOC,
   * ORDER_FILLING_RETURN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_filling.
   */
  fillingMode: String,

  /**
   * order expiration type. One of ORDER_TIME_GTC, ORDER_TIME_DAY,
   * ORDER_TIME_SPECIFIED, ORDER_TIME_SPECIFIED_DAY. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_time
   */
  expirationType: String,

  /**
   * optional order expiration time
   */
  expirationTime: Date,

  /**
   * current exchange rate of account currency into account base
   * currency (USD if you did not override it)
   */
  accountCurrencyExchangeRate?: Number,

  /**
   * identifier of an opposite position used for closing by order
   * ORDER_TYPE_CLOSE_BY
   */
  closeByPositionId?: String,

  /**
   * the Limit order price for the StopLimit order
   */
  stopLimitPrice?: Number
}

/**
 * MetaTrader history orders search query response
 */
export declare type MetatraderHistoryOrders = {

  /**
   * array of history orders returned
   */
  historyOrders: Array<MetatraderOrder>,

  /**
   * flag indicating that history order initial synchronization is still in progress
   * and thus search results may be incomplete
   */
  synchronizing: Boolean
}

/**
 * MetaTrader history deals search query response
 */
export declare type MetatraderDeals = {

  /**
   * array of history deals returned
   */
  deals: Array<MetatraderDeal>,

  /**
   * flag indicating that deal initial synchronization is still in progress
   * and thus search results may be incomplete
   */
  synchronizing: Boolean
}

/**
 * MetaTrader deal
 */
export declare type MetatraderDeal = {

  /**
   * deal id (ticket number)
   */
  id: String,

  /**
   * deal type (one of DEAL_TYPE_BUY, DEAL_TYPE_SELL, DEAL_TYPE_BALANCE, DEAL_TYPE_CREDIT,
   * DEAL_TYPE_CHARGE, DEAL_TYPE_CORRECTION, DEAL_TYPE_BONUS, DEAL_TYPE_COMMISSION, DEAL_TYPE_COMMISSION_DAILY,
   * DEAL_TYPE_COMMISSION_MONTHLY, DEAL_TYPE_COMMISSION_AGENT_DAILY, DEAL_TYPE_COMMISSION_AGENT_MONTHLY,
   * DEAL_TYPE_INTEREST, DEAL_TYPE_BUY_CANCELED, DEAL_TYPE_SELL_CANCELED, DEAL_DIVIDEND, DEAL_DIVIDEND_FRANKED,
   * DEAL_TAX). See https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties#enum_deal_type
   */
  type: String,

  /**
   * deal entry type (one of DEAL_ENTRY_IN, DEAL_ENTRY_OUT, DEAL_ENTRY_INOUT,
   * DEAL_ENTRY_OUT_BY). See https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties#enum_deal_entry
   */
  entryType: String,

  /**
   * symbol deal relates to
   */
  symbol?: String,

  /**
   * deal magic number, identifies the EA which initiated the deal
   */
  magic?: Number,

  /**
   * time the deal was conducted at
   */
  time: Date,

  /**
   * time time the deal was conducted at, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: String,

  /**
   * deal volume
   */
  volume?: Number,

  /**
   * the price the deal was conducted at
   */
  price?: Number,

  /**
   * deal commission
   */
  commission?: Number,

  /**
   * deal swap
   */
  swap?: Number,

  /**
   * deal profit
   */
  profit: Number,

  /**
   * id of position the deal relates to
   */
  positionId?: String,

  /**
   * id of order the deal relates to
   */
  orderId?: String,

  /**
   * deal comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 26. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   */
  comment?: String,

  /**
   * current comment value on broker side (possibly overriden by the broker)
   */
  brokerComment?: String,

  /**
   * client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   */
  clientId: String,

  /**
   * platform id (mt4 or mt5)
   */
  platform: String,

  /**
   * optional deal execution reason. One of DEAL_REASON_CLIENT, DEAL_REASON_MOBILE,
   * DEAL_REASON_WEB, DEAL_REASON_EXPERT, DEAL_REASON_SL, DEAL_REASON_TP, DEAL_REASON_SO, DEAL_REASON_ROLLOVER,
   * DEAL_REASON_VMARGIN, DEAL_REASON_SPLIT, DEAL_REASON_UNKNOWN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties#enum_deal_reason.
   */
  reason?: String,

  /**
   * current exchange rate of account currency into account base
   * currency (USD if you did not override it)
   */
  accountCurrencyExchangeRate?: Number
}

/**
 * MetaTrader trade response
 */
export declare type MetatraderTradeResponse = {

  /**
   * numeric response code, see
   * https://www.mql5.com/en/docs/constants/errorswarnings/enum_trade_return_codes and
   * https://book.mql4.com/appendix/errors. Response codes which indicate success are 0, 10008-10010, 10025. The rest
   * codes are errors
   */
  numericCode: Number,

  /**
   * string response code, see
   * https://www.mql5.com/en/docs/constants/errorswarnings/enum_trade_return_codes and
   * https://book.mql4.com/appendix/errors. Response codes which indicate success are ERR_NO_ERROR,
   * TRADE_RETCODE_PLACED, TRADE_RETCODE_DONE, TRADE_RETCODE_DONE_PARTIAL, TRADE_RETCODE_NO_CHANGES. The rest codes are
   * errors.
   */
  stringCode: String,

  /**
   * human-readable response message
   */
  message: String,

  /**
   * order id which was created/modified during the trade
   */
  orderId: String,

  /**
   * position id which was modified during the trade
   */
  positionId: String
}

/**
 * Market data subscription
 */
export declare type MarketDataSubscription = {

  /**
   * subscription type, one of quotes, candles, ticks, or marketDepth
   */
  type: String,

  /**
   * when subscription type is candles, defines the timeframe according to which the
   * candles must be generated. Allowed values for MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h,
   * 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed values for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   */
  timeframe?: String,

  /**
   * defines how frequently the terminal will stream data to client. If not
   * set, then the value configured in account will be used
   */
  intervalInMilliseconds?: Number
}

/**
 * Market data unsubscription
 */
export declare type MarketDataUnsubscription = {

  /**
   * subscription type, one of quotes, candles, ticks, or marketDepth
   */
  type: String
}

/**
 * MetaTrader symbol specification. Contains symbol specification (see
 * https://metaapi.cloud/docs/client/models/metatraderSymbolSpecification/)
 */
export declare type MetatraderSymbolSpecification = {

  /**
   * symbol (e.g. a currency pair or an index)
   */
  symbol: String,

  /**
   * tick size
   */
  tickSize: Number,

  /**
   * minimum order volume for the symbol
   */
  minVolume: Number,

  /**
   * maximum order volume for the symbol
   */
  maxVolume: Number,

  /**
   * order volume step for the symbol
   */
  volumeStep: Number,

  /**
   * of allowed order filling modes. Can contain ORDER_FILLING_FOK, ORDER_FILLING_IOC or
   * both. See https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#symbol_filling_mode for more
   * details.
   */
  list: Array<String>,

  /**
   * execution mode. Possible values are SYMBOL_TRADE_EXECUTION_REQUEST,
   * SYMBOL_TRADE_EXECUTION_INSTANT, SYMBOL_TRADE_EXECUTION_MARKET, SYMBOL_TRADE_EXECUTION_EXCHANGE. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_trade_execution for more
   * details.
   */
  deal: String,

  /**
   * trade contract size
   */
  contractSize: Number,

  /**
   * quote sessions, indexed by day of week
   */
  quoteSessions: MetatraderSessions,

  /**
   * trade sessions, indexed by day of week
   */
  tradeSessions: MetatraderSessions,

  /**
   * order execution type. Possible values are SYMBOL_TRADE_MODE_DISABLED,
   * SYMBOL_TRADE_MODE_LONGONLY, SYMBOL_TRADE_MODE_SHORTONLY, SYMBOL_TRADE_MODE_CLOSEONLY, SYMBOL_TRADE_MODE_FULL. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_trade_mode for more
   * details
   */
  tradeMode?: String,

  /**
   * accrued interest – accumulated coupon interest, i.e. part of the coupon
   * interest calculated in proportion to the number of days since the coupon bond issuance or the last coupon interest
   * payment
   */
  bondAccruedInterest?: Number,

  /**
   * face value – initial bond value set by the issuer
   */
  bondFaceValue?: Number,

  /**
   * the strike price of an option. The price at which an option buyer can buy (in a
   * Call option) or sell (in a Put option) the underlying asset, and the option seller is obliged to sell or buy the
   * appropriate amount of the underlying asset.
   */
  optionStrike?: Number,

  /**
   * option/warrant sensitivity shows by how many points the price of the
   * option's underlying asset should change so that the price of the option changes by one point
   */
  optionPriceSensivity?: Number,

  /**
   * liquidity Rate is the share of the asset that can be used for the margin
   */
  liquidityRate?: Number,

  /**
   * initial margin means the amount in the margin currency required for opening a
   * position with the volume of one lot. It is used for checking a client's assets when he or she enters the market
   */
  initialMargin: Number,

  /**
   * the maintenance margin. If it is set, it sets the margin amount in the margin
   * currency of the symbol, charged from one lot. It is used for checking a client's assets when his/her account state
   * changes. If the maintenance margin is equal to 0, the initial margin is used
   */
  maintenanceMargin: Number,

  /**
   * contract size or margin value per one lot of hedged positions (oppositely directed
   * positions of one symbol). Two margin calculation methods are possible for hedged positions. The calculation method
   * is defined by the broker
   */
  hedgedMargin: Number,

  /**
   * calculating hedging margin using the larger leg (Buy or Sell)
   */
  hedgedMarginUsesLargerLeg?: Boolean,

  /**
   * margin currency
   */
  marginCurrency: String,

  /**
   * contract price calculation mode. One of SYMBOL_CALC_MODE_UNKNOWN,
   * SYMBOL_CALC_MODE_FOREX, SYMBOL_CALC_MODE_FOREX_NO_LEVERAGE, SYMBOL_CALC_MODE_FUTURES, SYMBOL_CALC_MODE_CFD,
   * SYMBOL_CALC_MODE_CFDINDEX, SYMBOL_CALC_MODE_CFDLEVERAGE, SYMBOL_CALC_MODE_EXCH_STOCKS,
   * SYMBOL_CALC_MODE_EXCH_FUTURES, SYMBOL_CALC_MODE_EXCH_FUTURES_FORTS, SYMBOL_CALC_MODE_EXCH_BONDS,
   * SYMBOL_CALC_MODE_EXCH_STOCKS_MOEX, SYMBOL_CALC_MODE_EXCH_BONDS_MOEX, SYMBOL_CALC_MODE_SERV_COLLATERAL. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_calc_mode for more details
   */
  priceCalculationMode: String,

  /**
   * base currency
   */
  baseCurrency: String,

  /**
   * profit currency
   */
  profitCurrency?: String,

  /**
   * swap calculation model. Allowed values are SYMBOL_SWAP_MODE_DISABLED,
   * SYMBOL_SWAP_MODE_POINTS, SYMBOL_SWAP_MODE_CURRENCY_SYMBOL, SYMBOL_SWAP_MODE_CURRENCY_MARGIN,
   * SYMBOL_SWAP_MODE_CURRENCY_DEPOSIT, SYMBOL_SWAP_MODE_INTEREST_CURRENT, SYMBOL_SWAP_MODE_INTEREST_OPEN,
   * SYMBOL_SWAP_MODE_REOPEN_CURRENT, SYMBOL_SWAP_MODE_REOPEN_BID. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_swap_mode for more details
   */
  swapMode: String,

  /**
   * long swap value
   */
  swapLong?: Number,

  /**
   * short swap value
   */
  swapShort?: Number,

  /**
   * day of week to charge 3 days swap rollover. Allowed values are SUNDAY,
   * MONDAY, TUESDAY, WEDNESDAY, THURDAY, FRIDAY, SATURDAY, NONE
   */
  swapRollover3Days?: String,

  /**
   * allowed order expiration modes. Allowed values are
   * SYMBOL_EXPIRATION_GTC, SYMBOL_EXPIRATION_DAY, SYMBOL_EXPIRATION_SPECIFIED, SYMBOL_EXPIRATION_SPECIFIED_DAY.
   * See https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#symbol_expiration_mode for more
   * details
   */
  allowedExpirationModes: Array<String>,

  /**
   * allowed order types. Allowed values are SYMBOL_ORDER_MARKET,
   * SYMBOL_ORDER_LIMIT, SYMBOL_ORDER_STOP, SYMBOL_ORDER_STOP_LIMIT, SYMBOL_ORDER_SL, SYMBOL_ORDER_TP,
   * SYMBOL_ORDER_CLOSEBY. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#symbol_order_mode for more details
   */
  allowedOrderTypes: Array<String>,

  /**
   * if the expirationMode property is set to SYMBOL_EXPIRATION_GTC (good till
   * canceled), the expiration of pending orders, as well as of Stop Loss/Take Profit orders should be additionally set
   * using this enumeration. Allowed values are SYMBOL_ORDERS_GTC, SYMBOL_ORDERS_DAILY,
   * SYMBOL_ORDERS_DAILY_EXCLUDING_STOPS. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_order_gtc_mode for more
   * details
   */
  orderGTCMode: String,

  /**
   * digits after a decimal point
   */
  digits: Number,

  /**
   * point size
   */
  point: Number,

  /**
   * path in the symbol tree
   */
  path?: String,

  /**
   * symbol description
   */
  description: String,

  /**
   * date of the symbol trade beginning (usually used for futures)
   */
  startTime?: Date,

  /**
   * date of the symbol trade end (usually used for futures)
   */
  expirationTime?: Date
}

/**
 * MetaTrader symbol price. Contains current price for a symbol (see
 * https://metaapi.cloud/docs/client/models/metatraderSymbolPrice/)
 */
export declare type MetatraderSymbolPrice = {

  /**
   * symbol (e.g. a currency pair or an index)
   */
  symbol: String,

  /**
   * bid price
   */
  bid: String,

  /**
   * ask price
   */
  ask: Number,

  /**
   * tick value for a profitable position
   */
  profitTickValue: Number,

  /**
   * tick value for a losing position
   */
  lossTickValue: Number,

  /**
   * current exchange rate of account currency into account base
   * currency (USD if you did not override it)
   */
  accountCurrencyExchangeRate?: Number,

  /**
   * quote time, in ISO format
   */
  time: Date,

  /**
   * time quote time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: String
}

/**
 * MetaTrader candle
 */
export declare type MetatraderCandle = {

  /**
   * symbol (e.g. currency pair or an index)
   */
  symbol: String,

  /**
   * timeframe candle was generated for, e.g. 1h. One of 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m,
   * 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn
   */
  timeframe: String,

  /**
   * candle opening time
   */
  time: Date,

  /**
   * candle opening time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: String,

  /**
   * open price
   */
  open: Number,

  /**
   * high price
   */
  high: Number,

  /**
   * low price
   */
  low: Number,

  /**
   * close price
   */
  close: Number,

  /**
   * tick volume, i.e. number of ticks inside the candle
   */
  tickVolume: Number,

  /**
   * spread in points
   */
  spread: Number,

  /**
   * trade volume
   */
  volume: Number
}

/**
 * MetaTrader tick data
 */
export declare type MetatraderTick = {

  /**
   * symbol (e.g. a currency pair or an index)
   */
  symbol: String,

  /**
   * time
   */
  time: Date,

  /**
   * time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: String,

  /**
   * bid price
   */
  bid?: Number,

  /**
   * ask price
   */
  ask?: Number,

  /**
   * last deal price
   */
  last?: Number,

  /**
   * volume for the current last deal price
   */
  volume?: Number,

  /**
   * is tick a result of buy or sell deal, one of buy or sell
   */
  side: String
}

/**
 * MetaTrader order book
 */
export declare type MetatraderBook = {

  /**
   * symbol (e.g. a currency pair or an index)
   */
  symbol: String,

  /**
   * time
   */
  time: Date,

  /**
   * time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: String,

  /**
   * list of order book entries
   */
  book: Array<MetatraderBookEntry>
}

/**
 *  MetaTrader trade
 */
export declare type MetatraderTrade = {

  /**
   * type, enum: ORDER_TYPE_SELL, ORDER_TYPE_BUY, ORDER_TYPE_BUY_LIMIT, ORDER_TYPE_SELL_LIMIT,ORDER_TYPE_BUY_STOP, ORDER_TYPE_SELL_STOP, POSITION_MODIFY, POSITION_PARTIAL, POSITION_CLOSE_ID,POSITIONS_CLOSE_SYMBOL, ORDER_MODIFY, ORDER_CANCEL, POSITION_CLOSE_BY, ORDER_TYPE_BUY_STOP_LIMIT, ORDER_TYPE_SELL_STOP_LIMIT.
   */
  actionType: String,

  /**
   * symbol to trade
   */
  symbol?: String,

  /**
   * order volume
   */
  volume?: Number,

  /**
   * order limit or stop price
   */
  openPrice?: Number,

  /**
   * stop loss price
   */
  stopLoss?: Number,

  /**
   * take profit price
   */
  takeProfit?: Number,

  /**
   * stop loss units. ABSOLUTE_PRICE means the that the value of stopLoss field is a final stop loss value. RELATIVE_* means that the stopLoss field value contains relative stop loss expressed either in price, points, account currency or balance percentage. Default is ABSOLUTE_PRICE. enum: ABSOLUTE_PRICE, RELATIVE_PRICE, RELATIVE_POINTS, RELATIVE_CURRENCY, RELATIVE_BALANCE_PERCENTAGE
   */
  stopLossUnits?: String,

  /**
   * take profit units. ABSOLUTE_PRICE means the that the value of takeProfit field is a final take profit value. RELATIVE_* means that the takeProfit field value contains relative take profit expressed either in price, points, account currency or balance percentage. Default is ABSOLUTE_PRICE. enum: ABSOLUTE_PRICE, RELATIVE_PRICE, RELATIVE_POINTS, RELATIVE_CURRENCY, RELATIVE_BALANCE_PERCENTAGE
   */
  takeProfitUnits?: String,

  /**
   * order id, must be specified for order modification commands
   */
  orderId?: String,

  /**
   * position id, must be specified for position modification commands
   */
  positionId?: String,

  /**
   * order comment. The sum of the line lengths of the comment and the clientId must be less than or equal to 26. For more information see clientId usage
   */
  comment?: String,

  /**
   * client-assigned id. The id value can be assigned when submitting a trade and will be present on position, history orders and history deals related to the trade. You can use this field to bind your trades to objects in your application and then track trade progress. The sum of the line lengths of the comment and the clientId must be less than or equal to 26. For more information see clientId usage
   */
  clientId?: String,

  /**
   * magic number (expert adviser id)
   */
  magic?: Number,

  /**
   * slippage in points. Should be greater or equal to zero. In not set, default value specified in account entity will be used. Slippage is ignored on position modification, order modification and order cancellation calls. Slippage is also ignored if execution mode set in symbol specification is SYMBOL_TRADE_EXECUTION_MARKET.
   */
  slippage?: Number,

  /**
   * allowed filling modes in the order of priority. Default is to allow all filling modes and prefer ORDER_FILLING_FOK over ORDER_FILLING_IOC. See https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_filling for extra explanation.
   */
  fillingModes?: Array<any>,

  /**
   * pending order expiration settings. See Pending order expiration settings section.
   */
  expiration?: Object,

  /**
   * identifier of an opposite position used for closing by order, required in case actionType is POSITION_CLOSE_BY
   */
  closeByPositionId?: String,

  /**
   * optional price at which the StopLimit order will be placed. Required for stop limit orders
   */
  stopLimitPrice: String
}

/**
 * Metatrader trade or quote session
 */
export declare type MetatraderSession = {

  /**
   * session start time, in hh.mm.ss.SSS format
   */
  from: String,

  /**
   * session end time, in hh.mm.ss.SSS format
   */
  to: String
}

/**
 * Metatrader trade or quote session container, indexed by weekday
 */
export declare type MetatraderSessions = {

  /**
   * array of sessions for SUNDAY
   */
  SUNDAY?: Array<MetatraderSession>,

  /**
   * array of sessions for MONDAY
   */
  MONDAY?: Array<MetatraderSession>,

  /**
   * array of sessions for TUESDAY
   */
  TUESDAY?: Array<MetatraderSession>,

  /**
   * array of sessions for WEDNESDAY
   */
  WEDNESDAY?: Array<MetatraderSession>,

  /**
   * array of sessions for THURSDAY
   */
  THURSDAY?: Array<MetatraderSession>,

  /**
   * array of sessions for FRIDAY
   */
  FRIDAY?: Array<MetatraderSession>,

  /**
   * array of sessions for SATURDAY
   */
  SATURDAY?: Array<MetatraderSession>
}

/**
 * MetaTrader order book entry
 */
export declare type MetatraderBookEntry = {

  /**
   * entry type, one of BOOK_TYPE_SELL, BOOK_TYPE_BUY, BOOK_TYPE_SELL_MARKET,
   * BOOK_TYPE_BUY_MARKET
   */
  type: String,

  /**
   * price
   */
  price: Number,

  /**
   * volume
   */
  volume: Number
}