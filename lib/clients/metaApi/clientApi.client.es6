'use strict';

import MetaApiClient from '../metaApi.client';
import LoggerManager from '../../logger';
import { NotFoundError } from '../errorHandler';

/**
 * metaapi.cloud client API client (see https://metaapi.cloud/docs/client/)
 */
export default class ClientApiClient extends MetaApiClient {

  /**
   * Constructs client API client instance
   * @param {HttpClient} httpClient HTTP client
   * @param {DomainClient} domainClient domain client
   */
  constructor(httpClient, domainClient) {
    super(httpClient, domainClient);
    this._host = 'https://mt-client-api-v1';
    this._retryIntervalInSeconds = 1;
    this._updateInterval = 60 * 60 * 1000;
    this._ignoredFieldListsCaches = {};
    this._ignoredFieldListsFreshestCache = null;
    this._logger = LoggerManager.getLogger('ClientApiClient');
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
   * Refreshes hashing ignored field lists
   * @param {String} region account region
   * @returns {Promise} promise resolving when the hashing field lists are updated.
   */
  async refreshIgnoredFieldLists(region) {
    if(this._ignoredFieldListsCaches[region] && this._ignoredFieldListsCaches[region].requestPromise) {
      await this._ignoredFieldListsCaches[region].requestPromise;
    } else if (this._ignoredFieldListsCaches[region] && 
      Date.now() - this._ignoredFieldListsCaches[region].lastUpdated < this._updateInterval) {
      return;
    } else {
      if(!this._ignoredFieldListsCaches[region]) {
        this._ignoredFieldListsCaches[region] = {
          lastUpdated: 0,
          data: null,
          requestPromise: null,
          updateJob: setInterval(() => this._refreshIgnoredFieldListsJob(region), 60000)
        };
      }
      let resolve, reject;
      this._ignoredFieldListsCaches[region].requestPromise = new Promise((res, rej) => {
        resolve = res, reject = rej;
      });
      let isCacheUpdated = false;
      while(!isCacheUpdated) {
        try {
          const host = await this._domainClient.getUrl(this._host, region);
          const opts = {
            url: `${host}/hashing-ignored-field-lists`,
            method: 'GET',
            json: true,
            headers: {
              'auth-token': this._token
            }
          };
          const response = await this._httpClient.request(opts, 'getHashingIgnoredFieldLists');
          this._ignoredFieldListsCaches[region] = { lastUpdated: Date.now(), data: response, requestPromise: null };
          this._ignoredFieldListsFreshestCache = response;
          resolve(response);
          isCacheUpdated = true;
          this._ignoredFieldListsCaches[region].retryIntervalInSeconds = this._retryIntervalInSeconds;
        } catch (err) {
          this._logger.error('Failed to update hashing ignored field list', err);
          this._ignoredFieldListsCaches[region].retryIntervalInSeconds =
            Math.min(this._ignoredFieldListsCaches[region].retryIntervalInSeconds * 2, 300);
          await new Promise(res => setTimeout(res, 
            this._ignoredFieldListsCaches[region].retryIntervalInSeconds * 1000));
        }
      }
    }
  }

  /**
   * Retrieves hashing ignored field lists
   * @param {String} region account region
   * @returns {HashingIgnoredFieldLists} promise resolving with hashing ignored field lists
   */
  getHashingIgnoredFieldLists(region) {
    if(region === 'combined') {
      if (this._ignoredFieldListsFreshestCache) {
        return this._ignoredFieldListsFreshestCache;
      } else{ 
        throw new NotFoundError('Ignored field lists not found');
      }
    }
    if(this._ignoredFieldListsCaches[region] && this._ignoredFieldListsCaches[region].data) {
      return this._ignoredFieldListsCaches[region].data;
    } else {
      throw new NotFoundError(`Ignored field lists for region ${region} not found`);
    }
  }

  async _refreshIgnoredFieldListsJob(region) {
    if(!this._ignoredFieldListsCaches[region].requestPromise && 
      Date.now() - this._ignoredFieldListsCaches[region].lastUpdated > this._updateInterval) {
      await this.refreshIgnoredFieldLists(region);
    }
  }
}
