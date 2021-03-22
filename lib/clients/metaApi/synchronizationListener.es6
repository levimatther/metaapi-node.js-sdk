'use strict';

/**
 * Defines interface for a synchronization listener class
 */
export default class SynchronizationListener {

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Number} replicas number of account replicas launched
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onConnected(instanceIndex, replicas) {}

  /**
   * Server-side application health status
   * @typedef {Object} healthStatus
   * @property {boolean} [restApiHealthy] flag indicating that REST API is healthy
   * @property {boolean} [copyFactorySubscriberHealthy] flag indicating that CopyFactory subscriber is healthy
   * @property {boolean} [copyFactoryProviderHealthy] flag indicating that CopyFactory provider is healthy
   */

  /**
   * Invoked when a server-side application health status is received from MetaApi
   * @param {Number} instanceIndex index of an account instance connected
   * @param {HealthStatus} status server-side application health status
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHealthStatus(instanceIndex, status) {}

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {Number} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDisconnected(instanceIndex) {}

  /**
   * Invoked when broker connection satus have changed
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Boolean} connected is MetaTrader terminal is connected to broker
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onBrokerConnectionStatusChanged(instanceIndex, connected) {}

  /**
   * Invoked when MetaTrader terminal state synchronization is started
   * @param {Number} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSynchronizationStarted(instanceIndex) {}

  /**
   * Invoked when MetaTrader account information is updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderAccountInformation} accountInformation updated MetaTrader account information
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onAccountInformationUpdated(instanceIndex, accountInformation) {}

  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Array<MetatraderPosition>} positions updated array of positions
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionsReplaced(instanceIndex, positions) {}

  /**
   * Invoked when MetaTrader position is updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderPosition} position updated MetaTrader position
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionUpdated(instanceIndex, position) {}

  /**
   * Invoked when MetaTrader position is removed
   * @param {Number} instanceIndex index of an account instance connected
   * @param {String} positionId removed MetaTrader position id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionRemoved(instanceIndex, positionId) {}

  /**
   * Invoked when the orders are replaced as a result of initial terminal state synchronization
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Array<MetatraderOrder>} orders updated array of orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onOrdersReplaced(instanceIndex, orders) {}

  /**
   * Invoked when MetaTrader order is updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} order updated MetaTrader order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onOrderUpdated(instanceIndex, order) {}

  /**
   * Invoked when MetaTrader order is completed (executed or canceled)
   * @param {Number} instanceIndex index of an account instance connected
   * @param {String} orderId completed MetaTrader order id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onOrderCompleted(instanceIndex, orderId) {}

  /**
   * Invoked when a new MetaTrader history order is added
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHistoryOrderAdded(instanceIndex, historyOrder) {}

  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderDeal} deal new MetaTrader history deal
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealAdded(instanceIndex, deal) {}

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished
   * @param {Number} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealSynchronizationFinished(instanceIndex, synchronizationId) {}

  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished
   * @param {Number} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onOrderSynchronizationFinished(instanceIndex, synchronizationId) {}

  /**
   * Invoked when a symbol specification was updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderSymbolSpecification} specification updated MetaTrader symbol specification
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolSpecificationUpdated(instanceIndex, specification) {}

  /**
   * Invoked when a symbol specifications was removed
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Array<String>} symbols removed symbols
   * @returns {Promise<void>} promise which resolves when the asynchronous event is processed
   */
  async onSymbolSpecificationsRemoved(instanceIndex, symbols) {}

  /**
   * Invoked when a symbol price was updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {MetatraderSymbolPrice} price updated MetaTrader symbol price
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolPriceUpdated(instanceIndex, price) {}

  /**
   * Invoked when prices for several symbols were updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Array<MetatraderSymbolPrice>} prices updated MetaTrader symbol prices
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolPricesUpdated(instanceIndex, prices, equity, margin, freeMargin, marginLevel,
    accountCurrencyExchangeRate) {}

  /**
   * Invoked when symbol candles were updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Array<MetatraderCandle>} candles updated MetaTrader symbol candles
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onCandlesUpdated(instanceIndex, candles, equity, margin, freeMargin, marginLevel,
    accountCurrencyExchangeRate) {}

  /**
   * Invoked when symbol ticks were updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Array<MetatraderTick>} ticks updated MetaTrader symbol ticks
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onTicksUpdated(instanceIndex, ticks, equity, margin, freeMargin, marginLevel,
    accountCurrencyExchangeRate) {}

  /**
   * Invoked when order books were updated
   * @param {Number} instanceIndex index of an account instance connected
   * @param {Array<MetatraderBook>} books updated MetaTrader order books
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onBooksUpdated(instanceIndex, books, equity, margin, freeMargin, marginLevel,
    accountCurrencyExchangeRate) {}

  /**
   * Invoked when subscription downgrade has occurred
   * @param {number} instanceIndex index of an account instance connected
   * @param {string} symbol symbol to update subscriptions for
   * @param {Array<MarketDataSubscription>} updates array of market data subscription to update
   * @param {Array<MarketDataUnsubscription>} unsubscriptions array of subscriptions to cancel
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSubscriptionDowngraded(instanceIndex, symbol, updates, unsubscriptions) {}

}
