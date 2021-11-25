import MetatraderAccountApi from "./metatraderAccountApi"
import ProvisioningProfileApi from "./provisioningProfileApi"
import MetatraderDemoAccountApi from "./metatraderDemoAccountApi"
import LatencyMonitor from "./latencyMonitor"
import { SynchronizationThrottlerOpts } from "../clients/metaApi/synchronizationThrottler"
import { PacketLoggerOpts } from "../clients/metaApi/packetLogger"

/**
 * MetaApi MetaTrader API SDK
 */
export default class MetaApi {

  /**
   * Enables using Log4js logger with extended log levels for debugging instead of
   * console.* functions. Note that log4js configuration performed by the user.
   */
  static enableLog4jsLogging(): void;

  /**
   * Constructs MetaApi class instance
   * @param {String} token authorization token
   * @param {MetaApiOpts} opts application options
   */
  constructor(token: String, opts?: MetaApiOpts);

  /**
   * Returns provisioning profile API
   * @returns {ProvisioningProfileApi} provisioning profile API
   */
  get provisioningProfileApi(): ProvisioningProfileApi;

  /**
   * Returns MetaTrader account API
   * @return {MetatraderAccountApi} MetaTrader account API
   */
  get metatraderAccountApi(): MetatraderAccountApi;

  /**
   * Returns MetaTrader demo account API
   * @return {MetatraderDemoAccountApi} MetaTrader demo account API
   */
  get metatraderDemoAccountApi(): MetatraderDemoAccountApi;

  /**
   * Returns MetaApi application latency monitor
   * @return {LatencyMonitor} latency monitor
   */
  get latencyMonitor(): LatencyMonitor;

  /**
   * Closes all clients and connections
   */
  close(): void;
}

/**
 * MetaApi options
 */
declare type MetaApiOpts = {

  /**
   * application id
   */
  application?: String,

  /**
   * domain to connect to, default is agiliumtrade.agiliumtrade.ai
   */
  domain?: String,

  /**
   * region to connect to
   */
  region?: String,

  /**
   * timeout for socket requests in seconds
   */
  requestTimeout?: Number,

  /**
   * timeout for connecting to server in seconds
   */
  connectTimeout?: Number,

  /**
   * packet ordering timeout in seconds
   */
  packetOrderingTimeout?: Number,

  /**
   * packet logger options
   */
  packetLogger?: PacketLoggerOpts,

  /**
   * an option to enable latency tracking
   */
  enableLatencyMonitor?: Boolean,

  /**
   * an option to enable latency tracking
   */
  enableLatencyTracking?: Boolean,

  /**
   * options for synchronization throttler
   */
  synchronizationThrottler?: SynchronizationThrottlerOpts,

  /**
   * options for request retries
   */
  retryOpts?: RetryOpts,

  /**
   * option to use a shared server
   */
  useSharedClientApi?: Boolean,

  /**
   * subscriptions refresh options
   */
  refreshSubscriptionsOpts?: RefreshSubscriptionsOpts,

  /**
   * a timeout in seconds for throttling repeat unsubscribe
   * requests when synchronization packets still arrive after unsubscription, default is 10 seconds
   */
  unsubscribeThrottlingIntervalInSeconds?: Number
}

/**
 * Subscriptions refresh options
 */
declare type RefreshSubscriptionsOpts = {

  /**
   * minimum delay in seconds until subscriptions refresh request,
   * default value is 1
   */
  minDelayInSeconds?: Number,

  /**
   * maximum delay in seconds until subscriptions refresh request,
   * default value is 600
   */
  maxDelayInSeconds?: Number
}

/**
 * Request retry options
 */
declare type RetryOpts = {

  /**
   * maximum amount of request retries, default value is 5
   */
  retries?: Number,

  /**
   * minimum delay in seconds until request retry, default value is 1
   */
  minDelayInSeconds?: Number,

  /**
   * maximum delay in seconds until request retry, default value is 30
   */
  maxDelayInSeconds?: Number
}