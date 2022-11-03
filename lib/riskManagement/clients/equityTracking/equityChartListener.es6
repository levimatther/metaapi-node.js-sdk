'use strict';

/**
 * Equity chart event listener for handling a stream of equity chart events
 */
export default class EquityChartListener {

  /**
   * Processes equity chart event which occurs when new equity chart data arrives
   * @param {EquityChartItem[]} equityChartEvent equity chart event
   */
  async onEquityRecordUpdated(equityChartEvent) {
    throw Error('Abstract method onEquityChartEvent has no implementation');
  }

  /**
   * Processes equity chart event which occurs when an equity chart period ends
   */
  async onEquityRecordCompleted() {
    throw Error('Abstract method onEquityRecordCompleted has no implementation');
  }

  /**
   * Processes an event which occurs when connection has been established
   */
  async onConnected() {
    throw Error('Abstract method onConnected has no implementation');
  }

  /**
   * Processes an event which occurs when connection has been lost
   */
  async onDisconnected() {
    throw Error('Abstract method onDisconnected has no implementation');
  }

  /**
   * Processes an error event
   * @param {Error} error error received 
   */
  async onError(error) {}

}