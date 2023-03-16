import {PeriodStatistics} from './equityTracking.client';

/**
 * Period statistics event listener for handling a stream of period statistics events
 */
export default class PeriodStatisticsListener {

  /**
   * Creates a period statistics listener instance
   * @param {string} accountId account id
   * @param {string} trackerId tracker id
   */
  constructor(accountId: string, trackerId: string);

  /**
   * Returns account id
   */
  get accountId(): string;

  /**
   * Returns tracker id
   */
  get trackerId(): string;

  /**
   * Processes period statistics event which occurs when new period statistics data arrives
   * @param {PeriodStatistics[]} periodStatisticsEvent period statistics event
   */
  onPeriodStatisticsUpdated(periodStatisticsEvent: PeriodStatistics[]): Promise<void>;

  /**
   * Processes period statistics event which occurs when a statistics period ends
   */
  onPeriodStatisticsCompleted(): Promise<void>;

  /**
   * Processes an event which occurs when connection has been established
   * @param {string} instanceIndex connection instance index
   */
  onConnected(instanceIndex: string): Promise<void>;
 
  /**
   * Processes an event which occurs when connection has been lost
   * @param {string} instanceIndex connection instance index
   */
  onDisconnected(instanceIndex: string): Promise<void>;

  /**
   * Processes an error event
   * @param {Error} error error received 
   */
  onError(error: Error): Promise<void>;

}
