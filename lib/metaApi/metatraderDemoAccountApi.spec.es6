'use strict';

import should from 'should';
import sinon from 'sinon';
import MetatraderDemoAccountApi from './metatraderDemoAccountApi';
import MetatraderDemoAccount from './metatraderDemoAccount';

/**
 * @test {MetatraderDemoAccountApi}
 * @test {MetatraderDemoAccount}
 */
describe('MetatraderDemoAccountApi', () => {

  let sandbox;
  let api;
  let client = {
    createMT4DemoAccount: () => {},
    createMT5DemoAccount: () => {}
  };

  before(() => {
    api = new MetatraderDemoAccountApi(client);
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {MetatraderDemoAccountApi#createMT4DemoAccount}
   */
  it('should create MT4 demo account', async () => {
    sandbox.stub(client, 'createMT4DemoAccount').resolves({
      login: '12345',
      password: 'qwerty',
      serverName: 'HugosWay-Demo3',
      investorPassword: 'qwerty'
    });
    let newAccountData = {
      balance: 10,
      email: 'test@test.com',
      leverage: 15,
      serverName: 'server'
    };
    let account = await api.createMT4DemoAccount('profileId1', newAccountData);
    account.should.match({login: '12345', password: 'qwerty', serverName: 'HugosWay-Demo3', 
      investorPassword: 'qwerty'});
    (account instanceof MetatraderDemoAccount).should.be.true();
    sinon.assert.calledWith(client.createMT4DemoAccount, 'profileId1', newAccountData);
  });

  /**
   * @test {MetatraderDemoAccountApi#createMT5DemoAccount}
   */
  it('should create MT5 demo account', async () => {
    sandbox.stub(client, 'createMT5DemoAccount').resolves({
      login: '12345',
      password: 'qwerty',
      serverName: 'HugosWay-Demo3',
      investorPassword: 'qwerty'
    });
    let newAccountData = {
      balance: 15,
      email: 'test@test.com',
      leverage: 20,
      serverName: 'server'
    };
    let account = await api.createMT5DemoAccount('profileId2', newAccountData);
    account.should.match({login: '12345', password: 'qwerty', serverName: 'HugosWay-Demo3', 
      investorPassword: 'qwerty'});
    (account instanceof MetatraderDemoAccount).should.be.true();
    sinon.assert.calledWith(client.createMT5DemoAccount, 'profileId2', newAccountData);
  });
});
