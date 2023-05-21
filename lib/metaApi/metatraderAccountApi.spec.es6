'use strict';

import should from 'should';
import sinon from 'sinon';
import MetatraderAccountApi from './metatraderAccountApi';
import MetatraderAccount from './metatraderAccount';
import {NotFoundError} from '../clients/errorHandler';
import HistoryDatabase from './historyDatabase/index';
import ExpertAdvisor from './expertAdvisor';
import MetatraderAccountReplica from './metatraderAccountReplica.es6';

/**
 * @test {MetatraderAccountApi}
 * @test {MetatraderAccount}
 */
// eslint-disable-next-line max-statements
describe('MetatraderAccountApi', () => {

  let sandbox;
  let api;
  let getAccountStub;
  let client = {
    getAccounts: () => {},
    getAccount: () => {},
    getAccountByToken: () => {},
    createAccount: () => {},
    deleteAccount: () => {},
    deployAccount: () => {},
    undeployAccount: () => {},
    redeployAccount: () => {},
    updateAccount: () => {},
    increaseReliability: () => {},
    enableRiskManagementApi: () => {},
    enableMetaStatsApi: () => {},
    createAccountReplica: () => {},
    getAccountReplica: () => {},
    getAccountReplicas: () => {},
    deployAccountReplica: () => {},
    undeployAccountReplica: () => {},
    redeployAccountReplica: () => {},
    deleteAccountReplica: () => {},
    updateAccountReplica: () => {},
    createConfigurationLink: () => {}
  };
  let eaClient = {
    getExpertAdvisors: () => {},
    getExpertAdvisor: () => {},
    updateExpertAdvisor: () => {},
    uploadExpertAdvisorFile: () => {},
    deleteExpertAdvisor: () => {}
  };
  let metaApiWebsocketClient = {
    addSynchronizationListener: () => {},
    addReconnectListener: () => {},
    subscribe: () => {}
  };
  let connectionRegistry = {
    connectStreaming: () => {},
    removeStreaming: () => {},
    connectRpc: () => {},
    removeRpc: () => {},
    remove: () => {}
  };

  before(() => {
    api = new MetatraderAccountApi(client, metaApiWebsocketClient, connectionRegistry, eaClient, undefined, 'MetaApi');
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    getAccountStub = sandbox.stub(client, 'getAccount');
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {MetatraderAccountApi#getAccounts}
   */
  it('should retrieve MT accounts', async () => {
    sandbox.stub(client, 'getAccounts').resolves([{_id: 'id'}]);
    let accounts = await api.getAccounts({provisioningProfileId: 'profileId'});
    accounts.map(a => a.id).should.match(['id']);
    accounts.forEach(a => (a instanceof MetatraderAccount).should.be.true());
    sinon.assert.calledWithMatch(client.getAccounts, {provisioningProfileId: 'profileId'});
  });

  /**
   * @test {MetatraderAccountApi#getAccount}
   */
  it('should retrieve MT account by id', async () => {
    getAccountStub.resolves({
      _id: 'id',
      login: '50194988',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      connectionStatus: 'DISCONNECTED',
      state: 'DEPLOYED',
      type: 'cloud',
      quoteStreamingIntervalInSeconds: 2.5,
      symbol: 'symbol',
      reliability: 'high',
      tags: ['tags'],
      metadata: 'metadata',
      resourceSlots: 1,
      copyFactoryResourceSlots: 1,
      region: 'region',
      manualTrades: false,
      slippage: 30,
      version: 4,
      hash: 12345,
      baseCurrency: 'USD',
      copyFactoryRoles: ['PROVIDER'],
      riskManagementApiEnabled: false,
      metastatsApiEnabled: false,
      connections: [{
        region: 'region',
        zone: 'zone',
        application: 'application'
      }],
      primaryReplica: true,
      userId: 'userId',
      primaryAccountId: 'primaryId',
      accountReplicas: [{
        _id: 'replica0'
      },
      {
        _id: 'replica1'
      }],
      accessToken: '2RUnoH1ldGbnEneCoqRTgI4QO1XOmVzbH5EVoQsA'
    });
    let account = await api.getAccount('id');
    account.id.should.equal('id');
    account.login.should.equal('50194988');
    account.name.should.equal('mt5a');
    account.server.should.equal('ICMarketsSC-Demo');
    account.provisioningProfileId.should.equal('f9ce1f12-e720-4b9a-9477-c2d4cb25f076');
    account.magic.should.equal(123456);
    account.connectionStatus.should.equal('DISCONNECTED');
    account.state.should.equal('DEPLOYED');
    account.type.should.equal('cloud');
    account.quoteStreamingIntervalInSeconds.should.equal(2.5);
    account.symbol.should.equal('symbol');
    account.reliability.should.equal('high');
    account.tags.should.deepEqual(['tags']);
    account.metadata.should.equal('metadata');
    account.resourceSlots.should.equal(1);
    account.copyFactoryResourceSlots.should.equal(1);
    account.region.should.equal('region');
    account.manualTrades.should.equal(false);
    account.slippage.should.equal(30);
    account.version.should.equal(4);
    account.hash.should.equal(12345);
    account.baseCurrency.should.equal('USD');
    account.copyFactoryRoles.should.deepEqual(['PROVIDER']);
    account.riskManagementApiEnabled.should.equal(false);
    account.metastatsApiEnabled.should.equal(false);
    account.connections.should.deepEqual([{
      region: 'region',
      zone: 'zone',
      application: 'application'
    }]);
    account.primaryReplica.should.equal(true);
    account.userId.should.equal('userId');
    account.primaryAccountId.should.equal('primaryId');
    account.replicas.forEach((replica, id) => replica._data.should.deepEqual({_id: `replica${id}`}));
    account.accessToken.should.equal('2RUnoH1ldGbnEneCoqRTgI4QO1XOmVzbH5EVoQsA');
    (account instanceof MetatraderAccount).should.be.true();
    sinon.assert.calledWith(client.getAccount, 'id');
  });

  /**
   * @test {MetatraderAccountApi#getAccountByToken}
   */
  it('should retrieve MT account by token', async () => {
    sandbox.stub(client, 'getAccountByToken').resolves({
      _id: 'id',
      login: '50194988',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      connectionStatus: 'DISCONNECTED',
      state: 'DEPLOYED',
      type: 'cloud',
      quoteStreamingIntervalInSeconds: 2.5,
      symbol: 'symbol',
      reliability: 'high',
      tags: ['tags'],
      metadata: 'metadata',
      resourceSlots: 1,
      copyFactoryResourceSlots: 1,
      region: 'region',
      manualTrades: false,
      slippage: 30,
      version: 4,
      hash: 12345,
      baseCurrency: 'USD',
      copyFactoryRoles: ['PROVIDER'],
      riskManagementApiEnabled: false,
      metastatsApiEnabled: false,
      connections: [{
        region: 'region',
        zone: 'zone',
        application: 'application'
      }],
      primaryReplica: true,
      userId: 'userId',
      accountReplicas: [{
        _id: 'replica0'
      },
      {
        _id: 'replica1'
      }],
      accessToken: '2RUnoH1ldGbnEneCoqRTgI4QO1XOmVzbH5EVoQsA'
    });
    let account = await api.getAccountByToken();
    account.id.should.equal('id');
    account.login.should.equal('50194988');
    account.name.should.equal('mt5a');
    account.server.should.equal('ICMarketsSC-Demo');
    account.provisioningProfileId.should.equal('f9ce1f12-e720-4b9a-9477-c2d4cb25f076');
    account.magic.should.equal(123456);
    account.connectionStatus.should.equal('DISCONNECTED');
    account.state.should.equal('DEPLOYED');
    account.type.should.equal('cloud');
    account.quoteStreamingIntervalInSeconds.should.equal(2.5);
    account.symbol.should.equal('symbol');
    account.reliability.should.equal('high');
    account.tags.should.deepEqual(['tags']);
    account.metadata.should.equal('metadata');
    account.resourceSlots.should.equal(1);
    account.copyFactoryResourceSlots.should.equal(1);
    account.region.should.equal('region');
    account.manualTrades.should.equal(false);
    account.slippage.should.equal(30);
    account.version.should.equal(4);
    account.hash.should.equal(12345);
    account.baseCurrency.should.equal('USD');
    account.copyFactoryRoles.should.deepEqual(['PROVIDER']);
    account.riskManagementApiEnabled.should.equal(false);
    account.metastatsApiEnabled.should.equal(false);
    account.connections.should.deepEqual([{
      region: 'region',
      zone: 'zone',
      application: 'application'
    }]);
    account.primaryReplica.should.equal(true);
    account.userId.should.equal('userId');
    account.replicas.forEach((replica, id) => replica._data.should.deepEqual({_id: `replica${id}`}));
    account.accessToken.should.equal('2RUnoH1ldGbnEneCoqRTgI4QO1XOmVzbH5EVoQsA');
    (account instanceof MetatraderAccount).should.be.true();
    sinon.assert.calledWith(client.getAccountByToken);
  });

  /**
   * @test {MetatraderAccountApi#createAccount}
   */
  it('should create MT account', async () => {
    sandbox.stub(client, 'createAccount').resolves({id: 'id'});
    getAccountStub.resolves({
      _id: 'id',
      login: '50194988',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      connectionStatus: 'DISCONNECTED',
      state: 'DEPLOYED',
      type: 'cloud',
      accessToken: '2RUnoH1ldGbnEneCoqRTgI4QO1XOmVzbH5EVoQsA'
    });
    let newAccountData = {
      login: '50194988',
      password: 'Test1234',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      type: 'cloud',
      accessToken: 'NyV5no9TMffJyUts2FjI80wly0so3rVCz4xOqiDx'
    };
    let account = await api.createAccount(newAccountData);
    account.id.should.equal('id');
    account.login.should.equal('50194988');
    account.name.should.equal('mt5a');
    account.server.should.equal('ICMarketsSC-Demo');
    account.provisioningProfileId.should.equal('f9ce1f12-e720-4b9a-9477-c2d4cb25f076');
    account.magic.should.equal(123456);
    account.connectionStatus.should.equal('DISCONNECTED');
    account.state.should.equal('DEPLOYED');
    account.type.should.equal('cloud');
    account.accessToken.should.equal('2RUnoH1ldGbnEneCoqRTgI4QO1XOmVzbH5EVoQsA');
    (account instanceof MetatraderAccount).should.be.true();
    sinon.assert.calledWith(client.createAccount, newAccountData);
    sinon.assert.calledWith(client.getAccount, 'id');
  });

  /**
   * @test {MetatraderAccountApi#createConfigurationLink}
   */
  it('should create configuration link', async () => {
    sandbox.stub(client, 'createConfigurationLink').resolves({configurationLink: 'configurationLink'});
    let draftAccount = {
      _id: 'id',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      application: 'MetaApi',
      connectionStatus: 'DISCONNECTED',
      state: 'DRAFT',
      type: 'cloud'
    };
    getAccountStub
      .resolves(draftAccount);
    let account = await api.getAccount('id');
    let response = await account.createConfigurationLink();
    response.configurationLink.should.equal('configurationLink');
    sinon.assert.calledWith(client.createConfigurationLink, 'id');
  });

  /**
   * @test {MetatraderAccountApi#createConfigurationLink}
   */
  it('should create configuration link with specified lifetime', async () => {
    sandbox.stub(client, 'createConfigurationLink').resolves({configurationLink: 'configurationLink'});
    let draftAccount = {
      _id: 'id',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      application: 'MetaApi',
      connectionStatus: 'DISCONNECTED',
      state: 'DRAFT',
      type: 'cloud'
    };
    getAccountStub
      .resolves(draftAccount);
    let account = await api.getAccount('id');
    let response = await account.createConfigurationLink(14);
    response.configurationLink.should.equal('configurationLink');
    sinon.assert.calledWith(client.createConfigurationLink, 'id', 14);
  });

  /**
   * @test {MetatraderAccount#reload}
   */
  it('should reload MT account', async () => {
    getAccountStub
      .onFirstCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYING',
        type: 'cloud'
      })
      .onSecondCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DEPLOYED',
        type: 'cloud'
      });
    let account = await api.getAccount('id');
    await account.reload();
    account.connectionStatus.should.equal('CONNECTED');
    account.state.should.equal('DEPLOYED');
    sinon.assert.calledWith(client.getAccount, 'id');
    sinon.assert.calledTwice(client.getAccount);
  });

  /**
   * @test {MetatraderAccount#remove}
   */
  it('should remove MT account', async () => {
    sandbox.stub(connectionRegistry, 'remove').resolves();
    getAccountStub
      .onFirstCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DEPLOYED',
        type: 'cloud'
      })
      .onSecondCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DELETING',
        type: 'cloud'
      });
    sandbox.stub(client, 'deleteAccount').resolves();
    sandbox.stub(HistoryDatabase.prototype, 'clear').returns();
    let account = await api.getAccount('id');
    await account.remove();
    sinon.assert.calledWith(connectionRegistry.remove, 'id');
    sinon.assert.calledWith(HistoryDatabase.prototype.clear, 'id', 'MetaApi');
    account.state.should.equal('DELETING');
    sinon.assert.calledWith(client.deleteAccount, 'id');
    sinon.assert.calledWith(client.getAccount, 'id');
    sinon.assert.calledTwice(client.getAccount);
  });

  /**
   * @test {MetatraderAccount#deploy}
   */
  it('should deploy MT account', async () => {
    getAccountStub
      .onFirstCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'UNDEPLOYED',
        type: 'cloud'
      })
      .onSecondCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DEPLOYING',
        type: 'cloud'
      });
    sandbox.stub(client, 'deployAccount').resolves();
    let account = await api.getAccount('id');
    await account.deploy();
    account.state.should.equal('DEPLOYING');
    sinon.assert.calledWith(client.deployAccount, 'id');
    sinon.assert.calledWith(client.getAccount, 'id');
    sinon.assert.calledTwice(client.getAccount);
  });

  /**
   * @test {MetatraderAccount#undeploy}
   */
  it('should undeploy MT account', async () => {
    sandbox.stub(connectionRegistry, 'remove').resolves();
    getAccountStub
      .onFirstCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYED',
        type: 'cloud'
      })
      .onSecondCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'UNDEPLOYING',
        type: 'cloud'
      });
    sandbox.stub(client, 'undeployAccount').resolves();
    let account = await api.getAccount('id');
    await account.undeploy();
    sinon.assert.calledWith(connectionRegistry.remove, 'id');
    account.state.should.equal('UNDEPLOYING');
    sinon.assert.calledWith(client.undeployAccount, 'id');
    sinon.assert.calledWith(client.getAccount, 'id');
    sinon.assert.calledTwice(client.getAccount);
  });

  /**
   * @test {MetatraderAccount#redeploy}
   */
  it('should redeploy MT account', async () => {
    getAccountStub
      .onFirstCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYED',
        type: 'cloud'
      })
      .onSecondCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'UNDEPLOYING',
        type: 'cloud'
      });
    sandbox.stub(client, 'redeployAccount').resolves();
    let account = await api.getAccount('id');
    await account.redeploy();
    account.state.should.equal('UNDEPLOYING');
    sinon.assert.calledWith(client.redeployAccount, 'id');
    sinon.assert.calledWith(client.getAccount, 'id');
    sinon.assert.calledTwice(client.getAccount);
  });

  /**
   * @test {MetatraderAccount#increaseReliability}
   */
  it('should increase MT account reliability', async () => {
    getAccountStub
      .onFirstCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYED',
        type: 'cloud'
      })
      .onSecondCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'UNDEPLOYING',
        type: 'cloud',
        reliability: 'high'
      });
    sandbox.stub(client, 'increaseReliability').resolves();
    let account = await api.getAccount('id');
    await account.increaseReliability();
    account.reliability.should.equal('high');
    sinon.assert.calledWith(client.increaseReliability, 'id');
    sinon.assert.calledWith(client.getAccount, 'id');
    sinon.assert.calledTwice(client.getAccount);
  });

  /**
   * @test {MetatraderAccount#enableRiskManagementApi}
   */
  it('should enable account risk management api', async () => {
    getAccountStub
      .onFirstCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYED',
        type: 'cloud'
      })
      .onSecondCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'UNDEPLOYING',
        type: 'cloud',
        riskManagementApiEnabled: true
      });
    sandbox.stub(client, 'enableRiskManagementApi').resolves();
    let account = await api.getAccount('id');
    await account.enableRiskManagementApi();
    account.riskManagementApiEnabled.should.be.true();
    sinon.assert.calledWith(client.enableRiskManagementApi, 'id');
    sinon.assert.calledWith(client.getAccount, 'id');
    sinon.assert.calledTwice(client.getAccount);
  });

  /**
   * @test {MetatraderAccount#enableMetaStatsApi}
   */
  it('should enable account MetaStats API', async () => {
    getAccountStub
      .onFirstCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYED',
        type: 'cloud'
      })
      .onSecondCall().resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'UNDEPLOYING',
        type: 'cloud',
        metastatsApiEnabled: true
      });
    sandbox.stub(client, 'enableMetaStatsApi').resolves();
    let account = await api.getAccount('id');
    await account.enableMetaStatsApi();
    account.metastatsApiEnabled.should.be.true();
    sinon.assert.calledWith(client.enableMetaStatsApi, 'id');
    sinon.assert.calledWith(client.getAccount, 'id');
    sinon.assert.calledTwice(client.getAccount);
  });

  describe('MetatraderAccount.waitDeployed', () => {

    /**
     * @test {MetatraderAccount#waitDeployed}
     */
    it('should wait for deployment', async () => {
      let deployingAccount = {
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYING',
        type: 'cloud'
      };
      getAccountStub
        .onFirstCall().resolves(deployingAccount)
        .onSecondCall().resolves(deployingAccount)
        .onThirdCall().resolves({
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud'
        });
      let account = await api.getAccount('id');
      await account.waitDeployed(1, 50);
      account.state.should.equal('DEPLOYED');
      sinon.assert.calledWith(client.getAccount, 'id');
      sinon.assert.calledThrice(client.getAccount);
    });

    /**
     * @test {MetatraderAccount#waitDeployed}
     */
    it('should time out waiting for deployment', async () => {
      let deployingAccount = {
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYING',
        type: 'cloud'
      };
      getAccountStub
        .resolves(deployingAccount);
      let account = await api.getAccount('id');
      try {
        await account.waitDeployed(1, 50);
        throw new Error('TimeoutError is expected');
      } catch (err) {
        err.name.should.equal('TimeoutError');
        account.state.should.equal('DEPLOYING');
      }
      sinon.assert.calledWith(client.getAccount, 'id');
    });

  });

  describe('MetatraderAccount.waitUndeployed', () => {

    /**
     * @test {MetatraderAccount#waitUndeployed}
     */
    it('should wait for undeployment', async () => {
      let undeployingAccount = {
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'UNDEPLOYING',
        type: 'cloud'
      };
      getAccountStub
        .onFirstCall().resolves(undeployingAccount)
        .onSecondCall().resolves(undeployingAccount)
        .onThirdCall().resolves({
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'UNDEPLOYED',
          type: 'cloud'
        });
      let account = await api.getAccount('id');
      await account.waitUndeployed(1, 50);
      account.state.should.equal('UNDEPLOYED');
      sinon.assert.calledWith(client.getAccount, 'id');
      sinon.assert.calledThrice(client.getAccount);
    });

    /**
     * @test {MetatraderAccount#waitUndeployed}
     */
    it('should time out waiting for undeployment', async () => {
      let undeployingAccount = {
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'UNDEPLOYING',
        type: 'cloud'
      };
      getAccountStub
        .resolves(undeployingAccount);
      let account = await api.getAccount('id');
      try {
        await account.waitUndeployed(1, 50);
        throw new Error('TimeoutError is expected');
      } catch (err) {
        err.name.should.equal('TimeoutError');
        account.state.should.equal('UNDEPLOYING');
      }
      sinon.assert.calledWith(client.getAccount, 'id');
    });

  });

  describe('MetatraderAccount.waitRemoved', () => {

    /**
     * @test {MetatraderAccount#waitRemoved}
     */
    it('should wait until removed', async () => {
      let deletingAccount = {
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DELETING',
        type: 'cloud'
      };
      getAccountStub
        .onFirstCall().resolves(deletingAccount)
        .onSecondCall().resolves(deletingAccount)
        .onThirdCall().throws(new NotFoundError());
      let account = await api.getAccount('id');
      await account.waitRemoved(1, 50);
      sinon.assert.calledWith(client.getAccount, 'id');
      sinon.assert.calledThrice(client.getAccount);
    });

    /**
     * @test {MetatraderAccount#waitRemoved}
     */
    it('should time out waiting until removed', async () => {
      let deletingAccount = {
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DELETING',
        type: 'cloud'
      };
      getAccountStub
        .resolves(deletingAccount);
      let account = await api.getAccount('id');
      try {
        await account.waitRemoved(1, 50);
        throw new Error('TimeoutError is expected');
      } catch (err) {
        err.name.should.equal('TimeoutError');
      }
      sinon.assert.calledWith(client.getAccount, 'id');
    });

  });

  describe('MetatraderAccount.waitConnected', () => {

    /**
     * @test {MetatraderAccount#waitConnected}
     */
    it('should wait until broker connection', async () => {
      let disconnectedAccount = {
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYED',
        type: 'cloud'
      };
      getAccountStub
        .onFirstCall().resolves(disconnectedAccount)
        .onSecondCall().resolves(disconnectedAccount)
        .onThirdCall().resolves({
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud'
        });
      let account = await api.getAccount('id');
      await account.waitConnected(1, 50);
      account.connectionStatus.should.equal('CONNECTED');
      sinon.assert.calledWith(client.getAccount, 'id');
      sinon.assert.calledThrice(client.getAccount);
    });

    /**
     * @test {MetatraderAccount#waitConnected}
     */
    it('should time out waiting for broker connection', async () => {
      let disconnectedAccount = {
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYED',
        type: 'cloud'
      };
      getAccountStub
        .resolves(disconnectedAccount);
      let account = await api.getAccount('id');
      try {
        await account.waitConnected(1, 50);
        throw new Error('TimeoutError is expected');
      } catch (err) {
        err.name.should.equal('TimeoutError');
        account.connectionStatus.should.equal('DISCONNECTED');
      }
      sinon.assert.calledWith(client.getAccount, 'id');
    });

    /**
     * @test {MetatraderAccount#waitConnected}
     */
    it('should pass for primary account if replica is connected', async () => {
      let disconnectedAccount = {
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'UNDEPLOYED',
        type: 'cloud',
        accountReplicas: [{
          _id: 'idReplica',
          state: 'DEPLOYED',
          magic: 0,
          connectionStatus: 'DISCONNECTED',
          symbol: 'EURUSD',
          reliability: 'regular',
          region: 'london'
        }]
      };
      getAccountStub.resolves(disconnectedAccount).onFirstCall().resolves(disconnectedAccount)
        .onSecondCall().resolves(disconnectedAccount)
        .onThirdCall().resolves({
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'DISCONNECTED',
          state: 'UNDEPLOYED',
          type: 'cloud',
          accountReplicas: [{
            _id: 'idReplica',
            state: 'DEPLOYED',
            magic: 0,
            connectionStatus: 'CONNECTED',
            symbol: 'EURUSD',
            reliability: 'regular',
            region: 'london'
          }]
        });
      let account = await api.getAccount('id');
      await account.waitConnected(1, 50);
      const replica = account.replicas[0];
      replica.connectionStatus.should.equal('CONNECTED');
      sinon.assert.calledWith(client.getAccount, 'id');
      sinon.assert.calledThrice(client.getAccount);
    });

  });

  /**
   * @test {MetatraderAccount#connect}
   */
  it('should connect to an MT terminal', async () => {
    sandbox.stub(metaApiWebsocketClient, 'addSynchronizationListener').returns();
    sandbox.stub(metaApiWebsocketClient, 'subscribe').resolves();
    getAccountStub.resolves({_id: 'id'});
    let account = await api.getAccount();
    let storage = {
      lastHistoryOrderTime: () => new Date('2020-01-01T00:00:00.000Z'),
      lastDealTime: () => new Date('2020-01-02T00:00:00.000Z'),
      loadDataFromDisk: () => ({deals: [], historyOrders: []})
    };
    sandbox.spy(connectionRegistry, 'connectStreaming');
    let connection = account.getStreamingConnection(storage);
    sinon.assert.calledWith(connectionRegistry.connectStreaming, account, storage);
  });

  /**
   * @test {MetatraderAccount#getStreamingConnection}
   */
  it('should connect to an MT terminal if in specified region', async () => {
    sandbox.stub(metaApiWebsocketClient, 'addSynchronizationListener').returns();
    sandbox.stub(metaApiWebsocketClient, 'subscribe').resolves();
    metaApiWebsocketClient.region = 'vint-hill';
    getAccountStub.resolves({_id: 'id', region: 'vint-hill'});
    let account = await api.getAccount();
    let storage = {
      lastHistoryOrderTime: () => new Date('2020-01-01T00:00:00.000Z'),
      lastDealTime: () => new Date('2020-01-02T00:00:00.000Z'),
      loadDataFromDisk: () => ({deals: [], historyOrders: []})
    };
    sandbox.spy(connectionRegistry, 'connectStreaming');
    let connection = account.getStreamingConnection(storage);
    sinon.assert.calledWith(connectionRegistry.connectStreaming, account, storage);
  });

  /**
   * @test {MetatraderAccount#getStreamingConnection}
   */
  it('should not connect to an MT terminal if in different region', async () => {
    sandbox.stub(metaApiWebsocketClient, 'addSynchronizationListener').returns();
    sandbox.stub(metaApiWebsocketClient, 'subscribe').resolves();
    metaApiWebsocketClient.region = 'vint-hill';
    getAccountStub.resolves({_id: 'id', region: 'new-york'});
    let account = await api.getAccount();
    let storage = {
      lastHistoryOrderTime: () => new Date('2020-01-01T00:00:00.000Z'),
      lastDealTime: () => new Date('2020-01-02T00:00:00.000Z'),
      loadDataFromDisk: () => ({deals: [], historyOrders: []})
    };
    try {
      let connection = account.getStreamingConnection(storage);
      throw new Error('Validation error expected');
    } catch (error) {
      error.message.should.equal('Account id is not on specified region vint-hill');
    }
  });

  /**
   * @test {MetatraderAccount#getRPCConnection}
   */
  it('should create RPC connection', async () => {
    sandbox.stub(metaApiWebsocketClient, 'addSynchronizationListener').returns();
    sandbox.stub(metaApiWebsocketClient, 'subscribe').resolves();
    metaApiWebsocketClient.region = 'vint-hill';
    getAccountStub.resolves({_id: 'id', region: 'vint-hill'});
    let account = await api.getAccount();
    sandbox.spy(connectionRegistry, 'connectRpc');
    account.getRPCConnection();
  });

  /**
   * @test {MetatraderAccount#getRPCConnection}
   */
  it('should create RPC connection if in specified region', async () => {
    sandbox.stub(metaApiWebsocketClient, 'addSynchronizationListener').returns();
    sandbox.stub(metaApiWebsocketClient, 'subscribe').resolves();
    metaApiWebsocketClient.region = 'vint-hill';
    getAccountStub.resolves({_id: 'id', region: 'vint-hill'});
    let account = await api.getAccount();
    sandbox.spy(connectionRegistry, 'connectRpc');
    account.getRPCConnection();
  });

  /**
   * @test {MetatraderAccount#getRPCConnection}
   */
  it('should not create RPC connection if in different region', async () => {
    sandbox.stub(metaApiWebsocketClient, 'addSynchronizationListener').returns();
    sandbox.stub(metaApiWebsocketClient, 'subscribe').resolves();
    metaApiWebsocketClient.region = 'vint-hill';
    getAccountStub.resolves({_id: 'id', region: 'new-york'});
    let account = await api.getAccount();
    sandbox.spy(connectionRegistry, 'connectRpc');
    
    try {
      account.getRPCConnection();
      throw new Error('Validation error expected');
    } catch (error) {
      error.message.should.equal('Account id is not on specified region vint-hill');
    }
  });

  /**
   * @test {MetatraderAccount#update}
   */
  it('should update MT account', async () => {
    getAccountStub
      .onFirstCall()
      .resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DEPLOYED',
        type: 'cloud'
      })
      .onSecondCall()
      .resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a__',
        server: 'OtherMarkets-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DEPLOYED',
        type: 'cloud'
      });
    sandbox.stub(client, 'updateAccount').resolves();
    let account = await api.getAccount('id');
    await account.update({
      name: 'mt5a__',
      password: 'moreSecurePass',
      server: 'OtherMarkets-Demo'
    });
    account.name.should.equal('mt5a__');
    account.server.should.equal('OtherMarkets-Demo');
    sinon.assert.calledWith(client.updateAccount, 'id', {
      name: 'mt5a__',
      password: 'moreSecurePass',
      server: 'OtherMarkets-Demo'
    });
    sinon.assert.calledWith(client.getAccount, 'id');
    sinon.assert.calledTwice(client.getAccount);
  });

  /**
   * @test {MetatraderAccount#getExpertAdvisors}
   */
  it('should retrieve expert advisors', async () => {
    getAccountStub.resolves({_id: 'id', version: 4, type: 'cloud-g1'});
    sandbox.stub(eaClient, 'getExpertAdvisors').resolves([{expertId: 'ea'}]);
    const account = await api.getAccount();
    const experts = await account.getExpertAdvisors();
    experts.map(e => e.expertId).should.match(['ea']);
    experts.forEach(e => (e instanceof ExpertAdvisor).should.be.true());
    sinon.assert.calledWithMatch(eaClient.getExpertAdvisors, 'id');
  });

  /**
   * @test {MetatraderAccount#getExpertAdvisor}
   */
  it('should retrieve expert advisor by expert id', async () => {
    getAccountStub.resolves({_id: 'id', version: 4, type: 'cloud-g1'});
    sandbox.stub(eaClient, 'getExpertAdvisor').resolves({
      expertId: 'ea',
      period: '1H',
      symbol: 'EURUSD',
      fileUploaded: false
    });
    const account = await api.getAccount('id');
    const expert = await account.getExpertAdvisor('ea');
    expert.expertId.should.match('ea');
    expert.period.should.match('1H');
    expert.symbol.should.match('EURUSD');
    expert.fileUploaded.should.be.false();
    (expert instanceof ExpertAdvisor).should.be.true();
    sinon.assert.calledWithMatch(eaClient.getExpertAdvisor, 'id', 'ea');
  });

  /**
   * @test {MetatraderAccount#getExpertAdvisor}
   */
  it('should validate account version', async () => {
    getAccountStub.resolves({_id: 'id', version: 5, type: 'cloud-g1'});
    sandbox.stub(eaClient, 'getExpertAdvisors').resolves([{
      expertId: 'ea',
      period: '1H',
      symbol: 'EURUSD',
      fileUploaded: false
    }]);
    sandbox.stub(eaClient, 'getExpertAdvisor').resolves({
      expertId: 'ea',
      period: '1H',
      symbol: 'EURUSD',
      fileUploaded: false
    });
    sandbox.stub(eaClient, 'updateExpertAdvisor').resolves();
    let newExpertAdvisor = {
      period: '1H',
      symbol: 'EURUSD',
      preset: 'preset'
    };
    const account = await api.getAccount('id');
    await should(account.getExpertAdvisors()).rejected();
    await should(account.getExpertAdvisor('ea')).rejected();
    await should(account.createExpertAdvisor('ea', newExpertAdvisor)).rejected();
  });

  /**
   * @test {MetatraderAccount#getExpertAdvisor}
   */
  it('should validate account type', async () => {
    getAccountStub.resolves({_id: 'id', version: 4, type: 'cloud-g2'});
    sandbox.stub(eaClient, 'getExpertAdvisors').resolves([{
      expertId: 'ea',
      period: '1H',
      symbol: 'EURUSD',
      fileUploaded: false
    }]);
    sandbox.stub(eaClient, 'getExpertAdvisor').resolves({
      expertId: 'ea',
      period: '1H',
      symbol: 'EURUSD',
      fileUploaded: false
    });
    sandbox.stub(eaClient, 'updateExpertAdvisor').resolves();
    let newExpertAdvisor = {
      period: '1H',
      symbol: 'EURUSD',
      preset: 'preset'
    };
    const account = await api.getAccount('id');
    await should(account.getExpertAdvisors()).rejected();
    await should(account.getExpertAdvisor('ea')).rejected();
    await should(account.createExpertAdvisor('ea', newExpertAdvisor)).rejected();
  });

  /**
   * @test {MetatraderAccount#createExpertAdvisor}
   */
  it('should create expert advisor', async () => {
    getAccountStub.resolves({_id: 'id', version: 4, type: 'cloud-g1'});
    sandbox.stub(eaClient, 'updateExpertAdvisor').resolves();
    sandbox.stub(eaClient, 'getExpertAdvisor').resolves({
      expertId: 'ea',
      period: '1H',
      symbol: 'EURUSD',
      fileUploaded: false
    });
    let newExpertAdvisor = {
      period: '1H',
      symbol: 'EURUSD',
      preset: 'preset'
    };
    const account = await api.getAccount('id');
    const expert = await account.createExpertAdvisor('ea', newExpertAdvisor);
    expert.expertId.should.match('ea');
    expert.period.should.match('1H');
    expert.symbol.should.match('EURUSD');
    expert.fileUploaded.should.be.false();
    (expert instanceof ExpertAdvisor).should.be.true();
    sinon.assert.calledWith(eaClient.updateExpertAdvisor, 'id', 'ea', newExpertAdvisor);
    sinon.assert.calledWith(eaClient.getExpertAdvisor, 'id', 'ea');
  });

  /**
   * @test {ExpertAdvisor#reload}
   */
  it('should reload expert advisor', async () => {
    getAccountStub.resolves({_id: 'id', version: 4, type: 'cloud-g1'});
    sandbox.stub(eaClient, 'getExpertAdvisor')
      .onFirstCall().resolves({
        expertId: 'ea',
        period: '1H',
        symbol: 'EURUSD',
        fileUploaded: false
      })
      .onSecondCall().resolves({
        expertId: 'ea',
        period: '4H',
        symbol: 'EURUSD',
        fileUploaded: false
      });
    const account = await api.getAccount('id');
    const expert = await account.getExpertAdvisor('ea');
    await expert.reload();
    expert.period.should.eql('4H');
    sinon.assert.calledWith(eaClient.getExpertAdvisor, 'id', 'ea');
    sinon.assert.calledTwice(eaClient.getExpertAdvisor);
  });

  /**
   * @test {ExpertAdvisor#update}
   */
  it('should update expert advisor', async () => {
    getAccountStub.resolves({_id: 'id', version: 4, type: 'cloud-g1'});
    sandbox.stub(eaClient, 'getExpertAdvisor')
      .onFirstCall().resolves({
        expertId: 'ea',
        period: '1H',
        symbol: 'EURUSD',
        fileUploaded: false
      })
      .onSecondCall().resolves({
        expertId: 'ea',
        period: '4H',
        symbol: 'EURUSD',
        fileUploaded: false
      });
    let newExpertAdvisor = {
      period: '4H',
      symbol: 'EURUSD',
      preset: 'preset'
    };
    sandbox.stub(eaClient, 'updateExpertAdvisor').resolves();
    const account = await api.getAccount('id');
    const expert = await account.getExpertAdvisor('ea');
    await expert.update(newExpertAdvisor);
    expert.period.should.eql('4H');
    sinon.assert.calledWith(eaClient.updateExpertAdvisor, 'id', 'ea', newExpertAdvisor);
    sinon.assert.calledTwice(eaClient.getExpertAdvisor);
    sinon.assert.calledWith(eaClient.getExpertAdvisor, 'id', 'ea');
  });

  /**
   * @test {ExpertAdvisor#uploadFile}
   */
  it('should upload expert advisor file', async () => {
    getAccountStub.resolves({_id: 'id', version: 4, type: 'cloud-g1'});
    sandbox.stub(eaClient, 'getExpertAdvisor')
      .onFirstCall().resolves({
        expertId: 'ea',
        period: '1H',
        symbol: 'EURUSD',
        fileUploaded: false
      })
      .onSecondCall().resolves({
        expertId: 'ea',
        period: '4H',
        symbol: 'EURUSD',
        fileUploaded: true
      });
    sandbox.stub(eaClient, 'uploadExpertAdvisorFile').resolves();
    const account = await api.getAccount('id');
    const expert = await account.getExpertAdvisor('ea');
    await expert.uploadFile('/path/to/file');
    expert.fileUploaded.should.be.true();
    sinon.assert.calledWith(eaClient.uploadExpertAdvisorFile, 'id', 'ea', '/path/to/file');
    sinon.assert.calledTwice(eaClient.getExpertAdvisor);
    sinon.assert.calledWith(eaClient.getExpertAdvisor, 'id', 'ea');
  });

  /**
   * @test {ExpertAdvisor#remove}
   */
  it('should remove expert advisor', async () => {
    getAccountStub.resolves({_id: 'id', version: 4, type: 'cloud-g1'});
    sandbox.stub(eaClient, 'getExpertAdvisor').resolves({
      expertId: 'ea',
      period: '1H',
      symbol: 'EURUSD',
      fileUploaded: false
    });
    sandbox.stub(eaClient, 'deleteExpertAdvisor').resolves({_id: 'id'});
    const account = await api.getAccount('id');
    const expert = await account.getExpertAdvisor('ea');
    await expert.remove();
    sinon.assert.calledWith(eaClient.deleteExpertAdvisor, 'id', 'ea');
  });

  describe('MT account replica', () => {

    beforeEach(async () =>{
      getAccountStub.resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DEPLOYED',
        type: 'cloud',
        accountReplicas: [{
          _id: 'idReplica',
          state: 'CREATED',
          magic: 0,
          connectionStatus: 'CONNECTED',
          symbol: 'EURUSD',
          reliability: 'regular',
          region: 'london'
        }]
      });
    });

    /**
     * @test {MetatraderAccount#createReplica}
     */
    it('should create MT account replica', async () => {
      getAccountStub
        .onFirstCall()
        .resolves({
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud'
        })
        .onSecondCall()
        .resolves({
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud',
          accountReplicas: [{
            _id: 'idReplica',
            state: 'CREATED',
            magic: 0,
            connectionStatus: 'CONNECTED',
            symbol: 'EURUSD',
            reliability: 'regular',
            region: 'london'
          }]
        });
      sandbox.stub(client, 'createAccountReplica').resolves();
      let account = await api.getAccount('id');
      const replica = await account.createReplica({
        magic: 0,
        symbol: 'EURUSD',
        reliability: 'regular',
        region: 'london'
      });
      replica.id.should.equal('idReplica');
      replica.state.should.equal('CREATED');
      replica.magic.should.equal(0);
      replica.connectionStatus.should.equal('CONNECTED');
      replica.reliability.should.equal('regular');
      replica.region.should.equal('london');
      sinon.assert.calledWith(client.createAccountReplica, 'id', {
        magic: 0,
        symbol: 'EURUSD',
        reliability: 'regular',
        region: 'london'
      });
      sinon.assert.calledWith(client.getAccount, 'id');
      sinon.assert.calledTwice(client.getAccount);
    });

    /**
     * @test {MetatraderAccount#getAccountReplica}
     */
    it('should retrieve MT account replica by id', async () => {
      sandbox.stub(client, 'getAccountReplica').resolves({
        _id: 'id',
        state: 'DEPLOYED',
        magic: 123456,
        connectionStatus: 'DISCONNECTED',
        quoteStreamingIntervalInSeconds: 2.5,
        symbol: 'symbol',
        reliability: 'high',
        tags: ['tags'],
        metadata: 'metadata',
        resourceSlots: 1,
        copyFactoryResourceSlots: 1,
        region: 'region',
        primaryAccount: {
          _id: 'id',
          primaryReplica: true
        }
      });
      let replica = await api.getAccountReplica();
      replica.id.should.equal('id');
      replica.magic.should.equal(123456);
      replica.connectionStatus.should.equal('DISCONNECTED');
      replica.state.should.equal('DEPLOYED');
      replica.quoteStreamingIntervalInSeconds.should.equal(2.5);
      replica.symbol.should.equal('symbol');
      replica.reliability.should.equal('high');
      replica.tags.should.deepEqual(['tags']);
      replica.metadata.should.equal('metadata');
      replica.resourceSlots.should.equal(1);
      replica.copyFactoryResourceSlots.should.equal(1);
      replica.region.should.equal('region');
      replica.primaryAccountFromDto.should.deepEqual({
        _id: 'id',
        primaryReplica: true
      });
      (replica instanceof MetatraderAccountReplica).should.be.true();
      sinon.assert.calledWith(client.getAccountReplica);
    });

    /**
     * @test {MetatraderAccount#getAccountReplicas}
     */
    it('should retrieve MT account replicas', async () => {
      sandbox.stub(client, 'getAccountReplicas').resolves([{
        _id: 'id0',
        state: 'DEPLOYED',
        magic: 123456,
        connectionStatus: 'DISCONNECTED',
        quoteStreamingIntervalInSeconds: 2.5,
        symbol: 'symbol',
        reliability: 'high',
        tags: ['tags'],
        metadata: 'metadata',
        resourceSlots: 1,
        copyFactoryResourceSlots: 1,
        region: 'region',
        primaryAccount: {
          _id: 'id',
          primaryReplica: true
        }
      },
      {
        _id: 'id1',
        state: 'DEPLOYED',
        magic: 123456,
        connectionStatus: 'DISCONNECTED',
        quoteStreamingIntervalInSeconds: 2.5,
        symbol: 'symbol',
        reliability: 'high',
        tags: ['tags'],
        metadata: 'metadata',
        resourceSlots: 1,
        copyFactoryResourceSlots: 1,
        region: 'region',
        primaryAccount: {
          _id: 'id',
          primaryReplica: true
        }
      }]);
      let replicas = await api.getAccountReplicas();
      replicas.forEach((replica, id) => {
        replica.id.should.equal(`id${id}`);
        replica.magic.should.equal(123456);
        replica.connectionStatus.should.equal('DISCONNECTED');
        replica.state.should.equal('DEPLOYED');
        replica.quoteStreamingIntervalInSeconds.should.equal(2.5);
        replica.symbol.should.equal('symbol');
        replica.reliability.should.equal('high');
        replica.tags.should.deepEqual(['tags']);
        replica.metadata.should.equal('metadata');
        replica.resourceSlots.should.equal(1);
        replica.copyFactoryResourceSlots.should.equal(1);
        replica.region.should.equal('region');
        replica.primaryAccountFromDto.should.deepEqual({
          _id: 'id',
          primaryReplica: true
        });
        (replica instanceof MetatraderAccountReplica).should.be.true();
      });
      sinon.assert.calledWith(client.getAccountReplicas);
    });

    /**
     * @test {MetatraderAccountReplica#remove}
     */
    it('should remove MT account replica', async () => {
      const account = await api.getAccount('id');
      getAccountStub.resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DEPLOYED',
        type: 'cloud',
        accountReplicas: [{
          _id: 'idReplica',
          state: 'DELETING',
          magic: 0,
          connectionStatus: 'CONNECTED',
          symbol: 'EURUSD',
          reliability: 'regular',
          region: 'london'
        }]
      });
      sandbox.stub(client, 'deleteAccountReplica').resolves();
      const replica = account.replicas[0];
      await replica.remove();
      replica.state.should.equal('DELETING');
      sinon.assert.calledWith(client.deleteAccountReplica, 'id', 'idReplica');
      sinon.assert.calledWith(client.getAccount, 'id');
      sinon.assert.calledTwice(client.getAccount);
    });

    /**
     * @test {MetatraderAccountReplica#deploy}
     */
    it('should deploy MT account replica', async () => {
      const account = await api.getAccount('id');
      getAccountStub.resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DEPLOYED',
        type: 'cloud',
        accountReplicas: [{
          _id: 'idReplica',
          state: 'DEPLOYING',
          magic: 0,
          connectionStatus: 'CONNECTED',
          symbol: 'EURUSD',
          reliability: 'regular',
          region: 'london'
        }]
      });
      sandbox.stub(client, 'deployAccountReplica').resolves();
      const replica = account.replicas[0];
      await replica.deploy();
      replica.state.should.equal('DEPLOYING');
      sinon.assert.calledWith(client.deployAccountReplica, 'id', 'idReplica');
      sinon.assert.calledWith(client.getAccount, 'id');
      sinon.assert.calledTwice(client.getAccount);
    });

    /**
     * @test {MetatraderAccountReplica#undeploy}
     */
    it('should undeploy MT account replica', async () => {
      const account = await api.getAccount('id');
      getAccountStub.resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DEPLOYED',
        type: 'cloud',
        accountReplicas: [{
          _id: 'idReplica',
          state: 'UNDEPLOYING',
          magic: 0,
          connectionStatus: 'CONNECTED',
          symbol: 'EURUSD',
          reliability: 'regular',
          region: 'london'
        }]
      });
      sandbox.stub(client, 'undeployAccountReplica').resolves();
      const replica = account.replicas[0];
      await replica.undeploy();
      replica.state.should.equal('UNDEPLOYING');
      sinon.assert.calledWith(client.undeployAccountReplica, 'id', 'idReplica');
      sinon.assert.calledWith(client.getAccount, 'id');
      sinon.assert.calledTwice(client.getAccount);
    });

    /**
     * @test {MetatraderAccountReplica#redeploy}
     */
    it('should redeploy MT account replica', async () => {
      let account = await api.getAccount('id');
      getAccountStub.resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DEPLOYED',
        type: 'cloud',
        accountReplicas: [{
          _id: 'idReplica',
          state: 'UNDEPLOYING',
          magic: 0,
          connectionStatus: 'CONNECTED',
          symbol: 'EURUSD',
          reliability: 'regular',
          region: 'london'
        }]
      });

      sandbox.stub(client, 'redeployAccountReplica').resolves();
      const replica = account.replicas[0];
      await replica.redeploy();
      replica.state.should.equal('UNDEPLOYING');
      sinon.assert.calledWith(client.redeployAccountReplica, 'id', 'idReplica');
      sinon.assert.calledWith(client.getAccount, 'id');
      sinon.assert.calledTwice(client.getAccount);
    });

    /**
     * @test {MetatraderAccountReplica#update}
     */
    it('should update MT account replica', async () => {
      let account = await api.getAccount('id');
      getAccountStub.resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DEPLOYED',
        type: 'cloud',
        accountReplicas: [{
          _id: 'idReplica',
          state: 'DEPLOYED',
          magic: 12345,
          connectionStatus: 'CONNECTED',
          symbol: 'EURUSD',
          reliability: 'regular',
          region: 'london'
        }]
      });
      sandbox.stub(client, 'updateAccountReplica').resolves();
      const replica = account.replicas[0];
      await replica.update({
        magic: 12345,
      });
      replica.magic.should.equal(12345);
      sinon.assert.calledWith(client.updateAccountReplica, 'id', 'idReplica', {
        magic: 12345,
      });
      sinon.assert.calledWith(client.getAccount, 'id');
      sinon.assert.calledTwice(client.getAccount);
    });

    /**
     * @test {MetatraderAccountReplica#increaseReliability}
     */
    it('should increase MT account replica reliability', async () => {
      let account = await api.getAccount('id');
      getAccountStub.resolves({
        _id: 'id',
        login: '50194988',
        name: 'mt5a',
        server: 'ICMarketsSC-Demo',
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
        magic: 123456,
        application: 'MetaApi',
        connectionStatus: 'CONNECTED',
        state: 'DEPLOYED',
        type: 'cloud',
        accountReplicas: [{
          _id: 'idReplica',
          state: 'DEPLOYING',
          magic: 0,
          connectionStatus: 'DISCONNECTED',
          symbol: 'EURUSD',
          reliability: 'high',
          region: 'london'
        }]
      });

      sandbox.stub(client, 'increaseReliability').resolves();
      const replica = account.replicas[0];
      await replica.increaseReliability();
      replica.reliability.should.equal('high');
      sinon.assert.calledWith(client.increaseReliability, 'idReplica');
      sinon.assert.calledWith(client.getAccount, 'id');
      sinon.assert.calledTwice(client.getAccount);
    });

    describe('MetatraderAccountReplica.waitDeployed', () => {

      let startAccount;

      beforeEach(async () => {
        startAccount = {
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud',
          accountReplicas: [{
            _id: 'idReplica',
            state: 'DEPLOYING',
            magic: 0,
            connectionStatus: 'CONNECTED',
            symbol: 'EURUSD',
            reliability: 'regular',
            region: 'london'
          }]
        };

        getAccountStub.resolves(startAccount);
      });

      /**
       * @test {MetatraderAccountReplica#waitDeployed}
       */
      it('should wait for deployment', async () => {
        const updatedAccount = {
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud',
          accountReplicas: [{
            _id: 'idReplica',
            state: 'DEPLOYED',
            magic: 0,
            connectionStatus: 'CONNECTED',
            symbol: 'EURUSD',
            reliability: 'regular',
            region: 'london'
          }]
        };
        getAccountStub
          .onFirstCall().resolves(startAccount)
          .onSecondCall().resolves(startAccount)
          .onThirdCall().resolves(updatedAccount);
        const account = await api.getAccount('id');
        const replica = account.replicas[0];
        await replica.waitDeployed(1, 50);
        replica.state.should.equal('DEPLOYED');
        sinon.assert.calledWith(client.getAccount, 'id');
        sinon.assert.calledThrice(client.getAccount);
      });
  
      /**
       * @test {MetatraderAccountReplica#waitDeployed}
       */
      it('should time out waiting for deployment', async () => {
        let account = await api.getAccount('id');
        const replica = account.replicas[0];
        try {
          await replica.waitDeployed(1, 50);
          throw new Error('TimeoutError is expected');
        } catch (err) {
          err.name.should.equal('TimeoutError');
          replica.state.should.equal('DEPLOYING');
        }
        sinon.assert.calledWith(client.getAccount, 'id');
      });
  
    });
  
    describe('MetatraderAccountReplica.waitUndeployed', () => {

      let startAccount;

      beforeEach(async () => {
        startAccount = {
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud',
          accountReplicas: [{
            _id: 'idReplica',
            state: 'UNDEPLOYING',
            magic: 0,
            connectionStatus: 'CONNECTED',
            symbol: 'EURUSD',
            reliability: 'regular',
            region: 'london'
          }]
        };

        getAccountStub.resolves(startAccount);
      });

      /**
       * @test {MetatraderAccountReplica#waitUndeployed}
       */
      it('should wait for undeployment', async () => {
        const updatedAccount = {
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud',
          accountReplicas: [{
            _id: 'idReplica',
            state: 'UNDEPLOYED',
            magic: 0,
            connectionStatus: 'CONNECTED',
            symbol: 'EURUSD',
            reliability: 'regular',
            region: 'london'
          }]
        };
        getAccountStub
          .onFirstCall().resolves(startAccount)
          .onSecondCall().resolves(startAccount)
          .onThirdCall().resolves(updatedAccount);
        const account = await api.getAccount('id');
        const replica = account.replicas[0];
        await replica.waitUndeployed(1, 50);
        replica.state.should.equal('UNDEPLOYED');
        sinon.assert.calledWith(client.getAccount, 'id');
        sinon.assert.calledThrice(client.getAccount);
      });
  
      /**
       * @test {MetatraderAccountReplica#waitUndeployed}
       */
      it('should time out waiting for undeployment', async () => {
        let account = await api.getAccount('id');
        const replica = account.replicas[0];
        try {
          await replica.waitUndeployed(1, 50);
          throw new Error('TimeoutError is expected');
        } catch (err) {
          err.name.should.equal('TimeoutError');
          replica.state.should.equal('UNDEPLOYING');
        }
        sinon.assert.calledWith(client.getAccount, 'id');
      });
  
    });
  
    describe('MetatraderAccountReplica.waitRemoved', () => {

      let startAccount;

      beforeEach(async () => {
        startAccount = {
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud',
          accountReplicas: [{
            _id: 'idReplica',
            state: 'DELETING',
            magic: 0,
            connectionStatus: 'CONNECTED',
            symbol: 'EURUSD',
            reliability: 'regular',
            region: 'london'
          }]
        };

        getAccountStub.resolves(startAccount);
      });
  
      /**
       * @test {MetatraderAccountReplica#waitRemoved}
       */
      it('should wait until removed', async () => {
        const updatedAccount = {
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud',
          accountReplicas: []
        };
        getAccountStub
          .onFirstCall().resolves(startAccount)
          .onSecondCall().resolves(startAccount)
          .onThirdCall().resolves(updatedAccount);
        const account = await api.getAccount('id');
        const replica = account.replicas[0];
        await replica.waitRemoved(1, 50);
        sinon.assert.calledWith(client.getAccount, 'id');
        sinon.assert.calledThrice(client.getAccount);
      });
  
      /**
       * @test {MetatraderAccountReplica#waitRemoved}
       */
      it('should time out waiting until removed', async () => {
        let account = await api.getAccount('id');
        const replica = account.replicas[0];
        try {
          await replica.waitRemoved(1, 50);
          throw new Error('TimeoutError is expected');
        } catch (err) {
          err.name.should.equal('TimeoutError');
          replica.state.should.equal('DELETING');
        }
        sinon.assert.calledWith(client.getAccount, 'id');
      });
  
    });
  
    describe('MetatraderAccountReplica.waitConnected', () => {

      let startAccount;

      beforeEach(async () => {
        startAccount = {
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud',
          accountReplicas: [{
            _id: 'idReplica',
            state: 'DEPLOYED',
            magic: 0,
            connectionStatus: 'DISCONNECTED',
            symbol: 'EURUSD',
            reliability: 'regular',
            region: 'london'
          }]
        };

        getAccountStub.resolves(startAccount);
      });
  
      /**
       * @test {MetatraderAccountReplica#waitConnected}
       */
      it('should wait until broker connection', async () => {
        const updatedAccount = {
          _id: 'id',
          login: '50194988',
          name: 'mt5a',
          server: 'ICMarketsSC-Demo',
          provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
          magic: 123456,
          application: 'MetaApi',
          connectionStatus: 'CONNECTED',
          state: 'DEPLOYED',
          type: 'cloud',
          accountReplicas: [{
            _id: 'idReplica',
            state: 'DEPLOYED',
            magic: 0,
            connectionStatus: 'CONNECTED',
            symbol: 'EURUSD',
            reliability: 'regular',
            region: 'london'
          }]
        };
        getAccountStub
          .onFirstCall().resolves(startAccount)
          .onSecondCall().resolves(startAccount)
          .onThirdCall().resolves(updatedAccount);

        let account = await api.getAccount('id');
        const replica = account.replicas[0];
        await replica.waitConnected(1, 50);
        replica.connectionStatus.should.equal('CONNECTED');
        sinon.assert.calledWith(client.getAccount, 'id');
        sinon.assert.calledThrice(client.getAccount);
      });
  
      /**
       * @test {MetatraderAccountReplica#waitConnected}
       */
      it('should time out waiting for broker connection', async () => {
        let account = await api.getAccount('id');
        const replica = account.replicas[0];
        try {
          await replica.waitConnected(1, 50);
          throw new Error('TimeoutError is expected');
        } catch (err) {
          err.name.should.equal('TimeoutError');
          replica.connectionStatus.should.equal('DISCONNECTED');
        }
        sinon.assert.calledWith(client.getAccount, 'id');
      });
  
    });

  });

});
