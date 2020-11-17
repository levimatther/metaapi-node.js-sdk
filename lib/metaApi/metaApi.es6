'use strict';

import HttpClient from '../clients/httpClient';
import ProvisioningProfileClient from '../clients/metaApi/provisioningProfile.client';
import ProvisioningProfileApi from './provisioningProfileApi';
import MetaApiWebsocketClient from '../clients/metaApi/metaApiWebsocket.client';
import MetatraderAccountApi from './metatraderAccountApi';
import MetatraderAccountClient from '../clients/metaApi/metatraderAccount.client';
import MetatraderDemoAccountApi from './metatraderDemoAccountApi';
import MetatraderDemoAccountClient from '../clients/metaApi/metatraderDemoAccount.client';
import ConnectionRegistry from './connectionRegistry';
import {ValidationError} from '../clients/errorHandler';

/**
 * MetaApi MetaTrader API SDK
 */
export default class MetaApi {

  /**
   * Constructs MetaApi class instance
   * @param {String} token authorization token
   * @param {Object} opts application options
   */
  // eslint-disable-next-line complexity
  constructor(token, opts) {
    opts = opts || {};
    const application = opts.application || 'MetaApi';
    const domain = opts.domain || 'agiliumtrade.agiliumtrade.ai';
    const requestTimeout = opts.requestTimeout || 60;
    const connectTimeout = opts.connectTimeout || 60;
    const packetOrderingTimeout = opts.packetOrderingTimeout || 60;
    const packetLogger = opts.packetLogger || {};
    if (!application.match(/[a-zA-Z0-9_]+/)) {
      throw new ValidationError('Application name must be non-empty string consisting from letters, digits and _ only');
    }
    let httpClient = new HttpClient(requestTimeout);
    this._metaApiWebsocketClient = new MetaApiWebsocketClient(token, {application, domain, requestTimeout,
      connectTimeout, packetLogger, packetOrderingTimeout});
    this._provisioningProfileApi = new ProvisioningProfileApi(new ProvisioningProfileClient(httpClient, token, domain));
    this._connectionRegistry = new ConnectionRegistry(this._metaApiWebsocketClient, application);
    this._metatraderAccountApi = new MetatraderAccountApi(new MetatraderAccountClient(httpClient, token, domain),
      this._metaApiWebsocketClient, this._connectionRegistry);
    this._metatraderDemoAccountApi = new MetatraderDemoAccountApi(
      new MetatraderDemoAccountClient(httpClient, token, domain));
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
   * Returns MetaTrader demo account API
   * @return {MetatraderDemoAccountApi} MetaTrader demo account API
   */
  get metatraderDemoAccountApi() {
    return this._metatraderDemoAccountApi;
  }

  /**
   * Closes all clients and connections
   */
  close() {
    this._metaApiWebsocketClient.close();
  }

}
