'use strict';

import HttpClient from '../httpClient';
import sinon from 'sinon';
import MetatraderAccountGeneratorClient from './metatraderAccountGenerator.client';
import randomstring from 'randomstring';

const provisioningApiUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {MetatraderAccountGeneratorClient}
 */
describe('MetatraderAccountGeneratorClient', () => {

  let client;
  const token = 'header.payload.sign';
  let httpClient = new HttpClient();
  let domainClient;
  let sandbox;
  let requestStub;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    domainClient = {
      token,
      domain: 'agiliumtrade.agiliumtrade.ai',
      getUrl: () => {}
    };
    client = new MetatraderAccountGeneratorClient(httpClient, domainClient);
    requestStub = sandbox.stub(httpClient, 'request');
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {MetatraderAccountGeneratorClient#createMT4DemoAccount}
   */
  it('should create new MetaTrader 4 demo account', async () => {
    const transactionId = 'transactionId';
    sandbox.stub(randomstring, 'generate').returns(transactionId);
    let expected = {login: '12345', password: 'qwerty', serverName: 'HugosWay-Demo3', investorPassword: 'qwerty'};
    requestStub.resolves(expected);
    let account = await client.createMT4DemoAccount(
      {
        accountType: 'type',
        balance: 10,
        email: 'test@test.com',
        leverage: 15,
        serverName: 'HugosWay-Demo3'
      }, 'profileId1');
    account.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/provisioning-profiles/profileId1/mt4-demo-accounts`,
      method: 'POST',
      headers: {
        'auth-token': token,
        'transaction-id': transactionId
      },
      body: {
        accountType: 'type',
        balance: 10,
        email: 'test@test.com',
        leverage: 15,
        serverName: 'HugosWay-Demo3'
      },
      json: true,
    }, 'createMT4DemoAccount');
    sandbox.assert.calledOnce(randomstring.generate);
  });

  /**
   * @test {MetatraderAccountGeneratorClient#createMT4DemoAccount}
   */
  it('should not create MetaTrader 4 demo account via API with account token', async () => {
    domainClient.token = 'token';
    client = new MetatraderAccountGeneratorClient(httpClient, domainClient);
    try {
      await client.createMT4DemoAccount({}, 'profileId1');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke createMT4DemoAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountGeneratorClient#createMT5DemoAccount}
   */
  it('should create new MetaTrader 5 demo account', async () => {
    const transactionId = 'transactionId';
    sandbox.stub(randomstring, 'generate').returns(transactionId);
    let expected = {login: '12345', password: 'qwerty', serverName: 'HugosWay-Demo3', investorPassword: 'qwerty'};
    requestStub.resolves(expected);
    let account = await client.createMT5DemoAccount(
      {
        accountType: 'type',
        balance: 10,
        email: 'test@test.com',
        leverage: 15,
        serverName: 'HugosWay-Demo3'
      }, 'profileId2');
    account.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/provisioning-profiles/profileId2/mt5-demo-accounts`,
      method: 'POST',
      headers: {
        'auth-token': token,
        'transaction-id': transactionId
      },
      body: {
        accountType: 'type',
        balance: 10,
        email: 'test@test.com',
        leverage: 15,
        serverName: 'HugosWay-Demo3'
      },
      json: true,
    }, 'createMT5DemoAccount');
    sandbox.assert.calledOnce(randomstring.generate);
  });
  
  /**
   * @test {MetatraderAccountGeneratorClient#createMT5DemoAccount}
   */
  it('should not create MetaTrader 5 demo account via API with account token', async () => {
    domainClient.token = 'token';
    client = new MetatraderAccountGeneratorClient(httpClient, domainClient);
    try {
      await client.createMT5DemoAccount({}, 'profileId2');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke createMT5DemoAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

});
