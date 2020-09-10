'use strict';

import request from 'request-promise-any';
import HttpClient from './httpClient';

/**
 * HTTP client library based on request-promise. It differs from the HttpClient in that upon request it returns
 * not only the request body, but also cookies
 */
export default class HttpClientWithCookies extends HttpClient {

  /**
   * Performs a request. Response errors are returned as ApiError or subclasses.
   * @param {Object} options request options
   * @returns {Promise} promise returning request body and cookies
   */
  async request(options) {
    const j = request.jar();
    options.jar = j;
    const body = await super.request(options);
    let cookies = j.getCookies(options.url);
    return {
      body, cookies
    };
  }

}
