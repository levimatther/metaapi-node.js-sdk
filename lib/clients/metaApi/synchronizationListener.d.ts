import { MarketDataSubscription, MarketDataUnsubscription, MetatraderAccountInformation, MetatraderBook, MetatraderTick, MetatraderCandle, MetatraderSymbolPrice, MetatraderSymbolSpecification, MetatraderDeal, MetatraderOrder, MetatraderPosition } from "./metaApiWebsocket.client"

/**
 * Defines interface for a synchronization listener class
 */
export default class SynchronizationListener {
  
  /**
   * Returns instance number of instance index
   * @param {String} instanceIndex instance index
   */
  getInstanceNumber(instanceIndex: String);
  
  /**
   * Returns host name of instance index
   * @param {String} instanceIndex instance index
   */
  getHostName(instanceIndex: String);
  
  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {String} instanceIndex index of an account instance connected
   * @param {Number} replicas number of account replicas launched
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onConnected(instanceIndex: String, replicas: Number): Promise<any>;
  
  /**
   * Invoked when a server-side application health status is received from MetaApi
   * @param {String} instanceIndex index of an account instance connected
   * @param {HealthStatus} status server-side application health status
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHealthStatus(instanceIndex: String, status: HealthStatus): Promise<any>;
  
  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDisconnected(instanceIndex: String): Promise<any>;
  
  /**
   * Invoked when broker connection satus have changed
   * @param {String} instanceIndex index of an account instance connected
   * @param {Boolean} connected is MetaTrader terminal is connected to broker
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onBrokerConnectionStatusChanged(instanceIndex: String, connected: Boolean): Promise<any>;
  
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
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onAccountInformationUpdated(instanceIndex: String, accountInformation: MetatraderAccountInformation): Promise<any>;
  
  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization. This method
   * will be invoked only if server thinks the data was updated, otherwise invocation can be skipped
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderPosition>} positions updated array of positions
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsReplaced(instanceIndex: String, positions: Array<MetatraderPosition>): Promise<any>;
  
  /**
   * Invoked when position synchronization fnished to indicate progress of an initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsSynchronized(instanceIndex: String, synchronizationId: String): Promise<any>;
  
  /**
   * Invoked when MetaTrader position is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderPosition} position updated MetaTrader position
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionUpdated(instanceIndex: String, position: MetatraderPosition): Promise<any>;
  
  /**
   * Invoked when MetaTrader position is removed
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} positionId removed MetaTrader position id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionRemoved(instanceIndex: String, positionId: String): Promise<any>;
  
  /**
   * Invoked when the pending orders are replaced as a result of initial terminal state synchronization. This method
   * will be invoked only if server thinks the data was updated, otherwise invocation can be skipped
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderOrder>} orders updated array of pending orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrdersReplaced(instanceIndex: String, orders: Array<MetatraderOrder>);
  
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
   * Invoked when pending order synchronization fnished to indicate progress of an initial terminal state
   * synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrdersSynchronized(instanceIndex: String, synchronizationId: String): Promise<any>;
  
  /**
   * Invoked when a new MetaTrader history order is added
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHistoryOrderAdded(instanceIndex: String, historyOrder: MetatraderOrder): Promise<any>;
  
  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHistoryOrdersSynchronized(instanceIndex: String, synchronizationId: String): Promise<any>;
  
  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderDeal} deal new MetaTrader history deal
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDealAdded(instanceIndex: String, deal: MetatraderDeal): Promise<any>;
  
  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDealsSynchronized(instanceIndex: String, synchronizationId: String): Promise<any>;
  
  /**
   * Invoked when a symbol specification was updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderSymbolSpecification} specification updated MetaTrader symbol specification
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSymbolSpecificationUpdated(instanceIndex: String, specification: MetatraderSymbolSpecification): Promise<any>;
  
  /**
   * Invoked when a symbol specification was removed
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} symbol removed symbol
   * @returns {Promise} promise which resolves when the asynchronous event is processed
   */
  onSymbolSpecificationRemoved(instanceIndex: String, symbol: String): Promise<any>;
  
  /**
   * Invoked when a symbol specifications were updated
   * @param {String} instanceIndex index of account instance connected
   * @param {Array<MetatraderSymbolSpecification>} specifications updated specifications
   * @param {Array<String>} removedSymbols removed symbols
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSymbolSpecificationsUpdated(instanceIndex: String, specifications: Array<MetatraderSymbolSpecification>, removedSymbols: Array<String>): Promise<any>;
  
  /**
   * Invoked when a symbol price was updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderSymbolPrice} price updated MetaTrader symbol price
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSymbolPriceUpdated(instanceIndex: String, price: MetatraderSymbolPrice): Promise<any>;
  
  /**
   * Invoked when prices for several symbols were updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderSymbolPrice>} prices updated MetaTrader symbol prices
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSymbolPricesUpdated(instanceIndex: String, prices: Array<MetatraderSymbolPrice>, equity: Number, margin: Number, freeMargin: Number, marginLevel: Number,
    accountCurrencyExchangeRate: Number): Promise<any>;
  
    /**
   * Invoked when symbol candles were updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderCandle>} candles updated MetaTrader symbol candles
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onCandlesUpdated(instanceIndex: String, candles: Array<MetatraderCandle>, equity: Number, margin: Number, freeMargin: Number, marginLevel: Number,
    accountCurrencyExchangeRate: Number): Promise<any>;
  
  /**
   * Invoked when symbol ticks were updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderTick>} ticks updated MetaTrader symbol ticks
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onTicksUpdated(instanceIndex: String, ticks: Array<MetatraderTick>, equity: Number, margin: Number, freeMargin: Number, marginLevel: Number,
    accountCurrencyExchangeRate: Number): Promise<any>;
  
  /**
   * Invoked when order books were updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderBook>} books updated MetaTrader order books
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onBooksUpdated(instanceIndex: String, books: Array<MetatraderBook>, equity: Number, margin: Number, freeMargin: Number, marginLevel: Number,
    accountCurrencyExchangeRate: Number): Promise<any>;
  
  /**
   * Invoked when subscription downgrade has occurred
   * @param {String} instanceIndex index of an account instance connected
   * @param {string} symbol symbol to update subscriptions for
   * @param {Array<MarketDataSubscription>} updates array of market data subscription to update
   * @param {Array<MarketDataUnsubscription>} unsubscriptions array of subscriptions to cancel
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSubscriptionDowngraded(instanceIndex: String, symbol: String, updates: Array<MarketDataSubscription>, unsubscriptions: Array<MarketDataUnsubscription>): Promise<any>;
  
  /**
   * Invoked when a stream for an instance index is closed
   * @param {String} instanceIndex index of an account instance connected
   */
   onStreamClosed(instanceIndex: String);
}

/**
 * Server-side application health status
 */
declare type HealthStatus = {

  /**
   * flag indicating that REST API is healthy
   */
  restApiHealthy?: Boolean,

  /**
   * flag indicating that CopyFactory subscriber is healthy
   */
  copyFactorySubscriberHealthy?: Boolean,

  /**
   * flag indicating that CopyFactory provider is healthy
   */
  copyFactoryProviderHealthy?: Boolean
}