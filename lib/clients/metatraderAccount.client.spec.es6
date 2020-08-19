'use strict';

import {HttpClientMock} from './httpClient';
import MetatraderAccountClient from './metatraderAccount.client';

const provisioningApiUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {MetatraderAccountClient}
 */
describe('MetatraderAccountClient', () => {

  let accountClient;
  let httpClient = new HttpClientMock(() => 'empty');

  beforeEach(() => {
    accountClient = new MetatraderAccountClient(httpClient, 'header.payload.sign');
  });

  /**
   * @test {MetatraderAccountClient#getAccounts}
   */
  it('should retrieve MetaTrader accounts from API', async () => {
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
            url: `${provisioningApiUrl}/users/current/accounts`,
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
   * @test {MetatraderAccountClient#getAccount}
   */
  it('should retrieve MetaTrader account from API', async () => {
    let expected = {
      _id: 'id',
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
    };
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/accounts/id`,
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
    let account = await accountClient.getAccount('id');
    account.should.equal(expected);
  });

  /**
   * @test {MetatraderAccountClient#getAccountByToken}
   */
  it('should retrieve MetaTrader account by token from API', async () => {
    accountClient = new MetatraderAccountClient(httpClient, 'token');
    let expected = {
      _id: 'id',
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
    };
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/accounts/accessToken/token`,
            method: 'GET',
            json: true,
            timeout: 60000
          });
          return expected;
        });
    };
    let account = await accountClient.getAccountByToken();
    account.should.equal(expected);
  });

  /**
   * @test {MetatraderAccountClient#createAccount}
   */
  it('should not retrieve MetaTrader account by token via API with api token', async () => {
    accountClient = new MetatraderAccountClient(httpClient, 'header.payload.sign');
    try {
      await accountClient.getAccountByToken();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke getAccountByToken method, because you have connected with API access token. ' +
        'Please use account access token to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#createAccount}
   */
  it('should create MetaTrader account via API', async () => {
    let expected = {
      id: 'id'
    };
    let account = {
      login: '50194988',
      password: 'Test1234',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      timeConverter: 'icmarkets',
      application: 'MetaApi',
      synchronizationMode: 'automatic',
      type: 'cloud'
    };
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/accounts`,
            method: 'POST',
            body: account,
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000
          });
          return expected;
        });
    };
    let id = await accountClient.createAccount(account);
    id.should.equal(expected);
  });

  /**
   * @test {MetatraderAccountClient#createAccount}
   */
  it('should not create MetaTrader account via API with account token', async () => {
    accountClient = new MetatraderAccountClient(httpClient, 'token');
    try {
      await accountClient.createAccount({});
    } catch (error) {
      error.message.should.equal(
        'You can not invoke createAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#deployAccount}
   */
  it('should deploy MetaTrader account via API', async () => {
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/accounts/id/deploy`,
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
    await accountClient.deployAccount('id');
  });

  /**
   * @test {MetatraderAccountClient#deployAccount}
   */
  it('should not deploy MetaTrader account via API with account token', async () => {
    accountClient = new MetatraderAccountClient(httpClient, 'token');
    try {
      await accountClient.deployAccount('id');
    } catch (error) {
      error.message.should.equal(
        'You can not invoke deployAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#undeployAccount}
   */
  it('should undeploy MetaTrader account via API', async () => {
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/accounts/id/undeploy`,
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
    await accountClient.undeployAccount('id');
  });

  /**
   * @test {MetatraderAccountClient#undeployAccount}
   */
  it('should not undeploy MetaTrader account via API with account token', async () => {
    accountClient = new MetatraderAccountClient(httpClient, 'token');
    try {
      await accountClient.undeployAccount('id');
    } catch (error) {
      error.message.should.equal(
        'You can not invoke undeployAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#redeployAccount}
   */
  it('should redeploy MetaTrader account via API', async () => {
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/accounts/id/redeploy`,
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
    await accountClient.redeployAccount('id');
  });

  /**
   * @test {MetatraderAccountClient#redeployAccount}
   */
  it('should not redeploy MetaTrader account via API with account token', async () => {
    accountClient = new MetatraderAccountClient(httpClient, 'token');
    try {
      await accountClient.redeployAccount('id');
    } catch (error) {
      error.message.should.equal(
        'You can not invoke redeployAccount method, because you have connected with account access token. ' +
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
            url: `${provisioningApiUrl}/users/current/accounts/id`,
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

  /**
   * @test {MetatraderAccountClient#updateAccount}
   */
  it('should update MetaTrader account via API', async () => {
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/accounts/id`,
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

});
