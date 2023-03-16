import {EquityChartItem} from './equityTracking.client';

/**
 * Equity chart event listener for handling a stream of equity chart events
 */
export default class EquityChartListener {

  /**
   * Creates an equity chart listener instance
   * @param {string} accountId account id
   */
  constructor(accountId: string);

  /**
   * Returns account id
   */
  get accountId(): string;

  /**
   * Processes equity chart event which occurs when new equity chart data arrives
   * @param {EquityChartItem[]} equityChartEvent equity chart event
   */
  onEquityRecordUpdated(equityChartEvent: EquityChartItem[]): Promise<void>;

  /**
   * Processes equity chart event which occurs when an equity chart period ends
   */
  onEquityRecordCompleted(): Promise<void>;

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
