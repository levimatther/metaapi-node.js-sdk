'use strict';

import {HttpClientMock} from './httpClient';
import CopyFactoryClient from './copyFactory.client';
import MetatraderAccountClient from "./metatraderAccount.client";

const copyFactoryApiUrl = 'https://trading-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {CopyFactoryClient}
 */
describe('CopyFactoryClient', () => {

  let accountClient;
  let httpClient = new HttpClientMock(() => 'empty');

  beforeEach(() => {
    accountClient = new CopyFactoryClient(httpClient, 'header.payload.sign');
  });

  /**
   * @test {MetatraderAccountClient#updateAccount}
   */
  it('should update CopyFactory account via API', async () => {
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${copyFactoryApiUrl}/users/current/configuration/accounts/id`,
            method: 'PUT',
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000,
            body: {
              name: 'new account name',
              password: 'new_password007',
              server: 'ICMarketsSC2-Demo',
              synchronizationMode: 'user'
            }
          });
        });
    };
    await accountClient.updateAccount('id', {
      name: 'new account name',
      password: 'new_password007',
      server: 'ICMarketsSC2-Demo',
      synchronizationMode: 'user'
    });
  });

  /**
   * @test {MetatraderAccountClient#updateAccount}
   */
  it('should not update MetaTrader account via API with account token', async () => {
    accountClient = new MetatraderAccountClient(httpClient, 'token');
    try {
      await accountClient.updateAccount('id', {});
    } catch (error) {
      error.message.should.equal(
        'You can not invoke updateAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {CopyFactoryClient#getAccounts}
   */
  it('should retrieve CopyFactory accounts from API', async () => {
    let expected = [{
      _id: '1eda642a-a9a3-457c-99af-3bc5e8d5c4c9',
      login: '50194988',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      timeConverter: 'icmarkets',
      application: 'MetaApi',
      connectionStatus: 'DISCONNECTED',
      state: 'DEPLOYED',
      synchronizationMode: 'automatic',
      type: 'cloud'
    }];
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${copyFactoryApiUrl}/users/current/accounts`,
            method: 'GET',
            qs: {
              provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076'
            },
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000
          });
          return expected;
        });
    };
    let accounts = await accountClient.getAccounts({
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076'
    });
    accounts.should.equal(expected);
  });

  /**
   * @test {MetatraderAccountClient#getAccounts}
   */
  it('should not retrieve MetaTrader accounts from API with account token', async () => {
    accountClient = new MetatraderAccountClient(httpClient, 'token');
    try {
      await accountClient.getAccounts('f9ce1f12-e720-4b9a-9477-c2d4cb25f076');
    } catch (error) {
      error.message.should.equal(
        'You can not invoke getAccounts method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#deleteAccount}
   */
  it('should delete MetaTrader account via API', async () => {
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${copyFactoryApiUrl}/users/current/accounts/id`,
            method: 'DELETE',
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000
          });
          return;
        });
    };
    await accountClient.deleteAccount('id');
  });

  /**
   * @test {MetatraderAccountClient#deleteAccount}
   */
  it('should not delete MetaTrader account from via with account token', async () => {
    accountClient = new MetatraderAccountClient(httpClient, 'token');
    try {
      await accountClient.deleteAccount('id');
    } catch (error) {
      error.message.should.equal(
        'You can not invoke deleteAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

});
