'use strict';

/**
 * Defines interface for a terminal listener class. You can extend your trading application implementation from
 * this class.
 *
 * Unlike low-level SynchronizationListener, when you use TerminalListener, the SDK will remove race conditions and most
 * events duplicates present on the transport layer. There is also a warranty that TeminalListener listener methods
 * will be invoked in sequence. No new event will be delivered until previous event have finished processing.
 *
 * So that it is much easier to create trading applicaitions using TerminalListener, especially if the application is a
 * complex one.
 */
export default class TerminalListener {

  /**
   * Returns MetaApiConnection instance
   * @return {MetaApiConnection} MetaApiConnection instance
   */
  get connection() {
    return this._connection;
  }

  /**
   * Sets MetaApiConnection instance
   * @param {MetaApiConnection} connection MetaApiConnection instance
   */
  set connection(connection) {
    this._connection = connection;
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onConnected() {}

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDisconnected() {}

  /**
   * Invoked when broker connection satus have changed
   * @param {Boolean} connected is MetaTrader terminal is connected to broker
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onBrokerConnectionStatusChanged(connected) {}

  /**
   * Invoked when MetaTrader terminal state synchronization is started
   * @param {Boolean} specificationsUpdated whether specifications are going to be updated during synchronization
   * @param {Boolean} positionsUpdated whether positions are going to be updated during synchronization
   * @param {Boolean} ordersUpdated whether orders are going to be updated during synchronization
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSynchronizationStarted(specificationsUpdated, positionsUpdated, ordersUpdated) {}

  /**
   * Invoked when MetaTrader account information is updated
   * @param {MetatraderAccountInformation} accountInformation updated MetaTrader account information
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onAccountInformationUpdated(accountInformation) {}

  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization. This method
   * will be invoked only if server thinks the data was updated, otherwise invocation can be skipped
   * @param {Array<MetatraderPosition>} positions updated array of positions
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionsReplaced(positions) {}

  /**
   * Invoked when position synchronization fnished to indicate progress of an initial terminal state synchronization
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionsSynchronized() {}

  /**
   * Invoked when MetaTrader position is updated
   * @param {MetatraderPosition} position updated MetaTrader position
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionUpdated(position) {}

  /**
   * Invoked when MetaTrader position is removed
   * @param {String} positionId removed MetaTrader position id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionRemoved(positionId) {}

  /**
   * Invoked when the pending orders are replaced as a result of initial terminal state synchronization. This method
   * will be invoked only if server thinks the data was updated, otherwise invocation can be skipped
   * @param {Array<MetatraderOrder>} orders updated array of pending orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPendingOrdersReplaced(orders) {}

  /**
   * Invoked when MetaTrader pending order is updated
   * @param {MetatraderOrder} order updated MetaTrader pending order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPendingOrderUpdated(order) {}

  /**
   * Invoked when MetaTrader pending order is completed (executed or canceled)
   * @param {String} orderId completed MetaTrader pending order id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPendingOrderCompleted(orderId) {}

  /**
   * Invoked when pending order synchronization fnished to indicate progress of an initial terminal state
   * synchronization
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPendingOrdersSynchronized() {}

  /**
   * Invoked when a new MetaTrader history order is added
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHistoryOrderAdded(historyOrder) {}

  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHistoryOrdersSynchronized() {}

  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {MetatraderDeal} deal new MetaTrader history deal
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealAdded(deal) {}

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealsSynchronized() {}

  /**
   * Invoked when a symbol specification was updated
   * @param {MetatraderSymbolSpecification} specification updated MetaTrader symbol specification
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolSpecificationUpdated(specification) {}

  /**
   * Invoked when a symbol specification was removed
   * @param {String} symbol removed symbol
   * @returns {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolSpecificationRemoved(symbol) {}

  /**
   * Invoked when a symbol specifications were updated
   * @param {Array<MetatraderSymbolSpecification>} specifications updated specifications
   * @param {Array<String>} removedSymbols removed symbols
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolSpecificationsUpdated(specifications, removedSymbols) {}

  /**
   * Invoked when a symbol price was updated
   * @param {MetatraderSymbolPrice} price updated MetaTrader symbol price
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolPriceUpdated(price) {}

  /**
   * Invoked when prices for several symbols were updated
   * @param {Array<MetatraderSymbolPrice>} prices updated MetaTrader symbol prices
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolPricesUpdated(prices, equity, margin, freeMargin, marginLevel, accountCurrencyExchangeRate) {}

  /**
   * Invoked when symbol candles were updated
   * @param {Array<MetatraderCandle>} candles updated MetaTrader symbol candles
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onCandlesUpdated(candles, equity, margin, freeMargin, marginLevel, accountCurrencyExchangeRate) {}

  /**
   * Invoked when symbol ticks were updated
   * @param {Array<MetatraderTick>} ticks updated MetaTrader symbol ticks
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onTicksUpdated(ticks, equity, margin, freeMargin, marginLevel, accountCurrencyExchangeRate) {}

  /**
   * Invoked when order books were updated
   * @param {Array<MetatraderBook>} books updated MetaTrader order books
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onBooksUpdated(books, equity, margin, freeMargin, marginLevel, accountCurrencyExchangeRate) {}

  /**
   * Invoked when subscription downgrade has occurred
   * @param {string} symbol symbol to update subscriptions for
   * @param {Array<MarketDataSubscription>} updates array of market data subscription to update
   * @param {Array<MarketDataUnsubscription>} unsubscriptions array of subscriptions to cancel
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSubscriptionDowngraded(symbol, updates, unsubscriptions) {}

}
