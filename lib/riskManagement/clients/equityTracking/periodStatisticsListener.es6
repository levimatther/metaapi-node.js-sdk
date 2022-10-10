'use strict';

/**
 * Period statistics event listener for handling a stream of period statistics events
 */
export default class PeriodStatisticsListener {

  /**
   * Processes period statistics event which occurs when new period statistics data arrives
   * @param {PeriodStatistics} periodStatisticsEvent period statistics event
   */
  async onPeriodStatisticsUpdated(periodStatisticsEvent) {
    throw Error('Abstract method onPeriodStatisticsUpdated has no implementation');
  }

  /**
   * Processes period statistics event which occurs when a statistics period ends
   */
  async onPeriodStatisticsCompleted() {
    throw Error('Abstract method onPeriodStatisticsCompleted has no implementation');
  }

  /**
   * Processes period statistics event which occurs when the tracker period ends
   */
  async onTrackerCompleted(){
    throw Error('Abstract method onTrackerCompleted has no implementation');
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

}