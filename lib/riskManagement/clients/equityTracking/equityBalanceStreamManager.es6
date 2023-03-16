'use strict';

import randomstring from 'randomstring';
import SynchronizationListener from '../../../clients/metaApi/synchronizationListener';
import LoggerManager from '../../../logger';

/**
 * Manager for handling equity balance event listeners
 */
export default class EquityBalanceStreamManager {

  /**
   * Constructs equity balance event listener manager instance
   * @param {DomainClient} domainClient domain client
   * @param {MetaApi} metaApi metaApi SDK instance
   */
  constructor(domainClient, metaApi) {
    this._domainClient = domainClient;
    this._metaApi = metaApi;
    this._equityBalanceListeners = {};
    this._accountsByListenerId = {};
    this._equityBalanceConnections = {};
    this._equityBalanceCaches = {};
    this._accountSynchronizationFlags = {};
    this._pendingInitalizationResolves = {};
    this._retryIntervalInSeconds = 1;
    this._logger = LoggerManager.getLogger('EquityBalanceStreamManager');
  }

  /**
   * Returns listeners for account
   * @param {String} accountId account id to return listeners for
   * @returns {{[listenerId: string]: EquityBalanceListener}} dictionary of account equity balance event listeners
   */
  getAccountListeners(accountId) {
    if(!this._equityBalanceListeners[accountId]) {
      this._equityBalanceListeners[accountId] = {};
    }
    return this._equityBalanceListeners[accountId];
  }

  /**
   * Adds an equity balance event listener
   * @param {EquityBalanceListener} listener equity balance event listener
   * @param {String} accountId account id
   * @returns {Promise<string>} listener id
   */
  // eslint-disable-next-line max-statements, complexity
  async addEquityBalanceListener(listener, accountId) {
    if(!this._equityBalanceCaches[accountId]) {
      this._equityBalanceCaches[accountId] = {
        balance: null,
        equity: null,
        pendingInitalizationResolves: []
      };
    }
    const cache = this._equityBalanceCaches[accountId];
    let connection = null;
    let retryIntervalInSeconds = this._retryIntervalInSeconds;
    const getAccountListeners = () => this.getAccountListeners(accountId);
    const pendingInitalizationResolves = this._pendingInitalizationResolves;
    const synchronizationFlags = this._accountSynchronizationFlags;

    const processEquityBalanceEvent = async (equity, balance) => {
      if(this._equityBalanceCaches[accountId]) {
        if(equity !== cache.equity || (balance && balance !== cache.balance)) {
          cache.equity = equity;
          if(balance) {
            cache.balance = balance;
          }
          if(cache.equity !== null && cache.balance !== null) {
            Object.values(getAccountListeners()).forEach(accountListener => {
              accountListener.onEquityOrBalanceUpdated({
                equity: cache.equity,
                balance: cache.balance
              });
            });
          }
        }
      }
    };

    class EquityBalanceStreamListener extends SynchronizationListener {

      async onDealsSynchronized(instanceIndex, synchronizationId) {
        try {
          if(!synchronizationFlags[accountId]) {
            synchronizationFlags[accountId] = true;
            Object.values(getAccountListeners()).forEach(accountListener => {
              accountListener.onConnected();
            });
          }
          if(pendingInitalizationResolves[accountId]) {
            pendingInitalizationResolves[accountId].forEach(resolve => resolve());
            delete pendingInitalizationResolves[accountId];
          }
        } catch (err) {
          Object.values(getAccountListeners()).forEach(accountListener => {
            accountListener.onError(err);
          });
          this._logger.error('Error processing onDealsSynchronized event for ' +
          `equity balance listener for account ${accountId}`, err);
        }
      }

      async onDisconnected(instanceIndex) {
        try {
          if(synchronizationFlags[accountId] && !connection.healthMonitor.healthStatus.synchronized) {
            synchronizationFlags[accountId] = false;
            Object.values(getAccountListeners()).forEach(accountListener => {
              accountListener.onDisconnected();
            });
          }
        } catch (err) {
          Object.values(getAccountListeners()).forEach(accountListener => {
            accountListener.onError(err);
          });
          this._logger.error('Error processing onDisconnected event for ' +
        `equity balance listener for account ${accountId}`, err);
        }
      }

      // eslint-disable-next-line complexity, max-statements
      async onSymbolPriceUpdated(instanceIndex, price) {
        try {
          if(pendingInitalizationResolves[accountId]) {
            pendingInitalizationResolves[accountId].forEach(resolve => resolve());
            delete pendingInitalizationResolves[accountId];
          }
        } catch (err) {
          Object.values(getAccountListeners()).forEach(accountListener => {
            accountListener.onError(err);
          });
          this._logger.error('Error processing onSymbolPriceUpdated event for ' +
            `equity balance listener for account ${accountId}`, err);
        }
        // price data only contains equity
        await processEquityBalanceEvent(price.equity);
      }
    
      async onAccountInformationUpdated(instanceIndex, accountInformation) {
        await processEquityBalanceEvent(accountInformation.equity, accountInformation.balance);
      }

    }

    const listenerId = randomstring.generate(10);
    const accountListeners = this.getAccountListeners(accountId);
    accountListeners[listenerId] = listener;
    this._accountsByListenerId[listenerId] = accountId;
    let isDeployed = false;
    const account = await this._metaApi.metatraderAccountApi.getAccount(accountId);
    while(!isDeployed) {
      try {
        await account.waitDeployed();
        isDeployed = true;  
      } catch (err) {
        listener.onError(err);
        this._logger.error(`Error wait for account ${accountId} to deploy, retrying`, err);
        await new Promise(res => setTimeout(res, retryIntervalInSeconds * 1000)); 
        retryIntervalInSeconds = Math.min(retryIntervalInSeconds * 2, 300);
      }
    }
    if(!this._equityBalanceConnections[accountId]) {
      retryIntervalInSeconds = this._retryIntervalInSeconds;
      connection = account.getStreamingConnection();
      this._equityBalanceConnections[accountId] = connection;
      const syncListener = new EquityBalanceStreamListener();
      connection.addSynchronizationListener(syncListener);
      
      let isSynchronized = false;
      while(!isSynchronized) {
        try {
          await connection.connect();
          await connection.waitSynchronized();
          isSynchronized = true;
        } catch (err) {
          listener.onError(err);
          this._logger.error('Error configuring equity balance stream listener ' +
            `for account ${accountId}, retrying`, err);
          await new Promise(res => setTimeout(res, retryIntervalInSeconds * 1000)); 
          retryIntervalInSeconds = Math.min(retryIntervalInSeconds * 2, 300);
        }
      }
      retryIntervalInSeconds = this._retryIntervalInSeconds;
    } else {
      connection = this._equityBalanceConnections[accountId];
      if(!connection.healthMonitor.healthStatus.synchronized) {
        if(!this._pendingInitalizationResolves[accountId]) {
          this._pendingInitalizationResolves[accountId] = [];
        }
        let resolveInitialize;
        let initializePromise = new Promise((res, rej) => {
          resolveInitialize = res;
        });
        this._pendingInitalizationResolves[accountId].push(resolveInitialize);
        await initializePromise;
      }
    }
    return listenerId;
  }

  /**
   * Removes equity balance event listener by id
   * @param {String} listenerId listener id
   */
  removeEquityBalanceListener(listenerId) {
    if(this._accountsByListenerId[listenerId]) {
      const accountId = this._accountsByListenerId[listenerId];
      delete this._accountSynchronizationFlags[accountId];
      delete this._accountsByListenerId[listenerId];
      if(this._equityBalanceListeners[accountId]) {
        delete this._equityBalanceListeners[accountId][listenerId];
      }
      if(this._equityBalanceConnections[accountId] && 
        !Object.keys(this._equityBalanceListeners[accountId]).length) {
        this._equityBalanceConnections[accountId].close();
        delete this._equityBalanceConnections[accountId];
      }
    }
  }

}
