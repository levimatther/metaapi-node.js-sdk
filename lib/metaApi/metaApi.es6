'use strict';

import HttpClient from '../clients/httpClient';
import ProvisioningProfileClient from '../clients/metaApi/provisioningProfile.client';
import ProvisioningProfileApi from './provisioningProfileApi';
import MetaApiWebsocketClient from '../clients/metaApi/metaApiWebsocket.client';
import MetatraderAccountApi from './metatraderAccountApi';
import MetatraderAccountClient from '../clients/metaApi/metatraderAccount.client';

/**
 * MetaApi MetaTrader API SDK
 */
export default class MetaApi {

  /**
   * Constructs MetaApi class instance
   * @param {String} token authorization token
   * @param {String} domain domain to connect to
   * @param {Number} requestTimeout timeout for http requests in seconds
   * @param {Number} connectTimeout timeout for connecting to server in seconds
   */
  constructor(token, domain = 'agiliumtrade.agiliumtrade.ai', requestTimeout = 60, connectTimeout = 60) {
    let httpClient = new HttpClient(requestTimeout);
    this._metaApiWebsocketClient = new MetaApiWebsocketClient(token, domain, requestTimeout, connectTimeout);
    this._provisioningProfileApi = new ProvisioningProfileApi(new ProvisioningProfileClient(httpClient, token, domain));
    this._metatraderAccountApi = new MetatraderAccountApi(new MetatraderAccountClient(httpClient, token, domain),
      this._metaApiWebsocketClient);
  }

  /**
   * Returns provisioning profile API
   * @returns {ProvisioningProfileApi} provisioning profile API
   */
  get provisioningProfileApi() {
    return this._provisioningProfileApi;
  }

  /**
   * Returns MetaTrader account API
   * @return {MetatraderAccountApi} MetaTrader account API
   */
  get metatraderAccountApi() {
    return this._metatraderAccountApi;
  }

  /**
   * Closes all clients and connections
   */
  close() {
    this._metaApiWebsocketClient.close();
  }

}
