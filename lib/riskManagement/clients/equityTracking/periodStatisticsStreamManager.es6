'use strict';

import randomstring from 'randomstring';
import SynchronizationListener from '../../../clients/metaApi/synchronizationListener';
import {NotFoundError} from '../../../clients/errorHandler';
import LoggerManager from '../../../logger';

/**
 * Manager for handling period statistics event listeners
 */
export default class PeriodStatisticsStreamManager {

  /**
   * Constructs period statistics event listener manager instance
   * @param {DomainClient} domainClient domain client
   * @param {EquityTrackingClient} equityTrackingClient equity tracking client
   * @param {MetaApi} metaApi metaApi SDK instance
   */
  constructor(domainClient, equityTrackingClient, metaApi) {
    this._domainClient = domainClient;
    this._equityTrackingClient = equityTrackingClient;
    this._metaApi = metaApi;
    this._periodStatisticsListeners = {};
    this._accountsByListenerId = {};
    this._periodStatisticsConnections = {};
    this._periodStatisticsCaches = {};
    this._accountSynchronizationFlags = {};
    this._pendingInitalizationResolves = {};
    this._retryIntervalInSeconds = 1;
    this.removePeriodStatisticsListener = this.removePeriodStatisticsListener.bind(this);
    this._logger = LoggerManager.getLogger('PeriodStatisticsStreamManager');
  }

  /**
   * Returns listeners for account
   * @param {String} accountId account id to return listeners for
   * @returns {{[listenerId: string]: PeriodStatisticsListener}} dictionary of period statistics listeners
   */
  getAccountListeners(accountId) {
    if(!this._periodStatisticsListeners[accountId]) {
      this._periodStatisticsListeners[accountId] = {};
    }
    return this._periodStatisticsListeners[accountId];
  }

  /**
   * Adds a period statistics event listener
   * @param {PeriodStatisticsListener} listener period statistics event listener
   * @param {String} accountId account id
   * @param {String} trackerId tracker id
   * @param {Date} startTime date to start tracking from
   * @returns {String} listener id
   */
  // eslint-disable-next-line complexity, max-statements
  async addPeriodStatisticsListener(listener, accountId, trackerId, startTime) {
    if(!this._periodStatisticsCaches[accountId]) {
      this._periodStatisticsCaches[accountId] = {
        trackerData: {},
        record: {},
        equityAdjustments: {},
        lastPeriod: null
      };
    }
    const cache = this._periodStatisticsCaches[accountId];
    let connection = null;
    let retryIntervalInSeconds = this._retryIntervalInSeconds;
    const equityTrackingClient = this._equityTrackingClient;
    const listenerId = randomstring.generate(10);
    const removePeriodStatisticsListener = this.removePeriodStatisticsListener;
    const getAccountListeners = () => this.getAccountListeners(accountId);
    const pendingInitalizationResolves = this._pendingInitalizationResolves;
    const synchronizationFlags = this._accountSynchronizationFlags;

    class PeriodStatisticsStreamListener extends SynchronizationListener {

      async onDealsSynchronized(instanceIndex, synchronizationId) {
        if(!synchronizationFlags[accountId]) {
          synchronizationFlags[accountId] = true;
          Object.values(getAccountListeners()).forEach(accountListener => {
            accountListener.onConnected();
          });
          if(pendingInitalizationResolves[accountId]) {
            pendingInitalizationResolves[accountId].forEach(resolve => resolve());
            delete pendingInitalizationResolves[accountId];
          }
        }
      }

      async onDisconnected(instanceIndex) {
        if(synchronizationFlags[accountId] && !connection.healthMonitor.healthStatus.synchronized) {
          synchronizationFlags[accountId] = false;
          Object.values(getAccountListeners()).forEach(accountListener => {
            accountListener.onDisconnected();
          });
        }
      }

      // eslint-disable-next-line complexity, max-statements
      async onSymbolPriceUpdated(instanceIndex, price) {
        if(pendingInitalizationResolves[accountId]) {
          pendingInitalizationResolves[accountId].forEach(resolve => resolve());
          delete pendingInitalizationResolves[accountId];
        }

        if(!cache.lastPeriod) {
          return;
        }

        /**
         * Process brokerTime:
         * - smaller than tracker startBrokerTime -> ignore
         * - bigger than tracker endBrokerTime -> send onTrackerCompleted, close connection
         * - bigger than period endBrokerTime -> send onPeriodStatisticsCompleted
         * - normal -> compare to previous data, if different -> send onPeriodStatisticsUpdated
         */
        const equity = price.equity - Object.values(cache.equityAdjustments)
          .reduce((a, b) => a + b, 0);
        const brokerTime = price.brokerTime;
        if(brokerTime > cache.lastPeriod.endBrokerTime) {
          listener.onPeriodStatisticsCompleted();
          cache.equityAdjustments = {};
          const startBrokerTime = cache.lastPeriod.startBrokerTime;
          cache.lastPeriod = null;
          // eslint-disable-next-line no-constant-condition
          while(true) {
            let periods = await equityTrackingClient.getTrackingStatistics(accountId, trackerId, undefined, 2);
            if(periods[0].startBrokerTime === startBrokerTime) {
              await new Promise(res => setTimeout(res, 10000));
            } else {
              cache.lastPeriod = periods[0];
              listener.onPeriodStatisticsUpdated(periods.reverse());
              break;
            }
          }
        } else {
          if(cache.trackerData.startBrokerTime && brokerTime < cache.trackerData.startBrokerTime) {
            return;
          }
          if(cache.trackerData.endBrokerTime && brokerTime > cache.trackerData.endBrokerTime) {
            listener.onTrackerCompleted();
            cache.equityAdjustments = {};
            connection.removeSynchronizationListener(this);
            removePeriodStatisticsListener(listenerId);
            await connection.close();
          }
          
          let absoluteDrawdown = Math.max(0, cache.lastPeriod.initialBalance - equity);
          let relativeDrawdown = absoluteDrawdown / cache.lastPeriod.initialBalance;
          let absoluteProfit = Math.max(0, equity - cache.lastPeriod.initialBalance);
          let relativeProfit = absoluteProfit / cache.lastPeriod.initialBalance;
          const previousRecord = JSON.stringify(cache.record);
          if(!cache.record.thresholdExceeded) {
            if(cache.record.maxAbsoluteDrawdown < absoluteDrawdown) {
              cache.record.maxAbsoluteDrawdown = absoluteDrawdown;
              cache.record.maxRelativeDrawdown = relativeDrawdown;
              cache.record.maxDrawdownTime = brokerTime;
              if((cache.trackerData.relativeDrawdownThreshold && 
                cache.trackerData.relativeDrawdownThreshold < relativeDrawdown) || 
                (cache.trackerData.absoluteDrawdownThreshold &&
                  cache.trackerData.absoluteDrawdownThreshold < absoluteDrawdown)) {
                cache.record.thresholdExceeded = true;
                cache.record.exceededThresholdType = 'drawdown';
              }
            }
            if(cache.record.maxAbsoluteProfit < absoluteProfit) {
              cache.record.maxAbsoluteProfit = absoluteProfit;
              cache.record.maxRelativeProfit = relativeProfit;
              cache.record.maxProfitTime = brokerTime;
              if((cache.trackerData.relativeProfitThreshold && 
                cache.trackerData.relativeProfitThreshold < relativeProfit) ||
                (cache.trackerData.absoluteProfitThreshold &&
                  cache.trackerData.absoluteProfitThreshold < absoluteProfit)) {
                cache.record.thresholdExceeded = true;
                cache.record.exceededThresholdType = 'profit';
              }
            }
            if(JSON.stringify(cache.record) !== previousRecord) {
              listener.onPeriodStatisticsUpdated([{
                startBrokerTime: cache.lastPeriod.startBrokerTime,
                endBrokerTime: cache.lastPeriod.endBrokerTime,
                initialBalance: cache.lastPeriod.initialBalance,
                maxAbsoluteDrawdown: cache.record.maxAbsoluteDrawdown,
                maxAbsoluteProfit: cache.record.maxAbsoluteProfit,
                maxDrawdownTime: cache.record.maxDrawdownTime,
                maxProfitTime: cache.record.maxProfitTime,
                maxRelativeDrawdown: cache.record.maxRelativeDrawdown,
                maxRelativeProfit: cache.record.maxRelativeProfit,
                period: cache.lastPeriod.period,
                exceededThresholdType: cache.record.exceededThresholdType,
                thresholdExceeded: cache.record.thresholdExceeded
              }]);
            }
          }
        }
      }

      async onDealAdded(instanceIndex, deal) {
        if(deal.type === 'DEAL_TYPE_BALANCE') {
          cache.equityAdjustments[deal.id] = deal.profit;
        }
      }
    }

    const account = await this._metaApi.metatraderAccountApi.getAccount(accountId);
    const tracker = await equityTrackingClient.getTracker(accountId, trackerId);
    cache.trackerData = tracker;
    const accountListeners = this.getAccountListeners(accountId);
    accountListeners[listenerId] = listener;
    this._accountsByListenerId[listenerId] = accountId;
    if(!this._periodStatisticsConnections[accountId]) {
      let isDeployed = false;
      while(!isDeployed) {
        try {
          await account.waitDeployed();
          isDeployed = true;  
        } catch (err) {
          this._logger.error(`Error wait for account ${accountId} to deploy, retrying`, err);
          await new Promise(res => setTimeout(res, retryIntervalInSeconds * 1000)); 
          retryIntervalInSeconds = Math.min(retryIntervalInSeconds * 2, 300);
        }
      }
      retryIntervalInSeconds = this._retryIntervalInSeconds;
      connection = account.getStreamingConnection();
      const syncListener = new PeriodStatisticsStreamListener();
      connection.addSynchronizationListener(syncListener);
      this._periodStatisticsConnections[accountId] = connection;
      
      let isSynchronized = false;
      while(!isSynchronized) {
        try {
          await connection.connect();
          await connection.waitSynchronized();
          isSynchronized = true;
        } catch (err) {
          this._logger.error('Error configuring period statistics stream listener for ' +
          `account ${accountId}, retrying`, err);
          await new Promise(res => setTimeout(res, retryIntervalInSeconds * 1000)); 
          retryIntervalInSeconds = Math.min(retryIntervalInSeconds * 2, 300);
        }
      }
      retryIntervalInSeconds = this._retryIntervalInSeconds;
    } else {
      connection = this._periodStatisticsConnections[accountId];
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
        initialData = await equityTrackingClient.getTrackingStatistics(accountId, trackerId);
        if(initialData.length) {
          const lastItem = initialData[0];
          listener.onPeriodStatisticsUpdated(initialData);
          cache.lastPeriod = {
            startBrokerTime: lastItem.startBrokerTime,
            endBrokerTime: lastItem.endBrokerTime,
            period: lastItem.period,
            initialBalance: lastItem.initialBalance,
            maxDrawdownTime: lastItem.maxDrawdownTime,
            maxAbsoluteDrawdown: lastItem.maxAbsoluteDrawdown,
            maxRelativeDrawdown: lastItem.maxRelativeDrawdown,
            maxProfitTime: lastItem.maxProfitTime,
            maxAbsoluteProfit: lastItem.maxAbsoluteProfit,
            maxRelativeProfit: lastItem.maxRelativeProfit,
            thresholdExceeded: lastItem.thresholdExceeded,
            exceededThresholdType: lastItem.exceededThresholdType
          };
          cache.record = cache.lastPeriod;
        }
      } catch (err) {
        this._logger.error(`Failed initialize equity chart data for account ${accountId}`, err);
        await new Promise(res => setTimeout(res, retryIntervalInSeconds * 1000)); 
        retryIntervalInSeconds = Math.min(retryIntervalInSeconds * 2, 300);
      }
    }
    return listenerId;
  }

  /**
   * Removes period statistics event listener by id
   * @param {String} listenerId listener id 
   */
  removePeriodStatisticsListener(listenerId) {
    if(this._accountsByListenerId[listenerId]) {
      const accountId = this._accountsByListenerId[listenerId];
      delete this._accountsByListenerId[listenerId];
      delete this._accountSynchronizationFlags[accountId];
      if(this._periodStatisticsListeners[accountId]) {
        delete this._periodStatisticsListeners[accountId][listenerId];
      }
      if(this._periodStatisticsConnections[accountId] && 
        !Object.keys(this._periodStatisticsListeners[accountId]).length) {
        this._periodStatisticsConnections[accountId].close();
        delete this._periodStatisticsConnections[accountId];
      }
    }
  }

}
