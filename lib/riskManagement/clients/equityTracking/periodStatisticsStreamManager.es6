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
    this._trackersByListenerId = {};
    this._trackerSyncListeners = {};
    this._periodStatisticsConnections = {};
    this._periodStatisticsCaches = {};
    this._accountSynchronizationFlags = {};
    this._pendingInitalizationResolves = {};
    this._syncListeners = {};
    this._retryIntervalInSeconds = 1;
    this._fetchInitialDataIntervalId = {};
    this.removePeriodStatisticsListener = this.removePeriodStatisticsListener.bind(this);
    this._logger = LoggerManager.getLogger('PeriodStatisticsStreamManager');
  }

  /**
   * Returns listeners for a tracker
   * @param {string} accountId account id to return listeners for
   * @param {string} trackerId tracker id to return listeners for
   * @returns {{[listenerId: string]: PeriodStatisticsListener}} dictionary of period statistics listeners
   */
  getTrackerListeners(accountId, trackerId) {
    if(!this._periodStatisticsListeners[accountId] || !this._periodStatisticsListeners[accountId][trackerId]) {
      return {};
    } else {
      return this._periodStatisticsListeners[accountId][trackerId];
    }
  }

  /**
   * Adds a period statistics event listener
   * @param {PeriodStatisticsListener} listener period statistics event listener
   * @param {String} accountId account id
   * @param {String} trackerId tracker id
   * @returns {String} listener id
   */
  // eslint-disable-next-line complexity, max-statements
  async addPeriodStatisticsListener(listener, accountId, trackerId) {
    let newTracker = false;
    if(!this._periodStatisticsCaches[accountId]) {
      this._periodStatisticsCaches[accountId] = {};
    }
    if(!this._periodStatisticsCaches[accountId][trackerId]) {
      newTracker = true;
      this._periodStatisticsCaches[accountId][trackerId] = {
        trackerData: {},
        record: {},
        lastPeriod: {},
        equityAdjustments: {}
      };
    }
    const cache = this._periodStatisticsCaches[accountId][trackerId];
    let connection = null;
    let retryIntervalInSeconds = this._retryIntervalInSeconds;
    const equityTrackingClient = this._equityTrackingClient;
    const listenerId = randomstring.generate(10);
    const removePeriodStatisticsListener = this.removePeriodStatisticsListener;
    const getTrackerListeners = () => this.getTrackerListeners(accountId, trackerId);
    const pendingInitalizationResolves = this._pendingInitalizationResolves;
    const synchronizationFlags = this._accountSynchronizationFlags;

    class PeriodStatisticsStreamListener extends SynchronizationListener {

      async onDealsSynchronized(instanceIndex, synchronizationId) {
        try {
          if(!synchronizationFlags[accountId]) {
            synchronizationFlags[accountId] = true;
            Object.values(getTrackerListeners()).forEach(accountListener => {
              accountListener.onConnected();
            });
            if(pendingInitalizationResolves[accountId]) {
              pendingInitalizationResolves[accountId].forEach(resolve => resolve());
              delete pendingInitalizationResolves[accountId];
            }
          }
        } catch (err) {
          listener.onError(err);
          this._logger.error('Error processing onDealsSynchronized event for ' +
          `equity chart listener for account ${accountId}`, err);
        }
      }

      async onDisconnected(instanceIndex) {
        try {
          if(synchronizationFlags[accountId] && !connection.healthMonitor.healthStatus.synchronized) {
            synchronizationFlags[accountId] = false;
            Object.values(getTrackerListeners()).forEach(trackerListener => {
              trackerListener.onDisconnected();
            });
          }
        } catch (err) {
          Object.values(getTrackerListeners()).forEach(trackerListener => {
            trackerListener.onError(err);
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
            Object.values(getTrackerListeners()).forEach(trackerListener => {
              trackerListener.onPeriodStatisticsCompleted();
            });
            cache.equityAdjustments = {};
            const startBrokerTime = cache.lastPeriod.startBrokerTime;
            cache.lastPeriod = null;
            // eslint-disable-next-line no-constant-condition
            while(true) {
              let periods = await equityTrackingClient.getTrackingStatistics(accountId, trackerId, undefined, 2, true);
              if(periods[0].startBrokerTime === startBrokerTime) {
                await new Promise(res => setTimeout(res, 10000));
              } else {
                cache.lastPeriod = periods[0];
                periods.reverse();
                Object.values(getTrackerListeners()).forEach(trackerListener => {
                  trackerListener.onPeriodStatisticsUpdated(periods);
                });
                break;
              }
            }
          } else {
            if(cache.trackerData.startBrokerTime && brokerTime < cache.trackerData.startBrokerTime) {
              return;
            }
            if(cache.trackerData.endBrokerTime && brokerTime > cache.trackerData.endBrokerTime) {
              Object.values(getTrackerListeners()).forEach(trackerListener => {
                trackerListener.onTrackerCompleted();
              });
              cache.equityAdjustments = {};
              Object.keys(getTrackerListeners()).forEach(trackerListenerId => {
                removePeriodStatisticsListener(trackerListenerId);
              });
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
                Object.values(getTrackerListeners()).forEach(trackerListener => {
                  trackerListener.onPeriodStatisticsUpdated([{
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
                    thresholdExceeded: cache.record.thresholdExceeded,
                    tradeDayCount: cache.record.tradeDayCount
                  }]);
                });
              }
            }
          }
        } catch (err) {
          Object.values(getTrackerListeners()).forEach(trackerListener => {
            trackerListener.onError(err);
          });
          this._logger.error('Error processing onSymbolPriceUpdated event for ' +
          `period statistics listener for account ${accountId}`, err);
        }
      }

      async onDealAdded(instanceIndex, deal) {
        try {
          if(!cache.lastPeriod || !Object.keys(cache.lastPeriod).length) {
            return;
          }
          if(deal.type === 'DEAL_TYPE_BALANCE') {
            cache.equityAdjustments[deal.id] = deal.profit;
          }
          const ignoredDealTypes = ['DEAL_TYPE_BALANCE', 'DEAL_TYPE_CREDIT'];
          if(!ignoredDealTypes.includes(deal.type)) {
            const timeDiff = new Date(deal.time).getTime() - new Date(deal.brokerTime).getTime();
            const startSearchDate = new Date(new Date(cache.lastPeriod.startBrokerTime).getTime() + timeDiff);
            const deals = connection.historyStorage.getDealsByTimeRange(startSearchDate, new Date(8640000000000000))
              .filter(dealItem => !ignoredDealTypes.includes(dealItem.type));
            deals.push(deal);
            const tradedDays = {};
            deals.forEach(dealItem => {
              tradedDays[dealItem.brokerTime.slice(0, 10)] = true;
            });
            const tradeDayCount = Object.keys(tradedDays).length;
            if(cache.record.tradeDayCount !== tradeDayCount) {
              cache.record.tradeDayCount = tradeDayCount;
              Object.values(getTrackerListeners()).forEach(trackerListener => {
                trackerListener.onPeriodStatisticsUpdated([{
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
                  thresholdExceeded: cache.record.thresholdExceeded,
                  tradeDayCount: cache.record.tradeDayCount
                }]);
              });
            }
          }
        } catch (err) {
          Object.values(getTrackerListeners()).forEach(trackerListener => {
            trackerListener.onError(err);
          });
          this._logger.error('Error processing onDealAdded event for ' +
          `period statistics listener for account ${accountId}`, err);
        }
      }
    }

    const account = await this._metaApi.metatraderAccountApi.getAccount(accountId);
    const tracker = await equityTrackingClient.getTracker(accountId, trackerId);
    cache.trackerData = tracker;
    if(!this._periodStatisticsListeners[accountId]) {
      this._periodStatisticsListeners[accountId] = {};
    }
    if(!this._periodStatisticsListeners[accountId][trackerId]) {
      this._periodStatisticsListeners[accountId][trackerId] = {};
    }
    const accountListeners = this._periodStatisticsListeners[accountId][trackerId];
    accountListeners[listenerId] = listener;
    this._accountsByListenerId[listenerId] = accountId;
    this._trackersByListenerId[listenerId] = trackerId;
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
    if(!this._periodStatisticsConnections[accountId]) {
      retryIntervalInSeconds = this._retryIntervalInSeconds;
      connection = account.getStreamingConnection();
      const syncListener = new PeriodStatisticsStreamListener();
      connection.addSynchronizationListener(syncListener);
      this._periodStatisticsConnections[accountId] = connection;
      this._syncListeners[trackerId] = syncListener;
      
      let isSynchronized = false;
      while(!isSynchronized) {
        try {
          await connection.connect();
          await connection.waitSynchronized();
          isSynchronized = true;
        } catch (err) {
          listener.onError(err);
          this._logger.error('Error configuring period statistics stream listener for ' +
          `account ${accountId}, retrying`, err);
          await new Promise(res => setTimeout(res, retryIntervalInSeconds * 1000)); 
          retryIntervalInSeconds = Math.min(retryIntervalInSeconds * 2, 300);
        }
      }
      retryIntervalInSeconds = this._retryIntervalInSeconds;
    } else {
      connection = this._periodStatisticsConnections[accountId];
      if(newTracker) {
        const syncListener = new PeriodStatisticsStreamListener();
        connection.addSynchronizationListener(syncListener);
        this._syncListeners[trackerId] = syncListener;
      }
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
    const fetchInitialData = async () => {
      try {
        initialData = await equityTrackingClient.getTrackingStatistics(accountId, trackerId,
          undefined, undefined, true);
        if(initialData.length) {
          const lastItem = initialData[0];
          if(this._fetchInitialDataIntervalId[listenerId]) {
            clearInterval(this._fetchInitialDataIntervalId[listenerId]);
            delete this._fetchInitialDataIntervalId[listenerId];
          }
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
            exceededThresholdType: lastItem.exceededThresholdType,
            tradeDayCount: lastItem.tradeDayCount
          };
          cache.record = cache.lastPeriod;
        }
      } catch (err) {
        listener.onError(err);
        this._logger.error(`Failed to initialize tracking statistics data for account ${accountId}`, err);
        await new Promise(res => setTimeout(res, retryIntervalInSeconds * 1000)); 
        retryIntervalInSeconds = Math.min(retryIntervalInSeconds * 2, 300);
      }
    };
    retryIntervalInSeconds = this._retryIntervalInSeconds;
    this._fetchInitialDataIntervalId[listenerId] = 
      setInterval(fetchInitialData, retryIntervalInSeconds * 1000 * 2 * 60);
    fetchInitialData();

    return listenerId;
  }

  /**
   * Removes period statistics event listener by id
   * @param {String} listenerId listener id 
   */
  // eslint-disable-next-line complexity
  removePeriodStatisticsListener(listenerId) {
    if(this._accountsByListenerId[listenerId] && this._trackersByListenerId[listenerId]) {
      if(this._fetchInitialDataIntervalId[listenerId]) {
        clearInterval(this._fetchInitialDataIntervalId[listenerId]);
        delete this._fetchInitialDataIntervalId[listenerId];
      }
      const accountId = this._accountsByListenerId[listenerId];
      const trackerId = this._trackersByListenerId[listenerId];
      delete this._accountsByListenerId[listenerId];
      delete this._trackersByListenerId[listenerId];
      if(this._periodStatisticsListeners[accountId]) {
        if(this._periodStatisticsListeners[accountId][trackerId]) {
          delete this._periodStatisticsListeners[accountId][trackerId][listenerId];
          if(!Object.keys(this._periodStatisticsListeners[accountId][trackerId]).length) {
            delete this._periodStatisticsListeners[accountId][trackerId];
            if(this._periodStatisticsConnections[accountId] && this._syncListeners[trackerId]) {
              this._periodStatisticsConnections[accountId]
                .removeSynchronizationListener(this._syncListeners[trackerId]);
              delete this._syncListeners[trackerId];
            }
          }
        }
        if(!Object.keys(this._periodStatisticsListeners[accountId]).length) {
          delete this._periodStatisticsListeners[accountId];
        }
      }
      if(this._periodStatisticsConnections[accountId] && 
        !this._periodStatisticsListeners[accountId]) {
        delete this._accountSynchronizationFlags[accountId];
        this._periodStatisticsConnections[accountId].close();
        delete this._periodStatisticsConnections[accountId];
      }
    }
  }

}
