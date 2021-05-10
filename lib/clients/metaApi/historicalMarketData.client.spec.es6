'use strict';

import HttpClient from '../httpClient';
import sinon from 'sinon';
import HistoricalMarketDataClient from './historicalMarketData.client';

const marketDataClientApiUrl = 'https://mt-market-data-client-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {HistoricalMarketDataClient}
 */
describe('HistoricalMarketDataClient', () => {

  let client;
  const token = 'header.payload.sign';
  let httpClient = new HttpClient();
  let sandbox;
  let requestStub;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    client = new HistoricalMarketDataClient(httpClient, token);
    requestStub = sandbox.stub(httpClient, 'request');
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {HistoricalMarketDataClient#getHistoricalCandles}
   */
  it('should download historical candles from API', async () => {
    let expected = [{
      symbol: 'AUDNZD',
      timeframe: '15m',
      time: new Date('2020-04-07T03:45:00.000Z'),
      brokerTime: '2020-04-07 06:45:00.000',
      open: 1.03297,
      high: 1.06309,
      low: 1.02705,
      close: 1.043,
      tickVolume: 1435,
      spread: 17,
      volume: 345
    }];
    requestStub.resolves(expected);
    let candles = await client.getHistoricalCandles('accountId', 'AUDNZD', '15m', new Date('2020-04-07T03:45:00.000Z'),
      1);
    candles.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${marketDataClientApiUrl}/users/current/accounts/accountId/historical-market-data/symbols/AUDNZD/` +
        'timeframes/15m/candles',
      method: 'GET',
      qs: {
        startTime: new Date('2020-04-07T03:45:00.000Z'),
        limit: 1
      },
      headers: {
        'auth-token': token
      },
      json: true
    });
  });

  /**
   * @test {HistoricalMarketDataClient#getHistoricalTicks}
   */
  it('should download historical ticks from API', async () => {
    let expected = [{
      symbol: 'AUDNZD',
      time: new Date('2020-04-07T03:45:00.000Z'),
      brokerTime: '2020-04-07 06:45:00.000',
      bid: 1.05297,
      ask: 1.05309,
      last: 0.5298,
      volume: 0.13,
      side: 'buy'
    }];
    requestStub.resolves(expected);
    let ticks = await client.getHistoricalTicks('accountId', 'AUDNZD', new Date('2020-04-07T03:45:00.000Z'), 0, 1);
    ticks.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${marketDataClientApiUrl}/users/current/accounts/accountId/historical-market-data/symbols/AUDNZD/ticks`,
      method: 'GET',
      qs: {
        startTime: new Date('2020-04-07T03:45:00.000Z'),
        offset: 0,
        limit: 1
      },
      headers: {
        'auth-token': token
      },
      json: true
    });
  });

});
