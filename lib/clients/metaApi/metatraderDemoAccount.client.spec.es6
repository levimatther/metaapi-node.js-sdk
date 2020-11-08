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
   * @test {MetatraderDemoAccountClient#createMT4DemoAccount}
   */
  it('should create new MetaTrader 4 demo from API', async () => {
    let expected = {login: '12345', password: 'qwerty', serverName: 'HugosWay-Demo3', investorPassword: 'qwerty'};
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
          leverage: 15,
          serverName: 'server'
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
        leverage: 15,
        serverName: 'server'
      });
    account.should.equal(expected);
  });

  /**
   * @test {MetatraderDemoAccountClient#createMT4DemoAccount}
   */
  it('should not create MetaTrader 4 account via API with account token', async () => {
    demoAccountClient = new MetatraderDemoAccountClient(httpClient, 'token');
    try {
      await demoAccountClient.createMT4DemoAccount('profileId1', {});
    } catch (error) {
      error.message.should.equal(
        'You can not invoke createMT4DemoAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderDemoAccountClient#getAccounts}
   */
  it('should create new MetaTrader 5 demo from API', async () => {
    let expected = {login: '12345', password: 'qwerty', serverName: 'HugosWay-Demo3', investorPassword: 'qwerty'};
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
  
  /**
   * @test {MetatraderDemoAccountClient#createMT5DemoAccount}
   */
  it('should not create MetaTrader 5 account via API with account token', async () => {
    demoAccountClient = new MetatraderDemoAccountClient(httpClient, 'token');
    try {
      await demoAccountClient.createMT5DemoAccount('profileId1', {});
    } catch (error) {
      error.message.should.equal(
        'You can not invoke createMT5DemoAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

});
