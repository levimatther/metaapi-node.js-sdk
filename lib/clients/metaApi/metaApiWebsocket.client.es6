'use strict';

import randomstring from 'randomstring';
import socketIO from 'socket.io-client';
import TimeoutError from '../timeoutError';
import {ValidationError, NotFoundError, InternalError, UnauthorizedError, TooManyRequestsError} from '../errorHandler';
import NotSynchronizedError from './notSynchronizedError';
import NotConnectedError from './notConnectedError';
import TradeError from './tradeError';
import PacketOrderer from './packetOrderer';
import SynchronizationThrottler from './synchronizationThrottler';
import SubscriptionManager from './subscriptionManager';

let PacketLogger;
if (typeof window === 'undefined') { // don't import PacketLogger for browser version
  PacketLogger = require('./packetLogger').default;
}

/**
 * MetaApi websocket API client (see https://metaapi.cloud/docs/client/websocket/overview/)
 */
export default class MetaApiWebsocketClient {

  /**
   * Constructs MetaApi websocket API client instance
   * @param {String} token authorization token
   * @param {Object} opts websocket client options
   */
  // eslint-disable-next-line complexity
  constructor(token, opts) {
    opts = opts || {};
    opts.packetOrderingTimeout = opts.packetOrderingTimeout || 60;
    opts.synchronizationThrottler = opts.synchronizationThrottler || {};
    this._application = opts.application || 'MetaApi';
    this._url = `https://mt-client-api-v1.${opts.domain || 'agiliumtrade.agiliumtrade.ai'}`;
    this._requestTimeout = (opts.requestTimeout || 60) * 1000;
    this._connectTimeout = (opts.connectTimeout || 60) * 1000;
    const retryOpts = opts.retryOpts || {};
    this._retries = retryOpts.retries || 5;
    this._minRetryDelayInSeconds = retryOpts.minDelayInSeconds || 1;
    this._maxRetryDelayInSeconds = retryOpts.maxDelayInSeconds || 30;
    this._token = token;
    this._requestResolves = {};
    this._synchronizationListeners = {};
    this._latencyListeners = [];
    this._reconnectListeners = [];
    this._connectedHosts = {};
    this._synchronizationThrottler = new SynchronizationThrottler(this, opts.synchronizationThrottler);
    this._synchronizationThrottler.start();
    this._subscriptionManager = new SubscriptionManager(this);
    this._statusTimers = {};
    this._isReconnecting = false;
    this._packetOrderer = new PacketOrderer(this, opts.packetOrderingTimeout);
    if(opts.packetLogger && opts.packetLogger.enabled) {
      this._packetLogger = new PacketLogger(opts.packetLogger);
      this._packetLogger.start();
    }
  }

  /**
   * Restarts the account synchronization process on an out of order packet
   * @param {String} accountId account id
   * @param {Number} instanceIndex instance index
   * @param {Number} expectedSequenceNumber expected s/n
   * @param {Number} actualSequenceNumber actual s/n
   * @param {Object} packet packet data
   * @param {Date} receivedAt time the packet was received at
   */
  onOutOfOrderPacket(accountId, instanceIndex, expectedSequenceNumber, actualSequenceNumber, packet, receivedAt) {
    console.error(`[${(new Date()).toISOString()}] MetaApi websocket client received an out of order ` +
      `packet type ${packet.type} for account id ${accountId}. Expected s/n ${expectedSequenceNumber} ` +
      `does not match the actual of ${actualSequenceNumber}`);
    this.ensureSubscribe(accountId, instanceIndex);
  }

  /**
   * Patch server URL for use in unit tests
   * @param {String} url patched server URL
   */
  set url(url) {
    this._url = url;
  }

  /**
   * Returns websocket client connection status.
   * @return {Boolean} websocket client connection status
   */
  get connected() {
    return (this._socket && this._socket.connected) || false;
  }

  /**
   * Connects to MetaApi server via socket.io protocol
   * @returns {Promise} promise which resolves when connection is established
   */
  async connect() {
    if (!this._connected) {
      this._connected = true;
      this._requestResolves = {};
      let resolve, reject;
      let resolved = false;
      let result = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      this._connectPromise = result;
      this._packetOrderer.start();
      this._sessionId = randomstring.generate(32);
      let clientId = Math.random();
      this._socket = socketIO(this._url, {
        path: '/ws',
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: this._connectTimeout,
        extraHeaders: {
          'Client-Id': clientId
        },
        query: {
          'auth-token': this._token,
          'clientId': clientId
        }
      });
      this._socket.on('connect', async () => {
        // eslint-disable-next-line no-console
        console.log('[' + (new Date()).toISOString() + '] MetaApi websocket client connected to the MetaApi server');
        this._isReconnecting = false;
        if (!resolved) {
          resolved = true;
          resolve();
        } else {
          await this._fireReconnected();
        }
        if (!this._connected) {
          this._socket.close();
        }
      });
      this._socket.on('reconnect', async () => {
        this._isReconnecting = false;
        await this._fireReconnected();
      });
      this._socket.on('connect_error', (err) => {
        // eslint-disable-next-line no-console
        console.log('[' + (new Date()).toISOString() + '] MetaApi websocket client connection error', err);
        this._isReconnecting = false;
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });
      this._socket.on('connect_timeout', (timeout) => {
        // eslint-disable-next-line no-console
        console.log('[' + (new Date()).toISOString() + '] MetaApi websocket client connection timeout');
        this._isReconnecting = false;
        if (!resolved) {
          resolved = true;
          reject(new TimeoutError('MetaApi websocket client connection timed out'));
        }
      });
      this._socket.on('disconnect', async (reason) => {
        this._synchronizationThrottler.onDisconnect();
        // eslint-disable-next-line no-console
        console.log('[' + (new Date()).toISOString() + '] MetaApi websocket client disconnected from the MetaApi ' +
          'server because of ' + reason);
        this._isReconnecting = false;
        await this._reconnect();
      });
      this._socket.on('error', async (error) => {
        // eslint-disable-next-line no-console
        console.error('[' + (new Date()).toISOString() + '] MetaApi websocket client error', error);
        this._isReconnecting = false;
        await this._reconnect();
      });
      this._socket.on('response', data => {
        let requestResolve = (this._requestResolves[data.requestId] || {resolve: () => {}, reject: () => {}});
        delete this._requestResolves[data.requestId];
        this._convertIsoTimeToDate(data);
        requestResolve.resolve(data);
        if (data.timestamps && requestResolve.type) {
          data.timestamps.clientProcessingFinished = new Date();
          for (let listener of this._latencyListeners) {
            Promise.resolve()
              .then(() => requestResolve.type === 'trade' ?
                listener.onTrade(data.accountId, data.timestamps) :
                listener.onResponse(data.accountId, requestResolve.type, data.timestamps))
              .catch(error => console.error('[' + (new Date()).toISOString() + '] Failed to process onResponse ' +
                'event for account ' + data.accountId + ', request type ' + requestResolve.type, error));
          }
        }
      });
      this._socket.on('processingError', data => {
        let requestResolve = (this._requestResolves[data.requestId] || {resolve: () => {}, reject: () => {}});
        delete this._requestResolves[data.requestId];
        requestResolve.reject(this._convertError(data));
      });
      this._socket.on('synchronization', async data => {
        if((!data.synchronizationId) || 
        this._synchronizationThrottler.activeSynchronizationIds.includes(data.synchronizationId)) {
          this._convertIsoTimeToDate(data);
          await this._processSynchronizationPacket(data);
        }
      });
      return result;
    }
  }

  /**
   * Closes connection to MetaApi server
   */
  close() {
    if (this._connected) {
      this._connected = false;
      this._socket.close();
      for (let requestResolve of Object.values(this._requestResolves)) {
        requestResolve.reject(new Error('MetaApi connection closed'));
      }
      this._requestResolves = {};
      this._synchronizationListeners = {};
      this._latencyListeners = [];
      this._packetOrderer.stop();
    }
  }

  /**
   * MetaTrader account information (see https://metaapi.cloud/docs/client/models/metatraderAccountInformation/)
   * @typedef {Object} MetatraderAccountInformation
   * @property {String} platform platform id (mt4 or mt5)
   * @property {String} broker broker name
   * @property {String} currency account base currency ISO code
   * @property {String} server broker server name
   * @property {Number} balance account balance
   * @property {Number} equity account liquidation value
   * @property {Number} margin used margin
   * @property {Number} freeMargin free margin
   * @property {Number} leverage account leverage coefficient
   * @property {Number} marginLevel margin level calculated as % of equity/margin
   * @property {Boolean} tradeAllowed flag indicating that trading is allowed
   * @property {Boolean} [investorMode] flag indicating that investor password was used (supported for g2 only)
   * @property {String} marginMode margin calculation mode, one of ACCOUNT_MARGIN_MODE_EXCHANGE,
   * ACCOUNT_MARGIN_MODE_RETAIL_NETTING, ACCOUNT_MARGIN_MODE_RETAIL_HEDGING
   * @property {String} name Account owner name
   * @property {Number} login Account login
   * @property {Number} credit Account credit in the deposit currency
   */

  /**
   * Returns account information for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readAccountInformation/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @returns {Promise<MetatraderAccountInformation>} promise resolving with account information
   */
  async getAccountInformation(accountId) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getAccountInformation'});
    return response.accountInformation;
  }

  /**
   * MetaTrader position
   * @typedef {Object} MetatraderPosition
   * @property {Number} id position id (ticket number)
   * @property {String} type position type (one of POSITION_TYPE_BUY, POSITION_TYPE_SELL)
   * @property {String} symbol position symbol
   * @property {Number} magic position magic number, identifies the EA which opened the position
   * @property {Date} time time position was opened at
   * @property {String} brokerTime time position was opened at, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {Date} updateTime last position modification time
   * @property {Number} openPrice position open price
   * @property {Number} currentPrice current price
   * @property {Number} currentTickValue current tick value
   * @property {Number} [stopLoss] optional position stop loss price
   * @property {Number} [takeProfit] optional position take profit price
   * @property {Number} volume position volume
   * @property {Number} swap position cumulative swap
   * @property {Number} profit position cumulative profit
   * @property {String} [comment] optional position comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 26. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {String} [clientId] optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {Number} unrealizedProfit profit of the part of the position which is not yet closed, including swap
   * @property {Number} realizedProfit profit of the already closed part, including commissions and swap
   * @property {Number} commission position commission
   * @property {String} reason position opening reason. One of POSITION_REASON_CLIENT, POSITION_REASON_EXPERT,
   * POSITION_REASON_MOBILE, POSITION_REASON_WEB, POSITION_REASON_UNKNOWN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/positionproperties#enum_position_reason',
   * @property {Number} [accountCurrencyExchangeRate] current exchange rate of account currency into USD
   * @property {String} [originalComment] position original comment (present if possible to restore from history)
   * @property {String} [updatePending] flag indicating that position original comment and clientId was not identified
   * yet and will be updated in a future packet
   */

  /**
   * Returns positions for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPositions/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @returns {Promise<Array<MetatraderPosition>} promise resolving with array of open positions
   */
  async getPositions(accountId) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getPositions'});
    return response.positions;
  }

  /**
   * Returns specific position for a MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPosition/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} positionId position id
   * @return {Promise<MetatraderPosition>} promise resolving with MetaTrader position found
   */
  async getPosition(accountId, positionId) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getPosition', positionId});
    return response.position;
  }

  /**
   * MetaTrader order
   * @typedef {Object} MetatraderOrder
   * @property {Number} id order id (ticket number)
   * @property {String} type order type (one of ORDER_TYPE_SELL, ORDER_TYPE_BUY, ORDER_TYPE_BUY_LIMIT,
   * ORDER_TYPE_SELL_LIMIT, ORDER_TYPE_BUY_STOP, ORDER_TYPE_SELL_STOP). See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type
   * @property {String} state order state one of (ORDER_STATE_STARTED, ORDER_STATE_PLACED, ORDER_STATE_CANCELED,
   * ORDER_STATE_PARTIAL, ORDER_STATE_FILLED, ORDER_STATE_REJECTED, ORDER_STATE_EXPIRED, ORDER_STATE_REQUEST_ADD,
   * ORDER_STATE_REQUEST_MODIFY, ORDER_STATE_REQUEST_CANCEL). See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_state
   * @property {Number} magic order magic number, identifies the EA which created the order
   * @property {Date} time time order was created at
   * @property {String} brokerTime time time order was created at, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {Date} [doneTime] time order was executed or canceled at. Will be specified for
   * completed orders only
   * @property {String} [doneBrokerTime] time order was executed or canceled at, in broker timezone,
   * YYYY-MM-DD HH:mm:ss.SSS format. Will be specified for completed orders only
   * @property {String} symbol order symbol
   * @property {Number} openPrice order open price (market price for market orders, limit price for limit orders or stop
   * price for stop orders)
   * @property {Number} currentPrice current price
   * @property {Number} [stopLoss] order stop loss price
   * @property {Number} [takeProfit] order take profit price
   * @property {Number} volume order requested quantity
   * @property {Number} currentVolume order remaining quantity, i.e. requested quantity - filled quantity
   * @property {String} positionId order position id. Present only if the order has a position attached to it
   * @property {String} [comment] order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 26. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {String} originalComment optional order original comment (present if possible to restore original comment
   * from history)
   * @property {String} [clientId] client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {String} platform platform id (mt4 or mt5)
   * @property {Boolean} [updatePending] flag indicating that order client id and original comment was not
   * identified yet and will be updated in a future synchronization packet
   * @property {String} reason order opening reason. One of ORDER_REASON_CLIENT, ORDER_REASON_MOBILE, ORDER_REASON_WEB,
   * ORDER_REASON_EXPERT, ORDER_REASON_SL, ORDER_REASON_TP, ORDER_REASON_SO, ORDER_REASON_UNKNOWN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_reason.
   * @property {String} fillingMode order filling mode. One of ORDER_FILLING_FOK, ORDER_FILLING_IOC,
   * ORDER_FILLING_RETURN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_filling.
   * @property {String} expirationType order expiration type. One of ORDER_TIME_GTC, ORDER_TIME_DAY,
   * ORDER_TIME_SPECIFIED, ORDER_TIME_SPECIFIED_DAY. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_time
   * @property {Date} expirationTime optional order expiration time
   * @property {Number} [accountCurrencyExchangeRate] current exchange rate of account currency into USD
   * @property {String} [closeByPositionId] identifier of an opposite position used for closing by order
   * ORDER_TYPE_CLOSE_BY
   * @property {Number} [stopLimitPrice] the Limit order price for the StopLimit order
   */

  /**
   * Returns open orders for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrders/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @return {Promise<Array<MetatraderOrder>>} promise resolving with open MetaTrader orders
   */
  async getOrders(accountId) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getOrders'});
    return response.orders;
  }

  /**
   * Returns specific open order for a MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrder/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} orderId order id (ticket number)
   * @return {Promise<MetatraderOrder>} promise resolving with metatrader order found
   */
  async getOrder(accountId, orderId) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getOrder', orderId});
    return response.order;
  }

  /**
   * MetaTrader history orders search query response
   * @typedef {Object} MetatraderHistoryOrders
   * @property {Array<MetatraderOrder>} historyOrders array of history orders returned
   * @property {Boolean} synchronizing flag indicating that history order initial synchronization is still in progress
   * and thus search results may be incomplete
   */

  /**
   * Returns the history of completed orders for a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTicket/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} ticket ticket number (order id)
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  async getHistoryOrdersByTicket(accountId, ticket) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getHistoryOrdersByTicket', ticket});
    return {
      historyOrders: response.historyOrders,
      synchronizing: response.synchronizing
    };
  }

  /**
   * Returns the history of completed orders for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByPosition/)
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} positionId position id
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  async getHistoryOrdersByPosition(accountId, positionId) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getHistoryOrdersByPosition',
      positionId});
    return {
      historyOrders: response.historyOrders,
      synchronizing: response.synchronizing
    };
  }

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
  async getHistoryOrdersByTimeRange(accountId, startTime, endTime, offset = 0, limit = 1000) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getHistoryOrdersByTimeRange',
      startTime, endTime, offset, limit});
    return {
      historyOrders: response.historyOrders,
      synchronizing: response.synchronizing
    };
  }

  /**
   * MetaTrader history deals search query response
   * @typedef {Object} MetatraderDeals
   * @property {Array<MetatraderDeal>} deals array of history deals returned
   * @property {Boolean} synchronizing flag indicating that deal initial synchronization is still in progress
   * and thus search results may be incomplete
   */

  /**
   * MetaTrader deal
   * @typedef {Object} MetatraderDeal
   * @property {String} id deal id (ticket number)
   * @property {String} type deal type (one of DEAL_TYPE_BUY, DEAL_TYPE_SELL, DEAL_TYPE_BALANCE, DEAL_TYPE_CREDIT,
   * DEAL_TYPE_CHARGE, DEAL_TYPE_CORRECTION, DEAL_TYPE_BONUS, DEAL_TYPE_COMMISSION, DEAL_TYPE_COMMISSION_DAILY,
   * DEAL_TYPE_COMMISSION_MONTHLY, DEAL_TYPE_COMMISSION_AGENT_DAILY, DEAL_TYPE_COMMISSION_AGENT_MONTHLY,
   * DEAL_TYPE_INTEREST, DEAL_TYPE_BUY_CANCELED, DEAL_TYPE_SELL_CANCELED, DEAL_DIVIDEND, DEAL_DIVIDEND_FRANKED,
   * DEAL_TAX). See https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties#enum_deal_type
   * @property {String} entryType deal entry type (one of DEAL_ENTRY_IN, DEAL_ENTRY_OUT, DEAL_ENTRY_INOUT,
   * DEAL_ENTRY_OUT_BY). See https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties#enum_deal_entry
   * @property {String} [symbol] symbol deal relates to
   * @property {Number} [magic] deal magic number, identifies the EA which initiated the deal
   * @property {Date} time time the deal was conducted at
   * @property {String} brokerTime time time the deal was conducted at, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {Number} [volume] deal volume
   * @property {Number} [price] the price the deal was conducted at
   * @property {Number} [commission] deal commission
   * @property {Number} [swap] deal swap
   * @property {Number} profit deal profit
   * @property {String} [positionId] id of position the deal relates to
   * @property {String} [orderId] id of order the deal relates to
   * @property {String} [comment] deal comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 26. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {String} [originalComment] deal original comment (present if possible to restore original comment
   * from history)
   * @property {String} [clientId] client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {String} platform platform id (mt4 or mt5)
   * @property {Boolean} [updatePending] flag indicating that deal client id and original comment was not
   * identified yet and will be updated in a future synchronization packet
   * @property {String} [reason] optional deal execution reason. One of DEAL_REASON_CLIENT, DEAL_REASON_MOBILE,
   * DEAL_REASON_WEB, DEAL_REASON_EXPERT, DEAL_REASON_SL, DEAL_REASON_TP, DEAL_REASON_SO, DEAL_REASON_ROLLOVER,
   * DEAL_REASON_VMARGIN, DEAL_REASON_SPLIT, DEAL_REASON_UNKNOWN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties#enum_deal_reason.
   * @property {Number} [accountCurrencyExchangeRate] current exchange rate of account currency into USD
   */

  /**
   * Returns history deals with a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTicket/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} ticket ticket number (deal id for MT5 or order id for MT4)
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  async getDealsByTicket(accountId, ticket) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getDealsByTicket', ticket});
    return {
      deals: response.deals,
      synchronizing: response.synchronizing
    };
  }

  /**
   * Returns history deals for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByPosition/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} positionId position id
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  async getDealsByPosition(accountId, positionId) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getDealsByPosition', positionId});
    return {
      deals: response.deals,
      synchronizing: response.synchronizing
    };
  }

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
  async getDealsByTimeRange(accountId, startTime, endTime, offset = 0, limit = 1000) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getDealsByTimeRange', startTime,
      endTime, offset, limit});
    return {
      deals: response.deals,
      synchronizing: response.synchronizing
    };
  }

  /**
   * Clears the order and transaction history of a specified application so that it can be synchronized from scratch
   * (see https://metaapi.cloud/docs/client/websocket/api/removeHistory/).
   * @param {String} accountId id of the MetaTrader account to remove history for
   * @param {String} [application] application to remove history for
   * @return {Promise} promise resolving when the history is cleared
   */
  removeHistory(accountId, application) {
    return this._rpcRequest(accountId, {application, type: 'removeHistory'});
  }

  /**
   * Clears the order and transaction history of a specified application and removes the application (see
   * https://metaapi.cloud/docs/client/websocket/api/removeApplication/).
   * @param {String} accountId id of the MetaTrader account to remove history and application for
   * @return {Promise} promise resolving when the history is cleared
   */
  removeApplication(accountId) {
    return this._rpcRequest(accountId, {type: 'removeApplication'});
  }

  /**
   * MetaTrader trade response
   * @typedef {Object} MetatraderTradeResponse
   * @property {Number} numericCode numeric response code, see
   * https://www.mql5.com/en/docs/constants/errorswarnings/enum_trade_return_codes and
   * https://book.mql4.com/appendix/errors. Response codes which indicate success are 0, 10008-10010, 10025. The rest
   * codes are errors
   * @property {String} stringCode string response code, see
   * https://www.mql5.com/en/docs/constants/errorswarnings/enum_trade_return_codes and
   * https://book.mql4.com/appendix/errors. Response codes which indicate success are ERR_NO_ERROR,
   * TRADE_RETCODE_PLACED, TRADE_RETCODE_DONE, TRADE_RETCODE_DONE_PARTIAL, TRADE_RETCODE_NO_CHANGES. The rest codes are
   * errors.
   * @property {String} message human-readable response message
   * @property {String} orderId order id which was created/modified during the trade
   * @property {String} positionId position id which was modified during the trade
   */

  /**
   * Execute a trade on a connected MetaTrader account (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} accountId id of the MetaTrader account to execute trade for
   * @param {MetatraderTrade} trade trade to execute (see docs for possible trade types)
   * @returns {Promise<MetatraderTradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  async trade(accountId, trade) {
    let response = await this._rpcRequest(accountId, {type: 'trade', trade});
    response.response = response.response || {};
    response.response.stringCode = response.response.stringCode || response.response.description;
    response.response.numericCode = response.response.numericCode !== undefined ? response.response.numericCode :
      response.response.error;
    if (['ERR_NO_ERROR', 'TRADE_RETCODE_PLACED', 'TRADE_RETCODE_DONE', 'TRADE_RETCODE_DONE_PARTIAL',
      'TRADE_RETCODE_NO_CHANGES'].includes(response.response.stringCode || response.response.description)) {
      return response.response;
    } else {
      throw new TradeError(response.response.message, response.response.numericCode, response.response.stringCode);
    }
  }

  /**
   * Creates a task that ensures the account gets subscribed to the server
   * @param {String} accountId account id to subscribe
   * @param {Number} [instanceIndex] instance index
   */
  ensureSubscribe(accountId, instanceIndex) {
    this._subscriptionManager.subscribe(accountId, instanceIndex);
  }

  /**
   * Subscribes to the Metatrader terminal events (see https://metaapi.cloud/docs/client/websocket/api/subscribe/).
   * @param {String} accountId id of the MetaTrader account to subscribe to
   * @param {Number} [instanceIndex] instance index
   * @returns {Promise} promise which resolves when subscription started
   */
  subscribe(accountId, instanceIndex) {
    return this._rpcRequest(accountId, {type: 'subscribe', instanceIndex});
  }

  /**
   * Reconnects to the Metatrader terminal (see https://metaapi.cloud/docs/client/websocket/api/reconnect/).
   * @param {String} accountId id of the MetaTrader account to reconnect
   * @returns {Promise} promise which resolves when reconnection started
   */
  reconnect(accountId) {
    return this._rpcRequest(accountId, {type: 'reconnect'});
  }

  /**
   * Requests the terminal to start synchronization process
   * (see https://metaapi.cloud/docs/client/websocket/synchronizing/synchronize/).
   * @param {String} accountId id of the MetaTrader account to synchronize
   * @param {Number} instanceIndex instance index
   * @param {String} synchronizationId synchronization request id
   * @param {Date} startingHistoryOrderTime from what date to start synchronizing history orders from. If not specified,
   * the entire order history will be downloaded.
   * @param {Date} startingDealTime from what date to start deal synchronization from. If not specified, then all
   * history deals will be downloaded.
   * @returns {Promise} promise which resolves when synchronization started
   */
  synchronize(accountId, instanceIndex, synchronizationId, startingHistoryOrderTime, startingDealTime) {
    return this._synchronizationThrottler.scheduleSynchronize(accountId, {requestId: synchronizationId, 
      type: 'synchronize', startingHistoryOrderTime, startingDealTime, instanceIndex});
  }

  /**
   * Waits for server-side terminal state synchronization to complete.
   * (see https://metaapi.cloud/docs/client/websocket/synchronizing/waitSynchronized/).
   * @param {String} accountId id of the MetaTrader account to synchronize
   * @param {Number} instanceIndex instance index
   * @param {String} applicationPattern MetaApi application regular expression pattern, default is .*
   * @param {Number} timeoutInSeconds timeout in seconds, default is 300 seconds
   * @returns {Promise} promise which resolves when synchronization started
   */
  waitSynchronized(accountId, instanceIndex, applicationPattern, timeoutInSeconds) {
    return this._rpcRequest(accountId, {type: 'waitSynchronized', applicationPattern, timeoutInSeconds, instanceIndex},
      timeoutInSeconds + 1);
  }

  /**
   * Market data subscription
   * @typedef {Object} MarketDataSubscription
   * @property {string} type subscription type, one of quotes, candles, ticks, or marketDepth
   * @property {string} [timeframe] when subscription type is candles, defines the timeframe according to which the
   * candles must be generated. Allowed values for MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h,
   * 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed values for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   * @property {number} [intervalInMilliseconds] defines how frequently the terminal will stream data to client. If not
   * set, then the value configured in account will be used
   */

  /**
   * Subscribes on market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/subscribeToMarketData/).
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceIndex instance index
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataSubscription>} subscriptions array of market data subscription to create or update
   * @returns {Promise} promise which resolves when subscription request was processed
   */
  subscribeToMarketData(accountId, instanceIndex, symbol, subscriptions) {
    return this._rpcRequest(accountId, {type: 'subscribeToMarketData', symbol, subscriptions, instanceIndex});
  }

  /**
   * Market data unsubscription
   * @typedef {Object} MarketDataUnsubscription
   * @property {string} type subscription type, one of quotes, candles, ticks, or marketDepth
   */

  /**
   * Unsubscribes from market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/unsubscribeFromMarketData/).
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceIndex instance index
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataUnsubscription>} subscriptions array of subscriptions to cancel
   * @param {Number} instanceIndex instance index
   * @returns {Promise} promise which resolves when unsubscription request was processed
   */
  unsubscribeFromMarketData(accountId, instanceIndex, symbol, subscriptions) {
    return this._rpcRequest(accountId, {type: 'unsubscribeFromMarketData', symbol, subscriptions, instanceIndex});
  }

  /**
   * Retrieves symbols available on an account (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbols/).
   * @param {String} accountId id of the MetaTrader account to retrieve symbols for
   * @returns {Promise<Array<string>>} promise which resolves when symbols are retrieved
   */
  async getSymbols(accountId) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getSymbols'});
    return response.symbols;
  }

  /**
   * Retrieves specification for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolSpecification/).
   * @param {String} accountId id of the MetaTrader account to retrieve symbol specification for
   * @param {String} symbol symbol to retrieve specification for
   * @returns {Promise<MetatraderSymbolSpecification>} promise which resolves when specification is retrieved
   */
  async getSymbolSpecification(accountId, symbol) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getSymbolSpecification', symbol});
    return response.specification;
  }

  /**
   * Retrieves price for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolPrice/).
   * @param {String} accountId id of the MetaTrader account to retrieve symbol price for
   * @param {String} symbol symbol to retrieve price for
   * @returns {Promise<MetatraderSymbolPrice>} promise which resolves when price is retrieved
   */
  async getSymbolPrice(accountId, symbol) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getSymbolPrice', symbol});
    return response.price;
  }

  /**
   * Retrieves price for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readCandle/).
   * @param {string} accountId id of the MetaTrader account to retrieve candle for
   * @param {string} symbol symbol to retrieve candle for
   * @param {string} timeframe defines the timeframe according to which the candle must be generated. Allowed values for
   * MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed values
   * for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   * @returns {Promise<MetatraderCandle>} promise which resolves when candle is retrieved
   */
  async getCandle(accountId, symbol, timeframe) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getCandle', symbol, timeframe});
    return response.candle;
  }

  /**
   * Retrieves latest tick for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readTick/).
   * @param {string} accountId id of the MetaTrader account to retrieve symbol tick for
   * @param {string} symbol symbol to retrieve tick for
   * @returns {Promise<MetatraderTick>} promise which resolves when tick is retrieved
   */
  async getTick(accountId, symbol) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getTick', symbol});
    return response.tick;
  }

  /**
   * Retrieves latest order book for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readBook/).
   * @param {string} accountId id of the MetaTrader account to retrieve symbol order book for
   * @param {string} symbol symbol to retrieve order book for
   * @returns {Promise<MetatraderBook>} promise which resolves when order book is retrieved
   */
  async getBook(accountId, symbol) {
    let response = await this._rpcRequest(accountId, {application: 'RPC', type: 'getBook', symbol});
    return response.book;
  }

  /**
   * Sends client uptime stats to the server.
   * @param {String} accountId id of the MetaTrader account to retrieve symbol price for
   * @param {Object} uptime uptime statistics to send to the server
   * @returns {Promise} promise which resolves when uptime statistics is submitted
   */
  saveUptime(accountId, uptime) {
    return this._rpcRequest(accountId, {type: 'saveUptime', uptime});
  }

  /**
   * Unsubscribe from account (see
   * https://metaapi.cloud/docs/client/websocket/api/synchronizing/unsubscribe).
   * @param {String} accountId id of the MetaTrader account to retrieve symbol price for
   * @returns {Promise} promise which resolves when socket unsubscribed
   */
  async unsubscribe(accountId) {
    this._subscriptionManager.cancelAccount(accountId);
    try {
      return await this._rpcRequest(accountId, {type: 'unsubscribe'});
    } catch (err) {
      if(!(err instanceof NotFoundError)) {
        throw err;
      }
    }
  }

  /**
   * Adds synchronization listener for specific account
   * @param {String} accountId account id
   * @param {SynchronizationListener} listener synchronization listener to add
   */
  addSynchronizationListener(accountId, listener) {
    let listeners = this._synchronizationListeners[accountId];
    if (!listeners) {
      listeners = [];
      this._synchronizationListeners[accountId] = listeners;
    }
    listeners.push(listener);
  }

  /**
   * Removes synchronization listener for specific account
   * @param {String} accountId account id
   * @param {SynchronizationListener} listener synchronization listener to remove
   */
  removeSynchronizationListener(accountId, listener) {
    let listeners = this._synchronizationListeners[accountId];
    if (!listeners) {
      listeners = [];
    }
    listeners = listeners.filter(l => l !== listener);
    this._synchronizationListeners[accountId] = listeners;
  }

  /**
   * Adds latency listener
   * @param {LatencyListener} listener latency listener to add
   */
  addLatencyListener(listener) {
    this._latencyListeners.push(listener);
  }

  /**
   * Removes latency listener
   * @param {LatencyListener} listener latency listener to remove
   */
  removeLatencyListener(listener) {
    this._latencyListeners = this._latencyListeners.filter(l => l !== listener);
  }

  /**
   * Adds reconnect listener
   * @param {ReconnectListener} listener reconnect listener to add
   */
  addReconnectListener(listener) {
    this._reconnectListeners.push(listener);
  }

  /**
   * Removes reconnect listener
   * @param {ReconnectListener} listener listener to remove
   */
  removeReconnectListener(listener) {
    this._reconnectListeners = this._reconnectListeners.filter(l => l !== listener);
  }

  /**
   * Removes all listeners. Intended for use in unit tests.
   */
  removeAllListeners() {
    this._synchronizationListeners = {};
    this._reconnectListeners = [];
  }

  async _reconnect() {
    while (!this._socket.connected && !this._isReconnecting && this._connected) {
      await this._tryReconnect();
    }
  }

  _tryReconnect() {
    return new Promise((resolve) => setTimeout(() => {
      if (!this._socket.connected && !this._isReconnecting && this._connected) {
        this._sessionId = randomstring.generate(32);
        const clientId = Math.random();
        this._socket.close();
        this._socket.io.opts.extraHeaders['Client-Id'] = clientId;
        this._socket.io.opts.query.clientId = clientId;
        this._isReconnecting = true;
        this._socket.connect();
      }
      resolve();
    }, 1000));
  }

  //eslint-disable-next-line complexity
  async _rpcRequest(accountId, request, timeoutInSeconds) {
    if (!this._connected) {
      await this.connect();
    } else if(!this.connected) {
      await this._connectPromise;
    }
    if(request.type === 'subscribe') {
      request.sessionId = this._sessionId;
    }
    if(['trade', 'subscribe'].includes(request.type)) {
      return this._makeRequest(accountId, request, timeoutInSeconds);
    }
    let retryCounter = 0;
    while (true) { //eslint-disable-line no-constant-condition
      try {
        return await this._makeRequest(accountId, request, timeoutInSeconds);
      } catch(err) {
        if(err.name === 'TooManyRequestsError') {
          let calcRetryCounter = retryCounter;
          let calcRequestTime = 0;
          while(calcRetryCounter < this._retries) {
            calcRetryCounter++;
            calcRequestTime += Math.min(Math.pow(2, calcRetryCounter) * this._minRetryDelayInSeconds,
              this._maxRetryDelayInSeconds) * 1000;
          }
          const retryTime = new Date(err.metadata.recommendedRetryTime).getTime();
          if (Date.now() + calcRequestTime > retryTime && retryCounter < this._retries) {
            if(Date.now() < retryTime) {
              await new Promise(res => setTimeout(res, retryTime - Date.now()));
            }
            retryCounter++;
          } else {
            throw err;
          }
        } else if(['NotSynchronizedError', 'TimeoutError', 'NotAuthenticatedError',
          'InternalError'].includes(err.name) && 
          retryCounter < this._retries) {
          await new Promise(res => setTimeout(res, Math.min(Math.pow(2, retryCounter) * 
            this._minRetryDelayInSeconds, this._maxRetryDelayInSeconds) * 1000));
          retryCounter++;
        } else {
          throw err;
        }
      }
    }
  }

  _makeRequest(accountId, request, timeoutInSeconds) {
    let requestId = request.requestId || randomstring.generate(32);
    request.timestamps = {clientProcessingStarted: new Date()};
    let result = Promise.race([
      new Promise((resolve, reject) => this._requestResolves[requestId] = {resolve, reject, type: request.type}),
      new Promise((resolve, reject) => setTimeout(() => reject(new TimeoutError('MetaApi websocket client ' + 
        `request ${request.requestId} of type ${request.type} timed out. Please make sure your account is connected ` +
          'to broker before retrying your request.')), (timeoutInSeconds * 1000) || this._requestTimeout))
    ]);
    request.accountId = accountId;
    request.application = request.application || this._application;
    if (!request.requestId) {
      request.requestId = requestId;
    }
    this._socket.emit('request', request);
    return result;
  }

  // eslint-disable-next-line complexity
  _convertError(data) {
    if (data.error === 'ValidationError') {
      return new ValidationError(data.message, data.details);
    } else if (data.error === 'NotFoundError') {
      return new NotFoundError(data.message);
    } else if (data.error === 'NotSynchronizedError') {
      return new NotSynchronizedError(data.message);
    } else if (data.error === 'TimeoutError') {
      return new TimeoutError(data.message);
    } else if (data.error === 'NotAuthenticatedError') {
      return new NotConnectedError(data.message);
    } else if (data.error === 'TradeError') {
      return new TradeError(data.message, data.numericCode, data.stringCode);
    } else if (data.error === 'UnauthorizedError') {
      this.close();
      return new UnauthorizedError(data.message);
    } else if (data.error === 'TooManyRequestsError') {
      return new TooManyRequestsError(data.message, data.metadata);
    } else {
      return new InternalError(data.message);
    }
  }

  // eslint-disable-next-line complexity
  _convertIsoTimeToDate(packet) {
    // eslint-disable-next-line guard-for-in
    for (let field in packet) {
      let value = packet[field];
      if (typeof value === 'string' && field.match(/time$|Time$/) && 
        !field.match(/brokerTime$|BrokerTime$|timeframe$/)) {
        packet[field] = new Date(value);
      }
      if (Array.isArray(value)) {
        for (let item of value) {
          this._convertIsoTimeToDate(item);
        }
      }
      if (typeof value === 'object') {
        this._convertIsoTimeToDate(value);
      }
    }
    if (packet && packet.timestamps) {
      // eslint-disable-next-line guard-for-in
      for (let field in packet.timestamps) {
        packet.timestamps[field] = new Date(packet.timestamps[field]);
      }
    }
    if (packet && packet.type === 'prices') {
      for (let price of packet.prices || []) {
        if (price.timestamps) {
          // eslint-disable-next-line guard-for-in
          for (let field in price.timestamps) {
            price.timestamps[field] = new Date(price.timestamps[field]);
          }
        }
      }
    }
  }

  /**
   * MetaTrader symbol specification. Contains symbol specification (see
   * https://metaapi.cloud/docs/client/models/metatraderSymbolSpecification/)
   * @typedef {Object} MetatraderSymbolSpecification
   * @property {String} symbol symbol (e.g. a currency pair or an index)
   * @property {Number} tickSize tick size
   * @property {Number} minVolume minimum order volume for the symbol
   * @property {Number} maxVolume maximum order volume for the symbol
   * @property {Number} volumeStep order volume step for the symbol
   * @property {Array<String>} list of allowed order filling modes. Can contain ORDER_FILLING_FOK, ORDER_FILLING_IOC or
   * both. See https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#symbol_filling_mode for more
   * details.
   * @property {String} deal execution mode. Possible values are SYMBOL_TRADE_EXECUTION_REQUEST,
   * SYMBOL_TRADE_EXECUTION_INSTANT, SYMBOL_TRADE_EXECUTION_MARKET, SYMBOL_TRADE_EXECUTION_EXCHANGE. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_trade_execution for more
   * details.
   * @property {Number} contractSize trade contract size
   * @property {MetatraderSessions} quoteSessions quote sessions, indexed by day of week
   * @property {MetatraderSessions} tradeSessions trade sessions, indexed by day of week
   * @property {String} [tradeMode] order execution type. Possible values are SYMBOL_TRADE_MODE_DISABLED,
   * SYMBOL_TRADE_MODE_LONGONLY, SYMBOL_TRADE_MODE_SHORTONLY, SYMBOL_TRADE_MODE_CLOSEONLY, SYMBOL_TRADE_MODE_FULL. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_trade_mode for more
   * details
   * @property {Number} [bondAccruedInterest] accrued interest – accumulated coupon interest, i.e. part of the coupon
   * interest calculated in proportion to the number of days since the coupon bond issuance or the last coupon interest
   * payment
   * @property {Number} [bondFaceValue] face value – initial bond value set by the issuer
   * @property {Number} [optionStrike] the strike price of an option. The price at which an option buyer can buy (in a
   * Call option) or sell (in a Put option) the underlying asset, and the option seller is obliged to sell or buy the
   * appropriate amount of the underlying asset.
   * @property {Number} [optionPriceSensivity] option/warrant sensitivity shows by how many points the price of the
   * option's underlying asset should change so that the price of the option changes by one point
   * @property {Number} [liquidityRate] liquidity Rate is the share of the asset that can be used for the margin
   * @property {Number} initialMargin initial margin means the amount in the margin currency required for opening a
   * position with the volume of one lot. It is used for checking a client's assets when he or she enters the market
   * @property {Number} maintenanceMargin the maintenance margin. If it is set, it sets the margin amount in the margin
   * currency of the symbol, charged from one lot. It is used for checking a client's assets when his/her account state
   * changes. If the maintenance margin is equal to 0, the initial margin is used
   * @property {Number} hedgedMargin contract size or margin value per one lot of hedged positions (oppositely directed
   * positions of one symbol). Two margin calculation methods are possible for hedged positions. The calculation method
   * is defined by the broker
   * @property {Boolean} [hedgedMarginUsesLargerLeg] calculating hedging margin using the larger leg (Buy or Sell)
   * @properties {String} marginCurrency margin currency
   * @property {String} priceCalculationMode contract price calculation mode. One of SYMBOL_CALC_MODE_UNKNOWN,
   * SYMBOL_CALC_MODE_FOREX, SYMBOL_CALC_MODE_FOREX_NO_LEVERAGE, SYMBOL_CALC_MODE_FUTURES, SYMBOL_CALC_MODE_CFD,
   * SYMBOL_CALC_MODE_CFDINDEX, SYMBOL_CALC_MODE_CFDLEVERAGE, SYMBOL_CALC_MODE_EXCH_STOCKS,
   * SYMBOL_CALC_MODE_EXCH_FUTURES, SYMBOL_CALC_MODE_EXCH_FUTURES_FORTS, SYMBOL_CALC_MODE_EXCH_BONDS,
   * SYMBOL_CALC_MODE_EXCH_STOCKS_MOEX, SYMBOL_CALC_MODE_EXCH_BONDS_MOEX, SYMBOL_CALC_MODE_SERV_COLLATERAL. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_calc_mode for more details
   * @property {String} baseCurrency base currency
   * @property {String} [profitCurrency] profit currency
   * @property {String} swapMode swap calculation model. Allowed values are SYMBOL_SWAP_MODE_DISABLED,
   * SYMBOL_SWAP_MODE_POINTS, SYMBOL_SWAP_MODE_CURRENCY_SYMBOL, SYMBOL_SWAP_MODE_CURRENCY_MARGIN,
   * SYMBOL_SWAP_MODE_CURRENCY_DEPOSIT, SYMBOL_SWAP_MODE_INTEREST_CURRENT, SYMBOL_SWAP_MODE_INTEREST_OPEN,
   * SYMBOL_SWAP_MODE_REOPEN_CURRENT, SYMBOL_SWAP_MODE_REOPEN_BID. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_swap_mode for more details
   * @property {Number} [swapLong] long swap value
   * @property {Number} [swapShort] short swap value
   * @property {String} [swapRollover3Days] day of week to charge 3 days swap rollover. Allowed values are SUNDAY,
   * MONDAY, TUESDAY, WEDNESDAY, THURDAY, FRIDAY, SATURDAY
   * @property {Array<String>} allowedExpirationModes allowed order expiration modes. Allowed values are
   * SYMBOL_EXPIRATION_GTC, SYMBOL_EXPIRATION_DAY, SYMBOL_EXPIRATION_SPECIFIED, SYMBOL_EXPIRATION_SPECIFIED_DAY.
   * See https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#symbol_expiration_mode for more
   * details
   * @property {Array<String>} allowedOrderTypes allowed order types. Allowed values are SYMBOL_ORDER_MARKET,
   * SYMBOL_ORDER_LIMIT, SYMBOL_ORDER_STOP, SYMBOL_ORDER_STOP_LIMIT, SYMBOL_ORDER_SL, SYMBOL_ORDER_TP,
   * SYMBOL_ORDER_CLOSEBY. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#symbol_order_mode for more details
   * @property {String} orderGTCMode if the expirationMode property is set to SYMBOL_EXPIRATION_GTC (good till
   * canceled), the expiration of pending orders, as well as of Stop Loss/Take Profit orders should be additionally set
   * using this enumeration. Allowed values are SYMBOL_ORDERS_GTC, SYMBOL_ORDERS_DAILY,
   * SYMBOL_ORDERS_DAILY_EXCLUDING_STOPS. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_order_gtc_mode for more
   * details
   * @property {Number} digits digits after a decimal point
   * @property {String} [path] path in the symbol tree
   * @property {String} description symbol description
   * @property {Date} [startTime] date of the symbol trade beginning (usually used for futures)
   * @property {Date} [expirationTime] date of the symbol trade end (usually used for futures)
   */

  /**
   * Metatrader trade or quote session container, indexed by weekday
   * @typedef {Object} MetatraderSessions
   * @property {Array<MetatraderSession>} [SUNDAY] array of sessions for SUNDAY
   * @property {Array<MetatraderSession>} [MONDAY] array of sessions for MONDAY
   * @property {Array<MetatraderSession>} [TUESDAY] array of sessions for TUESDAY
   * @property {Array<MetatraderSession>} [WEDNESDAY] array of sessions for WEDNESDAY
   * @property {Array<MetatraderSession>} [THURSDAY] array of sessions for THURSDAY
   * @property {Array<MetatraderSession>} [FRIDAY] array of sessions for FRIDAY
   * @property {Array<MetatraderSession>} [SATURDAY] array of sessions for SATURDAY
   */

  /**
   * Metatrader trade or quote session
   * @typedef {Object} MetatraderSession
   * @property {String} from session start time, in hh.mm.ss.SSS format
   * @property {String} to session end time, in hh.mm.ss.SSS format
   */

  /**
   * MetaTrader symbol price. Contains current price for a symbol (see
   * https://metaapi.cloud/docs/client/models/metatraderSymbolPrice/)
   * @typedef {Object} MetatraderSymbolPrice
   * @property {String} symbol symbol (e.g. a currency pair or an index)
   * @property {Number} bid bid price
   * @property {Number} ask ask price
   * @property {Number} profitTickValue tick value for a profitable position
   * @property {Number} lossTickValue tick value for a losing position
   * @property {Number} [accountCurrencyExchangeRate] current exchange rate of account currency into USD
   * @property {Date} time quote time, in ISO format
   * @property {String} brokerTime time quote time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */

  /**
   * MetaTrader candle
   * @typedef {Object} MetatraderCandle
   * @property {string} symbol symbol (e.g. currency pair or an index)
   * @property {string} timeframe timeframe candle was generated for, e.g. 1h. One of 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m,
   * 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn
   * @property {Date} time candle opening time
   * @property {string} brokerTime candle opening time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {number} open open price
   * @property {number} high high price
   * @property {number} low low price
   * @property {number} close close price
   * @property {number} tickVolume tick volume, i.e. number of ticks inside the candle
   * @property {number} spread spread in points
   * @property {number} volume trade volume
   */

  /**
   * MetaTrader tick data
   * @typedef {Object} MetatraderTick
   * @property {string} symbol symbol (e.g. a currency pair or an index)
   * @property {Date} time time
   * @property {string} brokerTime time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {number} [bid] bid price
   * @property {number} [ask] ask price
   * @property {number} [last] last deal price
   * @property {number} [volume] volume for the current last deal price
   * @property {string} side is tick a result of buy or sell deal, one of buy or sell
   */

  /**
   * MetaTrader order book
   * @typedef {Object} MetatraderBook
   * @property {string} symbol symbol (e.g. a currency pair or an index)
   * @property {Date} time time
   * @property {string} brokerTime time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {Array<MetatraderBookEntry>} book list of order book entries
   */

  /**
   * MetaTrader order book entry
   * @typedef {Object} MetatraderBookEntry
   * @property {string} type entry type, one of BOOK_TYPE_SELL, BOOK_TYPE_BUY, BOOK_TYPE_SELL_MARKET,
   * BOOK_TYPE_BUY_MARKET
   * @property {number} price price
   * @property {number} volume volume
   */

  // eslint-disable-next-line complexity,max-statements
  async _processSynchronizationPacket(packet) {
    try {
      if(this._packetLogger) {
        await this._packetLogger.logPacket(packet);
      }
      let packets = this._packetOrderer.restoreOrder(packet);
      for (let data of packets) {
        if (data.synchronizationId) {
          this._synchronizationThrottler.updateSynchronizationId(data.synchronizationId);
        }
        let instanceId = data.accountId + ':' + (data.instanceIndex || 0);
        let instanceIndex = data.instanceIndex || 0;

        const cancelDisconnectTimer = () => {
          if (this._statusTimers[instanceId]) {
            clearTimeout(this._statusTimers[instanceId]);
          }
        };

        const resetDisconnectTimer = () => {
          cancelDisconnectTimer();
          this._statusTimers[instanceId] = setTimeout(async () => {
            await onDisconnected();
            this._subscriptionManager.onTimeout(data.accountId, instanceIndex);
          }, 60000);
        };

        const onDisconnected = async () => { 
          if (this._connectedHosts[instanceId] === data.host) {
            const onDisconnectedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onDisconnectedPromises.push(
                Promise.resolve(listener.onDisconnected(instanceIndex))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about disconnected event`,
                    err))
              );
            }
            await Promise.all(onDisconnectedPromises);
            delete this._connectedHosts[instanceId];
          }
        };
        if (data.type === 'authenticated') {
          resetDisconnectTimer();
          if((!data.sessionId) || (data.sessionId === this._sessionId)) {
            this._connectedHosts[instanceId] = data.host;
            const onConnectedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onConnectedPromises.push(
                Promise.resolve(listener.onConnected(instanceIndex, data.replicas))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about connected event`,
                    err))
              );
            }
            this._subscriptionManager.cancelSubscribe(instanceId);
            await Promise.all(onConnectedPromises);
          }
        } else if (data.type === 'disconnected') {
          cancelDisconnectTimer();
          await Promise.all([
            onDisconnected(),
            this._subscriptionManager.onDisconnected(data.accountId, instanceIndex)
          ]);
        } else if (data.type === 'synchronizationStarted') {
          const promises = [];
          for (let listener of this._synchronizationListeners[data.accountId] || []) {
            promises.push(
              Promise.resolve(listener.onSynchronizationStarted(instanceIndex))
              // eslint-disable-next-line no-console
                .catch(err => console.error(`${data.accountId}: Failed to notify listener about synchronization ` +
                  'started event', err))
            );
          }
          await Promise.all(promises);
        } else if (data.type === 'accountInformation') {
          if (data.accountInformation) {
            const onAccountInformationUpdatedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onAccountInformationUpdatedPromises.push(
                Promise.resolve(listener.onAccountInformationUpdated(instanceIndex, data.accountInformation))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about accountInformation ` +
                    'event', err))
              );
            }
            await Promise.all(onAccountInformationUpdatedPromises);
          }
        } else if (data.type === 'deals') {
          for (let deal of (data.deals || [])) {
            const onDealAddedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onDealAddedPromises.push(
                Promise.resolve(listener.onDealAdded(instanceIndex, deal))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about deals event`, err))
              );
            }
            await Promise.all(onDealAddedPromises);
          }
        } else if (data.type === 'orders') {
          const onOrderUpdatedPromises = [];
          for (let listener of this._synchronizationListeners[data.accountId] || []) {
            onOrderUpdatedPromises.push(
              Promise.resolve(listener.onOrdersReplaced(instanceIndex, data.orders || []))
              // eslint-disable-next-line no-console
                .catch(err => console.error(`${data.accountId}: Failed to notify listener about orders event`, err))
            );
          }
          await Promise.all(onOrderUpdatedPromises);
        } else if (data.type === 'historyOrders') {
          for (let historyOrder of (data.historyOrders || [])) {
            const onHistoryOrderAddedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onHistoryOrderAddedPromises.push(
                Promise.resolve(listener.onHistoryOrderAdded(instanceIndex, historyOrder))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about historyOrders event`,
                    err))
              );
            }
            await Promise.all(onHistoryOrderAddedPromises);
          }
        } else if (data.type === 'positions') {
          const onPositionUpdatedPromises = [];
          for (let listener of this._synchronizationListeners[data.accountId] || []) {
            onPositionUpdatedPromises.push(
              Promise.resolve(listener.onPositionsReplaced(instanceIndex, data.positions || []))
              // eslint-disable-next-line no-console
                .catch(err => console.error(`${data.accountId}: Failed to notify listener about positions event`,
                  err))
            );
          }
          await Promise.all(onPositionUpdatedPromises);
        } else if (data.type === 'update') {
          if (data.accountInformation) {
            const onAccountInformationUpdatedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onAccountInformationUpdatedPromises.push(
                Promise.resolve(listener.onAccountInformationUpdated(instanceIndex, data.accountInformation))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about update event`, err))
              );
            }
            await Promise.all(onAccountInformationUpdatedPromises);
          }
          for (let position of (data.updatedPositions || [])) {
            const onPositionUpdatedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onPositionUpdatedPromises.push(
                Promise.resolve(listener.onPositionUpdated(instanceIndex, position))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about update event`, err))
              );
            }
            await Promise.all(onPositionUpdatedPromises);
          }
          for (let positionId of (data.removedPositionIds || [])) {
            const onPositionRemovedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onPositionRemovedPromises.push(
                Promise.resolve(listener.onPositionRemoved(instanceIndex, positionId))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about update event`, err))
              );
            }
            await Promise.all(onPositionRemovedPromises);
          }
          for (let order of (data.updatedOrders || [])) {
            const onOrderUpdatedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onOrderUpdatedPromises.push(
                Promise.resolve(listener.onOrderUpdated(instanceIndex, order))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about update event`, err))
              );
            }
            await Promise.all(onOrderUpdatedPromises);
          }
          for (let orderId of (data.completedOrderIds || [])) {
            const onOrderCompletedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onOrderCompletedPromises.push(
                Promise.resolve(listener.onOrderCompleted(instanceIndex, orderId))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about update event`, err))
              );
            }
            await Promise.all(onOrderCompletedPromises);
          }
          for (let historyOrder of (data.historyOrders || [])) {
            const onHistoryOrderAddedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onHistoryOrderAddedPromises.push(
                Promise.resolve(listener.onHistoryOrderAdded(instanceIndex, historyOrder))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about update event`, err))
              );
            }
            await Promise.all(onHistoryOrderAddedPromises);
          }
          for (let deal of (data.deals || [])) {
            const onDealAddedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onDealAddedPromises.push(
                Promise.resolve(listener.onDealAdded(instanceIndex, deal))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about update event`, err))
              );
            }
            await Promise.all(onDealAddedPromises);
          }
          if (data.timestamps) {
            data.timestamps.clientProcessingFinished = new Date();
            const onUpdatePromises = [];
            // eslint-disable-next-line max-depth
            for (let listener of this._latencyListeners || []) {
              onUpdatePromises.push(
                Promise.resolve(listener.onUpdate(data.accountId, data.timestamps))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify latency listener about ` +
                    'update event', err))
              );
            }
            await Promise.all(onUpdatePromises);
          }
        } else if (data.type === 'dealSynchronizationFinished') {
          const onDealSynchronizationFinishedPromises = [];
          for (let listener of this._synchronizationListeners[data.accountId] || []) {
            this._synchronizationThrottler.removeSynchronizationId(data.synchronizationId);
            onDealSynchronizationFinishedPromises.push(
              Promise.resolve(listener.onDealSynchronizationFinished(instanceIndex, data.synchronizationId))
              // eslint-disable-next-line no-console
                .catch(err => console.error(`${data.accountId}: Failed to notify listener about ` +
                  'dealSynchronizationFinished event', err))
            );
          }
          await Promise.all(onDealSynchronizationFinishedPromises);
        } else if (data.type === 'orderSynchronizationFinished') {
          const onOrderSynchronizationFinishedPromises = [];
          for (let listener of this._synchronizationListeners[data.accountId] || []) {
            onOrderSynchronizationFinishedPromises.push(
              Promise.resolve(listener.onOrderSynchronizationFinished(instanceIndex, data.synchronizationId))
              // eslint-disable-next-line no-console
                .catch(err => console.error(`${data.accountId}: Failed to notify listener about ` +
                  'orderSynchronizationFinished event', err))
            );
          }
          await Promise.all(onOrderSynchronizationFinishedPromises);
        } else if (data.type === 'status') {
          if (!this._connectedHosts[instanceId]) {
            if(this._statusTimers[instanceId] && data.authenticated) {
              this._subscriptionManager.cancelSubscribe(instanceId);
              await new Promise(res => setTimeout(res, 10));
              // eslint-disable-next-line no-console
              console.log('[' + (new Date()).toISOString() + '] it seems like we are not connected to a running API ' +
                        'server yet, retrying subscription for account ' + instanceId);
              this.ensureSubscribe(data.accountId, instanceIndex);
            }
          } else if (this._connectedHosts[instanceId] === data.host) {
            resetDisconnectTimer();
            const onBrokerConnectionStatusChangedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onBrokerConnectionStatusChangedPromises.push(
                Promise.resolve(listener.onBrokerConnectionStatusChanged(instanceIndex, !!data.connected))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about ` +
                    'brokerConnectionStatusChanged event', err))
              );
            }
            await Promise.all(onBrokerConnectionStatusChangedPromises);
            if (data.healthStatus) {
              const onHealthStatusPromises = [];
              // eslint-disable-next-line max-depth
              for (let listener of this._synchronizationListeners[data.accountId] || []) {
                onHealthStatusPromises.push(
                  Promise.resolve(listener.onHealthStatus(instanceIndex, data.healthStatus))
                  // eslint-disable-next-line no-console
                    .catch(err => console.error(`${data.accountId}: Failed to notify listener about ` +
                      'server-side healthStatus event', err))
                );
              }
              await Promise.all(onHealthStatusPromises);
            }
          }
        } else if (data.type === 'downgradeSubscription') {
          // eslint-disable-next-line no-console
          console.log(`${data.accountId}: Market data subscriptions for symbol ${data.symbol} were downgraded by ` +
            `the server due to rate limits. Updated subscriptions: ${JSON.stringify(data.updates)}, ` +
            `removed subscriptions: ${JSON.stringify(data.unsubscriptions)}. Please read ` +
            'https://metaapi.cloud/docs/client/rateLimiting/ for more details.');
          const onSubscriptionDowngradePromises = [];
          for (let listener of this._synchronizationListeners[data.accountId] || []) {
            onSubscriptionDowngradePromises.push(
              Promise.resolve(listener.onSubscriptionDowngraded(instanceIndex, data.symbol, data.updates,
                data.unsubscriptions))
              // eslint-disable-next-line no-console
                .catch(err => console.error(`${data.accountId}: Failed to notify listener about subscription ` +
                  'downgrade event', err))
            );
          }
          await Promise.all(onSubscriptionDowngradePromises);
        } else if (data.type === 'specifications') {
          for (let specification of (data.specifications || [])) {
            const onSymbolSpecificationUpdatedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onSymbolSpecificationUpdatedPromises.push(
                Promise.resolve(listener.onSymbolSpecificationUpdated(instanceIndex, specification))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about specifications event`,
                    err))
              );
            }
            await Promise.all(onSymbolSpecificationUpdatedPromises);
          }
          if (data.removedSymbols) {
            const onSymbolSpecificationRemovedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onSymbolSpecificationRemovedPromises.push(
                Promise.resolve(listener.onSymbolSpecificationsRemoved(instanceIndex, data.removedSymbols))
                  // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about specifications ` +
                    'removed event', err))
              );
            }
            await Promise.all(onSymbolSpecificationRemovedPromises);
          }
        } else if (data.type === 'prices') {
          let prices = data.prices || [];
          let candles = data.candles || [];
          let ticks = data.ticks || [];
          let books = data.books || [];
          const onSymbolPricesUpdatedPromises = [];
          for (let listener of this._synchronizationListeners[data.accountId] || []) {
            if (prices.length) {
              onSymbolPricesUpdatedPromises.push(
                Promise.resolve(listener.onSymbolPricesUpdated(instanceIndex, prices, data.equity, data.margin,
                  data.freeMargin, data.marginLevel, data.accountCurrencyExchangeRate))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about prices event`, err))
              );
            }
            if (candles.length) {
              onSymbolPricesUpdatedPromises.push(
                Promise.resolve(listener.onCandlesUpdated(instanceIndex, candles, data.equity, data.margin,
                  data.freeMargin, data.marginLevel, data.accountCurrencyExchangeRate))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about candles event`, err))
              );
            }
            if (ticks.length) {
              onSymbolPricesUpdatedPromises.push(
                Promise.resolve(listener.onTicksUpdated(instanceIndex, ticks, data.equity, data.margin,
                  data.freeMargin, data.marginLevel, data.accountCurrencyExchangeRate))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about ticks event`, err))
              );
            }
            if (books.length) {
              onSymbolPricesUpdatedPromises.push(
                Promise.resolve(listener.onBooksUpdated(instanceIndex, books, data.equity, data.margin,
                  data.freeMargin, data.marginLevel, data.accountCurrencyExchangeRate))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about books event`, err))
              );
            }
          }
          await Promise.all(onSymbolPricesUpdatedPromises);
          for (let price of prices) {
            const onSymbolPriceUpdatedPromises = [];
            for (let listener of this._synchronizationListeners[data.accountId] || []) {
              onSymbolPriceUpdatedPromises.push(
                Promise.resolve(listener.onSymbolPriceUpdated(instanceIndex, price))
                // eslint-disable-next-line no-console
                  .catch(err => console.error(`${data.accountId}: Failed to notify listener about price event`, err))
              );
            }
            await Promise.all(onSymbolPriceUpdatedPromises);
          }
          for (let price of prices) {
            if (price.timestamps) {
              price.timestamps.clientProcessingFinished = new Date();
              const onSymbolPricePromises = [];
              // eslint-disable-next-line max-depth
              for (let listener of this._latencyListeners || []) {
                onSymbolPricePromises.push(
                  Promise.resolve(listener.onSymbolPrice(data.accountId, price.symbol, price.timestamps))
                  // eslint-disable-next-line no-console
                    .catch(err => console.error(`${data.accountId}: Failed to notify latency listener about ` +
                      'price event', err))
                );
              }
              await Promise.all(onSymbolPricePromises);
            }
          }
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to process incoming synchronization packet', err);
    }
  }

  async _fireReconnected() {
    this._subscriptionManager.onReconnected();
    for (let listener of this._reconnectListeners) {
      try {
        await listener.onReconnected();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[' + (new Date()).toISOString() + '] Failed to notify reconnect listener', err);
      }
    }
  }

}
