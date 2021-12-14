import MetaApiWebsocketClient, { MetatraderTradeResponse, TrailingStopLoss } from "../clients/metaApi/metaApiWebsocket.client";
import SynchronizationListener from "../clients/metaApi/synchronizationListener";
import MetatraderAccount from "./metatraderAccount";

/**
 * Exposes MetaApi MetaTrader API connection to consumers
 */
export default class MetaApiConnection extends SynchronizationListener {
  
  /**
   * Constructs MetaApi MetaTrader Api connection
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {String} [application] application to use
   */
  constructor(websocketClient: MetaApiWebsocketClient, account: MetatraderAccount, application: String);
  
  /**
   * Creates a market buy order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {CreateMarketTradeOptions} options optional trade options
   * @returns {Promise<MetatraderTradeResponse>} promise resolving with trade result
   */
  createMarketBuyOrder(symbol: String, volume: Number, stopLoss?: Number | StopOptions, takeProfit?: Number | StopOptions, options?: CreateMarketTradeOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Creates a market sell order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {CreateMarketTradeOptions} options optional trade options
   * @returns {Promise<MetatraderTradeResponse>} promise resolving with trade result
   */
  createMarketSellOrder(symbol: String, volume: Number, stopLoss?: Number | StopOptions, takeProfit?: Number | StopOptions, options?: CreateMarketTradeOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Creates a limit buy order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number} openPrice order limit price
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {PendingTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  createLimitBuyOrder(symbol: String, volume: Number, openPrice: Number, stopLoss?: Number | StopOptions, takeProfit?: Number | StopOptions, options?: PendingTradeOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Creates a limit sell order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number} openPrice order limit price
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {PendingTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  createLimitSellOrder(symbol: String, volume: Number, openPrice: Number, stopLoss?: Number | StopOptions, takeProfit?: Number | StopOptions, options?: PendingTradeOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Creates a stop buy order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number} openPrice order stop price
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {PendingTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  createStopBuyOrder(symbol: String, volume: Number, openPrice: Number, stopLoss?: Number | StopOptions, takeProfit?: Number | StopOptions, options?: PendingTradeOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Creates a stop sell order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number} openPrice order stop price
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {PendingTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  createStopSellOrder(symbol: String, volume: Number, openPrice: Number, stopLoss?: Number | StopOptions, takeProfit?: Number | StopOptions, options?: PendingTradeOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Creates a stop limit buy order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number} openPrice order stop price
   * @param {number} stopLimitPrice the limit order price for the stop limit order
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {StopLimitPendingTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  createStopLimitBuyOrder(symbol: String, volume: Number, openPrice: Number, stopLoss?: Number | StopOptions, takeProfit?: Number | StopOptions, options?: StopLimitPendingTradeOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Creates a stop limit sell order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {number} volume order volume
   * @param {number} openPrice order stop price
   * @param {number} stopLimitPrice the limit order price for the stop limit order
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {StopLimitPendingTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  createStopLimitSellOrder(symbol: String, volume: Number, openPrice: Number, stopLoss?: Number | StopOptions, takeProfit?: Number | StopOptions, options?: StopLimitPendingTradeOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Modifies a position (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} positionId position id to modify
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  modifyPosition(positionId: String, stopLoss?: Number | StopOptions, takeProfit?: Number | StopOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Partially closes a position (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} positionId position id to modify
   * @param {number} volume volume to close
   * @param {MarketTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  closePositionPartially(positionId: String, volume: Number, options: MarketTradeOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Fully closes a position (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} positionId position id to modify
   * @param {MarketTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  closePosition(positionId: String, options: MarketTradeOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Fully closes a position (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} positionId position id to close by opposite position
   * @param {string} oppositePositionId opposite position id to close
   * @param {MarketTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  closeBy(positionId: String, oppositePositionId: String, options: MarketTradeOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Closes positions by a symbol(see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} symbol symbol to trade
   * @param {MarketTradeOptions} options optional trade options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  closePositionsBySymbol(symbol: String, options: MarketTradeOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Modifies a pending order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} orderId order id (ticket number)
   * @param {number} openPrice order stop price
   * @param {number|StopOptions} [stopLoss] stop loss price
   * @param {number|StopOptions} [takeProfit] take profit price
   * @param {ModifyOrderOptions} [options] optional modify order options
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  modifyOrder(orderId: String, openPrice: Number, stopLoss?: Number | StopOptions, takeProfit?: Number | StopOptions, options?: ModifyOrderOptions): Promise<MetatraderTradeResponse>;
  
  /**
   * Cancels order (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} orderId order id (ticket number)
   * @returns {Promise<TradeResponse>} promise resolving with trade result
   */
  cancelOrder(orderId: String): Promise<MetatraderTradeResponse>;
  
  /**
   * Reconnects to the Metatrader terminal (see https://metaapi.cloud/docs/client/websocket/api/reconnect/).
   * @returns {Promise} promise which resolves when reconnection started
   */
  reconnect(): Promise<any>
  
  /**
   * Returns MetaApi account
   * @return {MetatraderAccount} MetaApi account
   */
   get account(): MetatraderAccount;
}

/**
 * Common trade options
 */
export declare type TradeOptions = {

  /**
   * optional order comment. The sum of the line lengths of the comment and the
   * clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
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
   * optional magic (expert id) number. If not set default value specified in account entity
   * will be used.
   */
  magic?: Number,

  /**
   * optional slippage in points. Should be greater or equal to zero. In not set,
   * default value specified in account entity will be used. Slippage is ignored if execution mode set to
   * SYMBOL_TRADE_EXECUTION_MARKET in symbol specification. Not used for close by orders.
   */
  slippage?: Number
}

/**
 * Market trade options
 */
export declare type MarketTradeOptions = {

  /**
   * optional allowed filling modes in the order of priority. Default is to
   * allow all filling modes and prefer ORDER_FILLING_FOK over ORDER_FILLING_IOC. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_filling for extra
   * explanation
   */
  fillingModes?: Array<String>
} & TradeOptions

/**
 * Create market trade options
 */
 export declare type CreateMarketTradeOptions = {

  /**
   * distance trailing stop loss configuration
   */
   trailingStopLoss?: TrailingStopLoss,
} & MarketTradeOptions

/**
 * Pending order trade options
 */
export declare type PendingTradeOptions = {

  /**
   * optional pending order expiration settings. See Pending order expiration
   * settings section
   */
  expiration?: ExpirationOptions,

  /**
   * distance trailing stop loss configuration
   */
  trailingStopLoss?: TrailingStopLoss,

  /**
   * defines the base price to calculate SL/TP relative to for *_MODIFY and pending order requests. 
   * STOP_PRICE means the SL/TP is relative to previous SL/TP value. Default is OPEN_PRICE, one of
   * CURRENT_PRICE, OPEN_PRICE
   */
  stopPriceBase?: String,

  /**
   * open price units. ABSOLUTE_PRICE means the that the value of openPrice field is a final open
   * price value. RELATIVE* means that the openPrice field value contains relative open price expressed
   * either in price, points, pips, account currency or balance percentage. Default is ABSOLUTE_PRICE. One of
   * ABSOLUTE_PRICE, RELATIVE_PRICE, RELATIVE_POINTS, RELATIVE_PIPS, RELATIVE_CURRENCY, RELATIVE_BALANCE_PERCENTAGE
   */
  openPriceUnits?: String
} & TradeOptions

/**
 * Options for creating a stop limit pending order
 */
export declare type StopLimitPendingTradeOptions = {

  /**
   * Defines the base price to calculate open price relative to for ORDER_MODIFY and pending order
   * requests. Default is CURRENT_PRICE for pending orders or STOP_LIMIT_PRICE for stop limit orders.
   * One of CURRENT_PRICE, OPEN_PRICE, STOP_LIMIT_PRICE
   */
  openPriceBase?: String,

  /**
   * Stop limit price units. ABSOLUTE_PRICE means the that the value of stopLimitPrice field is a
   * final stop limit price value. RELATIVE* means that the stopLimitPrice field value contains relative
   * stop limit price expressed either in price, points, pips, account currency or balance percentage. Default
   * is ABSOLUTE_PRICE. One of ABSOLUTE_PRICE, RELATIVE_PRICE, RELATIVE_POINTS, RELATIVE_PIPS, RELATIVE_CURRENCY,
   * RELATIVE_BALANCE_PERCENTAGE
   */
  stopLimitPriceUnits?: String
} & PendingTradeOptions

/**
 * Options for modifying orders
 */
export declare type ModifyOrderOptions = {

  /**
   * Distance trailing stop loss configuration
   */
  trailingStopLoss?: TrailingStopLoss,

  /**
   * Defines the base price to calculate SL/TP relative to for *_MODIFY and pending order requests.
   * STOP_PRICE means the SL/TP is relative to previous SL/TP value. Default is OPEN_PRICE, one of
   * CURRENT_PRICE, OPEN_PRICE, STOP_PRICE
   */
  stopPriceBase?: String,

  /**
   * Open price units. ABSOLUTE_PRICE means the that the value of openPrice field is a final open
   * price value. RELATIVE* means that the openPrice field value contains relative open price expressed
   * either in price, points, pips, account currency or balance percentage. Default is ABSOLUTE_PRICE. One of
   * ABSOLUTE_PRICE, RELATIVE_PRICE, RELATIVE_POINTS, RELATIVE_PIPS, RELATIVE_CURRENCY, RELATIVE_BALANCE_PERCENTAGE
   */
  openPriceUnits?: String,

  /**
   * Defines the base price to calculate open price relative to for ORDER_MODIFY and pending order
   * requests. Default is CURRENT_PRICE for pending orders or STOP_LIMIT_PRICE for stop limit orders.
   * One of CURRENT_PRICE, OPEN_PRICE, STOP_LIMIT_PRICE
   */
  openPriceBase?: String,

  /**
   * Stop limit price units. ABSOLUTE_PRICE means the that the value of stopLimitPrice field is a final
   * stop limit price value. RELATIVE* means that the stopLimitPrice field value contains relative stop
   * limit price expressed either in price, points, pips, account currency or balance percentage. Default is
   * ABSOLUTE_PRICE. One of ABSOLUTE_PRICE, RELATIVE_PRICE, RELATIVE_POINTS, RELATIVE_PIPS, RELATIVE_CURRENCY,
   * RELATIVE_BALANCE_PERCENTAGE
   */
  stopLimitPriceUnits?: String,

  /**
   * Defines the base price to calculate stop limit price relative to for ORDER_MODIFY requests. One of
   * CURRENT_PRICE, STOP_LIMIT_PRICE
   */
  stopLimitPriceBase?: String
}

/**
 * Pending order expiration settings
 */
export declare type ExpirationOptions = {

  /**
   * pending order expiration type. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_time for the list of
   * possible options. MetaTrader4 platform supports only ORDER_TIME_SPECIFIED expiration type. One of ORDER_TIME_GTC,
   * ORDER_TIME_DAY, ORDER_TIME_SPECIFIED, ORDER_TIME_SPECIFIED_DAY
   */
  type: String,

  /**
   * optional pending order expiration time. Ignored if expiration type is not one of
   * ORDER_TIME_DAY or ORDER_TIME_SPECIFIED
   */
  time?: Date
}

/**
 * Stop options
 */
export declare type StopOptions = {

  /**
   * stop (SL or TP) value
   */
  value: Number,

  /**
   * stop units. ABSOLUTE_PRICE means the that the value of value field is a final stop value.
   * RELATIVE_* means that the value field value contains relative stop expressed either in price, points, pips, account
   * currency or balance percentage. Default is ABSOLUTE_PRICE. Allowed values are ABSOLUTE_PRICE, RELATIVE_PRICE,
   * RELATIVE_POINTS, RELATIVE_PIPS, RELATIVE_CURRENCY, RELATIVE_BALANCE_PERCENTAGE
   */
  units: String
}