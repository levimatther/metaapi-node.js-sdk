'use strict';

import randomstring from 'randomstring';
import SynchronizationListener from '../../../clients/metaApi/synchronizationListener';
import LoggerManager from '../../../logger';

/**
 * Manager for handling equity chart event listeners
 */
export default class EquityChartStreamManager {

  /**
   * Constructs equity chart event listener manager instance
   * @param {DomainClient} domainClient domain client
   * @param {EquityTrackingClient} equityTrackingClient equity tracking client
   * @param {MetaApi} metaApi metaApi SDK instance
   */
  constructor(domainClient, equityTrackingClient, metaApi) {
    this._domainClient = domainClient;
    this._equityTrackingClient = equityTrackingClient;
    this._metaApi = metaApi;
    this._equityChartListeners = {};
    this._accountsByListenerId = {};
    this._equityChartConnections = {};
    this._equityChartCaches = {};
    this._accountSynchronizationFlags = {};
    this._pendingInitalizationResolves = {};
    this._retryIntervalInSeconds = 1;
    this._logger = LoggerManager.getLogger('EquityChartStreamManager');
  }

  /**
   * Returns listeners for account
   * @param {String} accountId account id to return listeners for
   * @returns {{[listenerId: string]: EquityChartListener}} dictionary of account equity chart event listeners
   */
  getAccountListeners(accountId) {
    if(!this._equityChartListeners[accountId]) {
      this._equityChartListeners[accountId] = {};
    }
    return this._equityChartListeners[accountId];
  }

  /**
   * Adds an equity chart event listener
   * @param {EquityChartListener} listener equity chart event listener
   * @param {String} accountId account id
   * @param {Date} [startTime] date to start tracking from
   * @returns {Promise<string>} listener id
   */
  // eslint-disable-next-line max-statements, complexity
  async addEquityChartListener(listener, accountId, startTime) {
    if(!this._equityChartCaches[accountId]) {
      this._equityChartCaches[accountId] = {
        record: {},
        lastPeriod: {},
        pendingInitalizationResolves: []
      };
    }
    const cache = this._equityChartCaches[accountId];
    let connection = null;
    let retryIntervalInSeconds = this._retryIntervalInSeconds;
    const equityTrackingClient = this._equityTrackingClient;
    const getAccountListeners = () => this.getAccountListeners(accountId);
    const pendingInitalizationResolves = this._pendingInitalizationResolves;
    const synchronizationFlags = this._accountSynchronizationFlags;

    class EquityChartStreamListener extends SynchronizationListener {

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
          `equity chart listener for account ${accountId}`, err);
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
          `equity chart listener for account ${accountId}`, err);
        }
      }

      // eslint-disable-next-line complexity, max-statements
      async onSymbolPriceUpdated(instanceIndex, price) {
        try {
          if(pendingInitalizationResolves[accountId]) {
            pendingInitalizationResolves[accountId].forEach(resolve => resolve());
            delete pendingInitalizationResolves[accountId];
          }

          const equity = price.equity;
          const brokerTime = price.brokerTime;
          if(!cache.lastPeriod) {
            return;
          }
          if(brokerTime > cache.lastPeriod.endBrokerTime) {
            Object.values(getAccountListeners()).forEach(accountListener => {
              accountListener.onEquityRecordCompleted();  
            });
            const startBrokerTime = cache.lastPeriod.startBrokerTime;
            cache.lastPeriod = null;
            // eslint-disable-next-line no-constant-condition
            while(true) {
              let periods = await equityTrackingClient.getEquityChart(accountId, startBrokerTime, undefined, true);
              if(periods.length < 2) {
                await new Promise(res => setTimeout(res, 10000));
              } else {
                Object.values(getAccountListeners()).forEach(accountListener => {
                  accountListener.onEquityRecordUpdated(periods);
                });
                cache.lastPeriod = periods[1];
                break;
              }
            }
          } else {
            const accountInformation = connection.terminalState.accountInformation;
            if(accountInformation) {
              const previousInfo = {
                startBrokerTime: cache.lastPeriod.startBrokerTime,
                endBrokerTime: cache.lastPeriod.endBrokerTime,
                averageBalance: cache.record.averageBalance,
                minBalance: cache.record.minBalance,
                maxBalance: cache.record.maxBalance,
                averageEquity: Math.floor(cache.record.averageEquity),
                minEquity: cache.record.minEquity,
                maxEquity: cache.record.maxEquity,
                lastBalance: cache.lastPeriod.lastBalance,
                lastEquity: cache.lastPeriod.lastEquity
              };
              let durationIncrement = new Date(brokerTime).getTime() - new Date(cache.lastPeriod.brokerTime).getTime();
              cache.lastPeriod.equitySum += durationIncrement * (cache.lastPeriod.equity || accountInformation.equity);
              cache.lastPeriod.balanceSum += durationIncrement * 
                (cache.lastPeriod.balance || accountInformation.balance);
              cache.lastPeriod.duration += durationIncrement;
              cache.lastPeriod.equity = price.equity;
              cache.lastPeriod.balance = accountInformation.balance;
              cache.lastPeriod.brokerTime = price.brokerTime;
              cache.record.duration = cache.lastPeriod.duration;
              cache.record.balanceSum = cache.lastPeriod.balanceSum;
              cache.record.equitySum = cache.lastPeriod.equitySum;
              cache.record.averageEquity = cache.lastPeriod.duration ? 
                cache.lastPeriod.equitySum / cache.lastPeriod.duration : equity;
              cache.record.averageBalance = cache.lastPeriod.duration ? 
                cache.lastPeriod.balanceSum / cache.lastPeriod.duration : accountInformation.balance;
              cache.record.minEquity = Math.min(cache.record.minEquity, price.equity);
              cache.record.maxEquity = Math.max(cache.record.maxEquity, price.equity);
              cache.record.lastEquity = equity;
              cache.record.minBalance = Math.min(cache.record.minBalance, accountInformation.balance);
              cache.record.maxBalance = Math.max(cache.record.maxBalance, accountInformation.balance);
              cache.record.lastBalance = accountInformation.balance;
              /**
             * due to calculation inaccuracy, averageEquity will never match the previous value
             * therefore, floor before comparing
             */
              if(cache.lastPeriod.startBrokerTime) {
                const newInfo = {
                  startBrokerTime: cache.lastPeriod.startBrokerTime,
                  endBrokerTime: cache.lastPeriod.endBrokerTime,
                  averageBalance: cache.record.averageBalance,
                  minBalance: cache.record.minBalance,
                  maxBalance: cache.record.maxBalance,
                  averageEquity: Math.floor(cache.record.averageEquity),
                  minEquity: cache.record.minEquity,
                  maxEquity: cache.record.maxEquity,
                  lastBalance: cache.record.lastBalance,
                  lastEquity: cache.record.lastEquity
                };
                if(JSON.stringify(previousInfo) !== JSON.stringify(newInfo)) {
                  Object.values(getAccountListeners()).forEach(accountListener => {
                    accountListener.onEquityRecordUpdated([newInfo]); 
                  });
                }
              }
            }
          }     
        } catch (err) {
          Object.values(getAccountListeners()).forEach(accountListener => {
            accountListener.onError(err);
          });
          this._logger.error('Error processing onSymbolPriceUpdated event for ' +
          `equity chart listener for account ${accountId}`, err);
        }
      }
    
      async onAccountInformationUpdated(instanceIndex, accountInformation) {
        try {
          const balance = accountInformation.balance;
          cache.lastPeriod.balance = balance;
          cache.lastPeriod.lastBalance = balance;
          cache.record.lastBalance = balance;
          cache.record.minBalance = Math.min(cache.record.minBalance, balance);
          cache.record.maxBalance = Math.max(cache.record.minBalance, balance);
        } catch (err) {
          Object.values(getAccountListeners()).forEach(accountListener => {
            accountListener.onError(err);
          });
          this._logger.error('Error processing onAccountInformationUpdated event for ' +
          `equity chart listener for account ${accountId}`, err);
        }
      }

    }

    const listenerId = randomstring.generate(10);
    const accountListeners = this.getAccountListeners(accountId);
    accountListeners[listenerId] = listener;
    this._accountsByListenerId[listenerId] = accountId;
    const account = await this._metaApi.metatraderAccountApi.getAccount(accountId);
    let isDeployed = false;
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
    if(!this._equityChartConnections[accountId]) {
      retryIntervalInSeconds = this._retryIntervalInSeconds;
      connection = account.getStreamingConnection();
      this._equityChartConnections[accountId] = connection;
      const syncListener = new EquityChartStreamListener();
      connection.addSynchronizationListener(syncListener);
      
      let isSynchronized = false;
      while(!isSynchronized) {
        try {
          await connection.connect();
          await connection.waitSynchronized();
          isSynchronized = true;
        } catch (err) {
          listener.onError(err);
          this._logger.error(`Error configuring equity chart stream listener for account ${accountId}, retrying`, err);
          await new Promise(res => setTimeout(res, retryIntervalInSeconds * 1000)); 
          retryIntervalInSeconds = Math.min(retryIntervalInSeconds * 2, 300);
        }
      }
      retryIntervalInSeconds = this._retryIntervalInSeconds;
    } else {
      connection = this._equityChartConnections[accountId];
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

    let initialData = [];
    while(!initialData.length) {
      try {
        initialData = await equityTrackingClient.getEquityChart(accountId, startTime, undefined, true);
        if(initialData.length) {
          const lastItem = initialData.slice(-1)[0];
          listener.onEquityRecordUpdated(initialData);
          cache.lastPeriod = {
            duration: lastItem.duration,
            equitySum: lastItem.equitySum,
            balanceSum: lastItem.balanceSum,
            startBrokerTime: lastItem.startBrokerTime,
            endBrokerTime: lastItem.endBrokerTime,
            brokerTime: lastItem.brokerTime,
            averageEquity: Math.floor(lastItem.averageEquity),
            minEquity: lastItem.minEquity,
            maxEquity: lastItem.maxEquity,
            averageBalance: lastItem.averageBalance,
            minBalance: lastItem.minBalance,
            maxBalance: lastItem.maxBalance,
            lastBalance: lastItem.lastBalance,
            lastEquity: lastItem.lastEquity
          };
          cache.record = cache.lastPeriod;
        }
      } catch (err) {
        listener.onError(err);
        this._logger.error(`Failed initialize equity chart data for account ${accountId}`, err);
        await new Promise(res => setTimeout(res, retryIntervalInSeconds * 1000)); 
        retryIntervalInSeconds = Math.min(retryIntervalInSeconds * 2, 300);
      }
    }
    return listenerId;
  }

  /**
   * Removes equity chart event listener by id
   * @param {String} listenerId listener id
   */
  removeEquityChartListener(listenerId) {
    if(this._accountsByListenerId[listenerId]) {
      const accountId = this._accountsByListenerId[listenerId];
      delete this._accountSynchronizationFlags[accountId];
      delete this._accountsByListenerId[listenerId];
      if(this._equityChartListeners[accountId]) {
        delete this._equityChartListeners[accountId][listenerId];
      }
      if(this._equityChartConnections[accountId] && 
        !Object.keys(this._equityChartListeners[accountId]).length) {
        this._equityChartConnections[accountId].close();
        delete this._equityChartConnections[accountId];
      }
    }
  }

}
