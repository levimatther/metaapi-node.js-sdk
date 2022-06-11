'use strict';

import MetaApiClient from '../metaApi.client';

/**
 * metaapi.cloud client API client (see https://metaapi.cloud/docs/client/)
 */
export default class ClientApiClient extends MetaApiClient {

  /**
   * Constructs client API client instance
   * @param {HttpClient} httpClient HTTP client
   * @param {String} token authorization token
   * @param {String} domain domain to connect to, default is agiliumtrade.agiliumtrade.ai
   */
  constructor(httpClient, token, domain = 'agiliumtrade.agiliumtrade.ai') {
    super(httpClient, token, domain);
    this._host = `https://mt-client-api-v1.${domain}`;
  }

  /**
   * Type hashing ignored field lists
   * @typedef {Object} TypeHashingIgnoredFieldLists
   * @property {String[]} specification specification ignored fields
   * @property {String[]} position position ignored fields
   * @property {String[]} order order ignored fields
   */

  /**
   * Hashing ignored field lists
   * @typedef {Object} HashingIgnoredFieldLists
   * @property {TypeHashingIgnoredFieldLists} g1 g1 hashing ignored field lists
   * @property {TypeHashingIgnoredFieldLists} g2 g2 hashing ignored field lists
   */

  /**
   * Retrieves hashing ignored field lists
   * @returns {Promise<HashingIgnoredFieldLists>} promise resolving with hashing ignored field lists
   */
  getHashingIgnoredFieldLists() {
    const opts = {
      url: `${this._host}/hashing-ignored-field-lists`,
      method: 'GET',
      json: true,
      headers: {
        'auth-token': this._token
      }
    };
    return this._httpClient.request(opts);
  }
}
