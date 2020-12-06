'use strict';

/**
 * Receives notifications about server-side communication latencies
 */
export default class LatencyListener {

  /**
   * Object containing request latency information
   * @typedef {Object} ResponseTimestamps
   * @param {Date} clientProcessingStarted time when request processing have started on client side
   * @param {Date} serverProcessingStarted time when request processing have started on server side
   * @param {Date} serverProcessingFinished time when request processing have finished on server side
   * @param {Date} clientProcessingFinished time when request processing have finished on client side
   */

  /**
   * Invoked with latency information when application receives a response to RPC request
   * @param {string} accountId account id
   * @param {string} type request type
   * @param {ResponseTimestamps} timestamps request timestamps object containing latency information
   * @return {Promise} promise which resolves when latency information is processed
   */
  async onResponse(accountId, type, timestamps) {}

  /**
   * Timestamps object containing latency information about price streaming
   * @typedef {Object} SymbolPriceTimestamps
   * @property {Date} eventGenerated time the event was generated on exchange side
   * @property {Date} serverProcessingStarted time the event processing have started on server side
   * @property {Date} serverProcessingFinished time the event processing have finished on server side
   * @property {Date} clientProcessingFinished time the event processing have finished on client side
   */

  /**
   * Invoked with latency information when application receives symbol price update event
   * @param {string} accountId account id
   * @param {SymbolPriceTimestamps} timestamps timestamps object containing latency information about price streaming
   * @return {Promise} promise which resolves when latency information is processed
   */
  async onSymbolPrice(accountId, symbol, timestamps) {}

}
