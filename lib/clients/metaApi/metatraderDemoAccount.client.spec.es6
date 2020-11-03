'use strict';

import {HttpClientMock} from '../httpClient';
import MetatraderDemoAccountClient from './metatraderDemoAccount.client';

const provisioningApiUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {MetatraderDemoAccountClient}
 */
describe('MetatraderDemoAccountClient', () => {

  let demoAccountClient;
  let httpClient = new HttpClientMock(() => 'empty');

  beforeEach(() => {
    demoAccountClient = new MetatraderDemoAccountClient(httpClient, 'header.payload.sign');
  });

  /**
   * @test {MetatraderDemoAccountClient#getAccounts}
   */
  it('should create new MetaTrader 4 demo from API', async () => {
    let expected = {login: '12345', password: 'qwerty', serverName: 'HugosWay-Demo3'};
    httpClient.requestFn = async (opts) => {
      await Promise.resolve();
      opts.should.eql({
        url: `${provisioningApiUrl}/users/current/provisioning-profiles/profileId1/mt4-demo-accounts`,
        method: 'POST',
        headers: {
          'auth-token': 'header.payload.sign'
        },
        body: {
          balance: 10,
          email: 'test@test.com',
          leverage: 15
        },
        json: true,
        timeout: 60000
      });
      return expected;
    };
    let account = await demoAccountClient.createMT4DemoAccount(
      'profileId1',
      {
        balance: 10,
        email: 'test@test.com',
        leverage: 15
      });
    account.should.equal(expected);
  });

  /**
   * @test {MetatraderDemoAccountClient#getAccounts}
   */
  it('should create new MetaTrader 5 demo from API', async () => {
    let expected = {login: '12345', password: 'qwerty', serverName: 'HugosWay-Demo3'};
    httpClient.requestFn = async (opts) => {
      await Promise.resolve();
      opts.should.eql({
        url: `${provisioningApiUrl}/users/current/provisioning-profiles/profileId2/mt5-demo-accounts`,
        method: 'POST',
        headers: {
          'auth-token': 'header.payload.sign'
        },
        body: {
          balance: 10,
          email: 'test@test.com',
          leverage: 15,
          serverName: 'server'
        },
        json: true,
        timeout: 60000
      });
      return expected;
    };
    let account = await demoAccountClient.createMT5DemoAccount(
      'profileId2',
      {
        balance: 10,
        email: 'test@test.com',
        leverage: 15,
        serverName: 'server'
      });
    account.should.equal(expected);
  });
});
