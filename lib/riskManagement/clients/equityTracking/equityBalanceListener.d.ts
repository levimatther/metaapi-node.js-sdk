/**
 * Equity balance event listener for handling a stream of equity and balance updates
 */
export default class EquityBalanceListener {

  /**
   * Processes an update event when equity or balance changes
   * @param {EquityBalanceData} equityBalanceData equity chart event
   */
  onEquityOrBalanceUpdated(equityBalanceData: EquityBalanceData): Promise<void>;

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

}

/**
 * Equity balance data for account
 */
export declare type EquityBalanceData = {

  /**
   * account equity
   */
  equity: number;

  /**
   * account balance
   */
  balance: number;

}
