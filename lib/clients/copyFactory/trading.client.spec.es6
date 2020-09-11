'use strict';

import {HttpClientMock} from '../httpClient';
import TradingClient from './trading.client';

const copyFactoryApiUrl = 'https://trading-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {TradingClient}
 */
describe('TradingClient', () => {

  let tradingClient;
  let httpClient = new HttpClientMock(() => 'empty');

  beforeEach(() => {
    tradingClient = new TradingClient(httpClient, 'header.payload.sign');
  });

  /**
   * @test {TradingClient#resynchronize}
   */
  it('should resynchronize CopyFactory account', async () => {
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${copyFactoryApiUrl}/users/current/accounts/` +
              '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef/resynchronize',
            method: 'POST',
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000,
            qs: {
              strategyId: ['ABCD']
            }
          });
          return;
        });
    };
    await tradingClient.resynchronize('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', ['ABCD']);
  });

  /**
   * @test {TradingClient#resynchronize}
   */
  it('should not resynchronize account with account token', async () => {
    tradingClient = new TradingClient(httpClient, 'token');
    try {
      await tradingClient.resynchronize('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    } catch (error) {
      error.message.should.equal(
        'You can not invoke resynchronize method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {TradingClient#getStopouts}
   */
  it('should retrieve stopouts', async () => {
    let expected = [{
      reason: 'max-drawdown',
      stoppedAt: new Date('2020-08-08T07:57:30.328Z'),
      strategy: {
        id: 'ABCD',
        name: 'Strategy'
      },
      reasonDescription: 'total strategy equity drawdown exceeded limit'
    }
    ];
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${copyFactoryApiUrl}/users/current/accounts/` +
              '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef/stopouts',
            method: 'GET',
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000
          });
          return expected;
        });
    };
    let stopouts = await tradingClient
      .getStopouts('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    stopouts.should.equal(expected);
  });

  /**
   * @test {TradingClient#getStopouts}
   */
  it('should not retrieve stopouts from API with account token', async () => {
    tradingClient = new TradingClient(httpClient, 'token');
    try {
      await tradingClient.getStopouts('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    } catch (error) {
      error.message.should.equal(
        'You can not invoke getStopouts method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {TradingClient#resetStopout}
   */
  it('should reset stopout', async () => {
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${copyFactoryApiUrl}/users/current/accounts/` +
            '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef/stopouts/daily-equity/reset',
            method: 'POST',
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000
          });
          return;
        });
    };
    await tradingClient.resetStopout('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      'daily-equity');
  });

  /**
   * @test {TradingClient#resetStopout}
   */
  it('should not reset stopout with account token', async () => {
    tradingClient = new TradingClient(httpClient, 'token');
    try {
      await tradingClient.resetStopout('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        'daily-equity');
    } catch (error) {
      error.message.should.equal(
        'You can not invoke resetStopout method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

});
