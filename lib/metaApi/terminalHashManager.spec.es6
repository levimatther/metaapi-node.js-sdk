'use strict';

import should from 'should';
import sinon from 'sinon';
import crypto from 'crypto-js';
import TerminalHashManager from './terminalHashManager';

/**
 * @test {TerminalHashManager}
 */
describe('TerminalHashManager', () => {

  let state, sandbox, clock;
  let clientApiClient;
  let terminalHashManager;
  let ignoredFieldLists;

  const md5 = (arg) => crypto.MD5(arg).toString();

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    clock = sinon.useFakeTimers({shouldAdvanceTime: true});
    clientApiClient = {
      refreshIgnoredFieldLists: () => {},
      getHashingIgnoredFieldLists: () => {}
    };
    ignoredFieldLists = {
      g1: {
        specification: [
          'description',
          'expirationTime',
          'expirationBrokerTime',
          'startTime',
          'startBrokerTime',
          'pipSize'
        ],
        position: [
          'time',
          'updateTime',
          'comment',
          'brokerComment',
          'originalComment',
          'clientId',
          'profit',
          'realizedProfit',
          'unrealizedProfit',
          'currentPrice',
          'currentTickValue',
          'accountCurrencyExchangeRate',
          'updateSequenceNumber'
        ],
        order: [
          'time',
          'expirationTime',
          'comment',
          'brokerComment',
          'originalComment',
          'clientId',
          'currentPrice',
          'accountCurrencyExchangeRate',
          'updateSequenceNumber'
        ]
      },
      g2: {
        specification: [
          'pipSize'
        ],
        position: [
          'comment',
          'brokerComment',
          'originalComment',
          'clientId',
          'profit',
          'realizedProfit',
          'unrealizedProfit',
          'currentPrice',
          'currentTickValue',
          'accountCurrencyExchangeRate',
          'updateSequenceNumber'
        ],
        order: [
          'comment',
          'brokerComment',
          'originalComment',
          'clientId',
          'currentPrice',
          'accountCurrencyExchangeRate',
          'updateSequenceNumber'
        ]
      }
    };
    sandbox.stub(clientApiClient, 'getHashingIgnoredFieldLists').returns(ignoredFieldLists);
    terminalHashManager = new TerminalHashManager(clientApiClient);
  });

  afterEach(() => {
    clock.restore();
    sandbox.restore();
  });

  it('should refresh ignored field lists', async () => {
    sandbox.stub(clientApiClient, 'refreshIgnoredFieldLists').resolves();
    await terminalHashManager.refreshIgnoredFieldLists('vint-hill');
    sinon.assert.calledWith(clientApiClient.refreshIgnoredFieldLists, 'vint-hill');
  });

  describe('specifications', () => {

    it('record specification hash', async () => {
      const specifications = [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}];
      await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', specifications);
      const popularHashes = terminalHashManager.getLastUsedSpecificationHashes('ICMarkets-Demo02');
      sinon.assert.match(popularHashes, ['8908db669eed0b715ab3559300846b3b']);
    });
  
    it('record and return specifications', async () => {
      const specifications = [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}];
      const hash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', specifications);
      const data = terminalHashManager.getSpecificationsByHash(hash);
      sinon.assert.match(data, { EURUSD: { symbol: 'EURUSD', tickSize: 0.0001 },
        GBPUSD: { symbol: 'GBPUSD' } });
      const updatedHash = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'BTCUSD'}],
        ['GBPUSD'], hash);
      const updatedData = terminalHashManager.getSpecificationsByHash(updatedHash);
      sinon.assert.match(updatedData, {
        EURUSD: {symbol: 'EURUSD', tickSize: 0.0001},
        AUDUSD: {symbol: 'AUDUSD', tickSize: 0.001},
        BTCUSD: {symbol: 'BTCUSD' }
      });
      const updatedHash2 = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1',  [{symbol: 'CADUSD', tickSize: 0.001}], ['BTCUSD'], updatedHash);
      const updatedData2 = terminalHashManager.getSpecificationsByHash(updatedHash2);
      sinon.assert.match(updatedData2, {
        EURUSD: {symbol: 'EURUSD', tickSize: 0.0001},
        AUDUSD: {symbol: 'AUDUSD', tickSize: 0.001},
        CADUSD: {symbol: 'CADUSD', tickSize: 0.001}
      });
    });
  
    it('should update specifications to correct hash', async () => {
      const hash1 = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.001}]);
      const updatedHash = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'BTCUSD'},
          {symbol: 'CADUSD', tickSize: 0.002}],
        ['GBPUSD'], hash1);
      const hash2 = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001},
          {symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'BTCUSD'}, {symbol: 'CADUSD', tickSize: 0.002}]);
      sinon.assert.match(updatedHash, hash2);
    });
  
    it('should clean up unused entry that has no children', async () => {
      const hash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.001}]);
      await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD'}]);
      terminalHashManager.getSpecificationsByHash(hash);
      await clock.tickAsync(16 * 1000 * 60);
      const specifications = terminalHashManager.getSpecificationsByHash(hash);
      sinon.assert.match(specifications, null);
    });
  
    it('should clean up unused entry with one child', async () => {
      const hash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.001}]);
      const hash2 = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-2', [{symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'BTCUSD'},
          {symbol: 'CADUSD', tickSize: 0.002}],
        ['GBPUSD'], hash);
      await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD'}]);
      terminalHashManager.getSpecificationsByHash(hash);
      await clock.tickAsync(16 * 1000 * 60);
      const specifications = terminalHashManager.getSpecificationsByHash(hash);
      sinon.assert.match(specifications, null);
      const specifications2 = terminalHashManager.getSpecificationsByHash(hash2);
      sinon.assert.match(specifications2, {
        EURUSD: { symbol: 'EURUSD', tickSize: 0.0001 },
        CADUSD: { symbol: 'CADUSD', tickSize: 0.002 },
        AUDUSD: { symbol: 'AUDUSD', tickSize: 0.001 },
        BTCUSD: { symbol: 'BTCUSD' }
      });
    });

    it('should combine child entry with parent entry with multiple steps', async () => {
      const hash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-2', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.001}]);
      const hash2 = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-2', [{symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'BTCUSD'},
          {symbol: 'CADUSD', tickSize: 0.002}],
        ['GBPUSD'], hash);
      const hash3 = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-2', [{symbol: 'AUDUSD', tickSize: 0.003}], [], hash2);
      const hash4 = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-2', [{symbol: 'AUDUSD', tickSize: 0.004}], [], hash3);
      const hash5 = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-2', [{symbol: 'AUDUSD', tickSize: 0.005}], [], hash4);
      const specifications = terminalHashManager.getSpecificationsByHash(hash5);
      terminalHashManager.addSpecificationReference(hash2, 'connectionId',  'vint-hill:1:ps-mpa-1');
      sinon.assert.match(specifications, {
        EURUSD: { symbol: 'EURUSD', tickSize: 0.0001 },
        CADUSD: { symbol: 'CADUSD', tickSize: 0.002 },
        AUDUSD: { symbol: 'AUDUSD', tickSize: 0.005 },
        BTCUSD: { symbol: 'BTCUSD' }
      });
      await clock.tickAsync(16 * 1000 * 60);
      const specifications2 = terminalHashManager.getSpecificationsByHash(hash5);
      sinon.assert.match(specifications, specifications2);
    });
  
    it('should not clean up unused entry with multiple children', async () => {
      const hash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.001}]);
      await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-2', [{symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'BTCUSD'},
          {symbol: 'CADUSD', tickSize: 0.002}],
        ['GBPUSD'], hash);
      await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-3', [{symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'BTCUSD'},
          {symbol: 'CADUSD', tickSize: 0.003}], ['GBPUSD'], hash);
      await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD'}]);
      terminalHashManager.getSpecificationsByHash(hash);
      await clock.tickAsync(16 * 1000 * 60);
      terminalHashManager.getSpecificationsByHash(hash);
    });
  
    it('should combine changes if both child and parent exist', async () => {
      const hash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.001}]);
      const hash2 = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-2', [{symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'ETHUSD'},
          {symbol: 'CADUSD', tickSize: 0.002}], ['GBPUSD'], hash);
      const hash3 = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-2', [{symbol: 'BTCUSD'},
          {symbol: 'CADUSD', tickSize: 0.003}], ['AUDUSD'], hash2);  
      const data1 = terminalHashManager.getSpecificationsByHash(hash3);
      await clock.tickAsync(16 * 1000 * 60);
      const specifications = terminalHashManager.getSpecificationsByHash(hash2);
      sinon.assert.match(specifications, null);
      const data2 = terminalHashManager.getSpecificationsByHash(hash3);
      sinon.assert.match(data1, data2);
    });
  
    it('should reassign child hash to parent if object between is removed', async () => {
      const hash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.001}]);
      const hash2 = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-2', [{symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'ETHUSD'},
          {symbol: 'CADUSD', tickSize: 0.002}], ['GBPUSD'], hash);
      const hash3 = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-2', [{symbol: 'BTCUSD'},
          {symbol: 'CADUSD', tickSize: 0.003}], ['AUDUSD'], hash2); 
      const data1 = terminalHashManager.getSpecificationsByHash(hash3);
      await clock.tickAsync(16 * 1000 * 60);
      const specifications2 = terminalHashManager.getSpecificationsByHash(hash2);
      sinon.assert.match(specifications2, null);

      await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.005}]);
      const data2 = terminalHashManager.getSpecificationsByHash(hash3);
  
      sinon.assert.match(data1, data2);
    });

    it('should get last used specifications hashes with fuzzy search', async () => {
      const hash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.001}]);
      await clock.tickAsync(500);
      const hash2 = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001},
          {symbol: 'CADUSD', tickSize: 0.001}]);
      await clock.tickAsync(500);
      const hash3 = await terminalHashManager.recordSpecifications('ICMarkets-Demo01', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.001}]);
      await clock.tickAsync(500);
      const hash4 = await terminalHashManager.recordSpecifications('ICMarkets-Demo01', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001},{symbol: 'GBPUSD'}]);
      await clock.tickAsync(500);
      await terminalHashManager.recordSpecifications('VantageFX', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'CADUSD', tickSize: 0.001}]);
      const lastUsedHashes = terminalHashManager.getLastUsedSpecificationHashes('ICMarkets-Demo02');
      sinon.assert.match(lastUsedHashes, [hash2, hash, hash4, hash3]);
    });

  });

  describe('positions', () => {

    it('should record positions and return by hash', async () => {
      const positions = [{id: '1', volume: 10}, {id: '2', volume: 20}];
      const expectedHashes = ['f915d7e4b04a30a96fe6cf770a38fedb', 'c472cdc6239536770a7279af01fc10a7'];
      const hash = await terminalHashManager.recordPositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', positions);

      const recordedPositions = terminalHashManager.getPositionsByHash(hash);
      const hashes = terminalHashManager.getPositionsHashesByHash(hash);
      sinon.assert.match(recordedPositions, {
        1: positions[0],
        2: positions[1]
      });
      sinon.assert.match(hashes[1], expectedHashes[0]);
      sinon.assert.match(hashes[2], expectedHashes[1]);
    });

    it('should update positions', async () => {
      const positions = [{id: '1', volume: 10}, {id: '2', volume: 20}, {id: '3', volume: 30}];
      const hash = await terminalHashManager.recordPositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', positions);
      const newPositions = [{id: '1', volume: 30}];
      const updatedHash = await terminalHashManager.updatePositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', newPositions, [], hash);
      const recordedPositions = terminalHashManager.getPositionsByHash(updatedHash);
      sinon.assert.match(recordedPositions, {
        1: newPositions[0],
        2: positions[1],
        3: positions[2]
      });
      const hashes = terminalHashManager.getPositionsHashesByHash(updatedHash);
      sinon.assert.match(hashes, {
        1: await terminalHashManager.getItemHash(newPositions[0], 'positions', 'cloud-g1', 'vint-hill'),
        2: await terminalHashManager.getItemHash(positions[1], 'positions', 'cloud-g1', 'vint-hill'),
        3: await terminalHashManager.getItemHash(positions[2], 'positions', 'cloud-g1', 'vint-hill')
      });
      const newPositions2 = [{id: '3', volume: 50}];
      const updatedHash2 = await terminalHashManager.updatePositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', newPositions2, [], updatedHash);
      const recordedPositions2 = terminalHashManager.getPositionsByHash(updatedHash2);
      sinon.assert.match(recordedPositions2, {
        1: newPositions[0],
        2: positions[1],
        3: newPositions2[0]
      });
      const hashes2 = terminalHashManager.getPositionsHashesByHash(updatedHash2);
      sinon.assert.match(hashes2, {
        1: await terminalHashManager.getItemHash(newPositions[0], 'positions', 'cloud-g1', 'vint-hill'),
        2: await terminalHashManager.getItemHash(positions[1], 'positions', 'cloud-g1', 'vint-hill'),
        3: await terminalHashManager.getItemHash(newPositions2[0], 'positions', 'cloud-g1', 'vint-hill')
      });
    });

    it('should remove positions', async () => {
      const positions = [{id: '1', volume: 10}, {id: '2', volume: 20},
        {id: '3', volume: 30}, {id: '4', volume: 40}];
      const hash = await terminalHashManager.recordPositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', positions);
      await clock.tickAsync(500);
      const updatedHash = await terminalHashManager.updatePositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['2'], hash);
      const recordedPositions = terminalHashManager.getPositionsByHash(updatedHash);
      sinon.assert.match(recordedPositions, {
        1: positions[0],
        3: positions[2],
        4: positions[3]
      });
      await clock.tickAsync(500);
      const updatedHash2 = await terminalHashManager.updatePositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['2'], updatedHash);
      const recordedPositions2 = terminalHashManager.getPositionsByHash(updatedHash2);
      sinon.assert.match(updatedHash, updatedHash2);
      sinon.assert.match({
        1: positions[0],
        3: positions[2],
        4: positions[3]
      }, recordedPositions2);
      await clock.tickAsync(500);
      const updatedHash3 = await terminalHashManager.updatePositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['3'], updatedHash2);
      const recordedPositions3 = terminalHashManager.getPositionsByHash(updatedHash3);
      sinon.assert.match({
        1: positions[0],
        4: positions[3]
      }, recordedPositions3);
      await clock.tickAsync(500);
      const updatedHash4 = await terminalHashManager.updatePositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['3', '4'], updatedHash3);
      const recordedPositions4 = terminalHashManager.getPositionsByHash(updatedHash4);
      sinon.assert.match({
        1: positions[0]
      }, recordedPositions4);
    });

    it('should optimize position trees', async () => {
      const positions = [{id: '1', volume: 10}, {id: '2', volume: 20},
        {id: '3', volume: 30}, {id: '4', volume: 40}];
      const hash = await terminalHashManager.recordPositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', positions);
      await clock.tickAsync(60000);
      const updatedHash = await terminalHashManager.updatePositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['2', '4'], hash);
      await clock.tickAsync(60000);
      const updatedHash2 = await terminalHashManager.updatePositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['2', '3'], updatedHash);
      const recordedPositions = terminalHashManager.getPositionsByHash(updatedHash2);
      sinon.assert.match(recordedPositions, {
        1: positions[0]
      });
      await clock.tickAsync(550000);
      const recordedPositions2 = terminalHashManager.getPositionsByHash(updatedHash2);
      sinon.assert.match({
        1: positions[0]
      }, recordedPositions2);
    });

    it('should get last used hashes', async () => {
      const positions = [{id: '1', volume: 10}, {id: '2', volume: 20},
        {id: '3', volume: 30}, {id: '4', volume: 40}];
      const hash = await terminalHashManager.recordPositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', positions);
      await clock.tickAsync(500);
      await terminalHashManager.recordPositions('accountId2', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [positions[0]]);
      await clock.tickAsync(500);
      const hash3 = await terminalHashManager.recordPositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [positions[1]]);
      const lastUsedHashes = terminalHashManager.getLastUsedPositionHashes('accountId');
      sinon.assert.match(lastUsedHashes, [hash3, hash]);
    });

  });

  describe('orders', () => {

    it('should record orders and return by hash', async () => {
      const orders = [{id: '1', openPrice: 10}, {id: '2', openPrice: 20}];
      const expectedHashes = ['df061bbdcae2ec5f7feec06edeed170e', 'a4766bbdb57dc4629bb0d0eede270c5f'];
      const hash = await terminalHashManager.recordOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', orders);

      const recordedOrders = terminalHashManager.getOrdersByHash(hash);
      const hashes = terminalHashManager.getOrdersHashesByHash(hash);
      sinon.assert.match(recordedOrders, {
        1: orders[0],
        2: orders[1]
      });
      sinon.assert.match(expectedHashes[0], hashes[1]);
      sinon.assert.match(expectedHashes[1], hashes[2]);
    });

    it('should update orders', async () => {
      const orders = [{id: '1', openPrice: 10}, {id: '2', openPrice: 20}, {id: '3', openPrice: 30}];
      const hash = await terminalHashManager.recordOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', orders);
      const newOrders = [{id: '1', openPrice: 30}];
      const updatedHash = await terminalHashManager.updateOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', newOrders, [], hash);
      const recordedOrders = terminalHashManager.getOrdersByHash(updatedHash);
      sinon.assert.match(recordedOrders, {
        1: newOrders[0],
        2: orders[1],
        3: orders[2]
      });
      const hashes = terminalHashManager.getOrdersHashesByHash(updatedHash);
      sinon.assert.match(hashes, {
        1: await terminalHashManager.getItemHash(newOrders[0], 'orders', 'cloud-g1', 'vint-hill'),
        2: await terminalHashManager.getItemHash(orders[1], 'orders', 'cloud-g1', 'vint-hill'),
        3: await terminalHashManager.getItemHash(orders[2], 'orders', 'cloud-g1', 'vint-hill')
      });
      const newOrders2 = [{id: '3', openPrice: 50}];
      const updatedHash2 = await terminalHashManager.updateOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', newOrders2, [], updatedHash);
      const recordedOrders2 = terminalHashManager.getOrdersByHash(updatedHash2);
      sinon.assert.match(recordedOrders2, {
        1: newOrders[0],
        2: orders[1],
        3: newOrders2[0]
      });
      const hashes2 = terminalHashManager.getOrdersHashesByHash(updatedHash2);
      sinon.assert.match(hashes2, {
        1: await terminalHashManager.getItemHash(newOrders[0], 'orders', 'cloud-g1', 'vint-hill'),
        2: await terminalHashManager.getItemHash(orders[1], 'orders', 'cloud-g1', 'vint-hill'),
        3: await terminalHashManager.getItemHash(newOrders2[0], 'orders', 'cloud-g1', 'vint-hill')
      });
    });

    it('should remove orders', async () => {
      const orders = [{id: '1', openPrice: 10}, {id: '2', openPrice: 20},
        {id: '3', openPrice: 30}, {id: '4', openPrice: 40}];
      const hash = await terminalHashManager.recordOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', orders);
      await clock.tickAsync(500);
      const updatedHash = await terminalHashManager.updateOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['2'], hash);
      const recordedOrders = terminalHashManager.getOrdersByHash(updatedHash);
      sinon.assert.match(recordedOrders, {
        1: orders[0],
        3: orders[2],
        4: orders[3]
      });
      await clock.tickAsync(500);
      const updatedHash2 = await terminalHashManager.updateOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['2'], updatedHash);
      const recordedOrders2 = terminalHashManager.getOrdersByHash(updatedHash2);
      sinon.assert.match(updatedHash, updatedHash2);
      sinon.assert.match(recordedOrders2, {
        1: orders[0],
        3: orders[2],
        4: orders[3]
      });
      await clock.tickAsync(500);
      const updatedHash3 = await terminalHashManager.updateOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['3'], updatedHash2);
      const recordedOrders3 = terminalHashManager.getOrdersByHash(updatedHash3);
      sinon.assert.match(recordedOrders3, {
        1: orders[0],
        4: orders[3]
      });
      await clock.tickAsync(500);
      const updatedHash4 = await terminalHashManager.updateOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['3', '4'], updatedHash3);
      const recordedOrders4 = terminalHashManager.getOrdersByHash(updatedHash4);
      sinon.assert.match(recordedOrders4, {
        1: orders[0]
      });
    });

    it('should optimize order trees', async () => {
      const orders = [{id: '1', openPrice: 10}, {id: '2', openPrice: 20},
        {id: '3', openPrice: 30}, {id: '4', openPrice: 40}];
      const hash = await terminalHashManager.recordOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', orders);
      await clock.tickAsync(60000);
      const updatedHash = await terminalHashManager.updateOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['2', '4'], hash);
      await clock.tickAsync(60000);
      const updatedHash2 = await terminalHashManager.updateOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['2', '3'], updatedHash);
      const recordedOrders = terminalHashManager.getOrdersByHash(updatedHash2);
      sinon.assert.match(recordedOrders, {
        1: orders[0]
      });
      await clock.tickAsync(550000);
      const recordedOrders2 = terminalHashManager.getOrdersByHash(updatedHash2);
      sinon.assert.match(recordedOrders2, {
        1: orders[0]
      });
    });

    it('should get last used hashes', async () => {
      const orders = [{id: '1', openPrice: 10}, {id: '2', openPrice: 20},
        {id: '3', openPrice: 30}, {id: '4', openPrice: 40}];
      const hash = await terminalHashManager.recordOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', orders);
      await clock.tickAsync(500);
      await terminalHashManager.recordOrders('accountId2', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [orders[0]]);
      await clock.tickAsync(500);
      const hash3 = await terminalHashManager.recordOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [orders[1]]);
      const lastUsedHashes = terminalHashManager.getLastUsedOrderHashes('accountId');
      sinon.assert.match(lastUsedHashes, [hash3, hash]);
    });

  });

  it('should remove connection references', async () => {
    const specifications = [{symbol: 'EURUSD', tickSize: 0.0001}];
    const positions = [{id: '1', volume: 10}];
    const orders = [{id: '1', openPrice: 10}];
    const specificationsHash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
      'connectionId', 'vint-hill:1:ps-mpa-1', specifications);
    const positionsHash = await terminalHashManager.recordPositions('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', positions);
    const ordersHash = await terminalHashManager.recordOrders('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', orders);
    await clock.tickAsync(16 * 60 * 1000);
    const specsData = terminalHashManager.getSpecificationsByHash(specificationsHash);
    sinon.assert.match(specsData, { EURUSD: { symbol: 'EURUSD', tickSize: 0.0001 } });

    const positionsData = terminalHashManager.getPositionsByHash(positionsHash);
    sinon.assert.match(positionsData, { 1: {id: '1', volume: 10} });

    const ordersData = terminalHashManager.getOrdersByHash(ordersHash);
    sinon.assert.match(ordersData, { 1: {id: '1', openPrice: 10} });
    terminalHashManager.removeConnectionReferences('connectionId', 'vint-hill:1:ps-mpa-1');
    await clock.tickAsync(16 * 60 * 1000);

    const specsData2 = terminalHashManager.getSpecificationsByHash(specificationsHash);
    sinon.assert.match(specsData2, null);

    const positionsData2 = terminalHashManager.getPositionsByHash(positionsHash);
    sinon.assert.match(positionsData2, null);

    const ordersData2 = terminalHashManager.getOrdersByHash(ordersHash);
    sinon.assert.match(ordersData2, null);
  });

  it('should return hashes for cloud-g1 accounts', async () => {
    const expectedSpecificationsHash = [md5('{"symbol":"AUDNZD","tickSize":0.01000000}'),
      md5('{"symbol":"EURUSD","tickSize":0.00000100,"contractSize":1.00000000,"maxVolume":30000.00000000,' +
    '"hedgedMarginUsesLargerLeg":false,"digits":3}')];
    const expectedPositionsHash = md5('{"id":"46214692","type":"POSITION_TYPE_BUY","symbol":"GBPUSD","magic":1000,' +
    '"openPrice":1.26101000,"volume":0.07000000,"swap":0.00000000,"commission":-0.25000000,' +
    '"stopLoss":1.17721000}');
    const expectedOrdersHash = md5('{"id":"46871284","type":"ORDER_TYPE_BUY_LIMIT","state":"ORDER_STATE_PLACED",' +
    '"symbol":"AUDNZD","magic":123456,"platform":"mt5","openPrice":1.03000000,' +
    '"volume":0.01000000,"currentVolume":0.01000000}');
    const specifications = [
      {symbol: 'AUDNZD', tickSize: 0.01, description: 'Test1'},
      {symbol: 'EURUSD', tickSize: 0.000001, contractSize: 1, maxVolume: 30000,
        hedgedMarginUsesLargerLeg: false, digits: 3, description: 'Test2'}];
    const specificationsHash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
      'connectionId', 'vint-hill:1:ps-mpa-1', specifications);
    const resultSpecificationsHashes = 
      terminalHashManager.getSpecificationsHashesByHash(specificationsHash);
    sinon.assert.match(resultSpecificationsHashes.AUDNZD, expectedSpecificationsHash[0]);
    sinon.assert.match(resultSpecificationsHashes.EURUSD, expectedSpecificationsHash[1]);

    const positions = [{
      id: '46214692',
      type: 'POSITION_TYPE_BUY',
      symbol: 'GBPUSD',
      magic: 1000,
      time: new Date('2020-04-15T02:45:06.521Z'),
      updateTime: new Date('2020-04-15T02:45:06.521Z'),
      openPrice: 1.26101,
      currentPrice: 1.24883,
      currentTickValue: 1,
      volume: 0.07,
      swap: 0,
      profit: -85.25999999999966,
      commission: -0.25,
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      stopLoss: 1.17721,
      unrealizedProfit: -85.25999999999901,
      realizedProfit: -6.536993168992922e-13,
      updateSequenceNumber: 13246,
      accountCurrencyExchangeRate: 1,
      comment: 'test',
      brokerComment: 'test2',
    }];
    const positionsHash = await terminalHashManager.recordPositions('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', positions);
    sinon.assert.match(positionsHash, expectedPositionsHash);

    const orders = [{
      id: '46871284',
      type: 'ORDER_TYPE_BUY_LIMIT',
      state: 'ORDER_STATE_PLACED',
      symbol: 'AUDNZD',
      magic: 123456,
      platform: 'mt5',
      time: '2020-04-20T08:38:58.270Z',
      openPrice: 1.03,
      currentPrice: 1.05206,
      volume: 0.01,
      currentVolume: 0.01,
      comment: 'COMMENT2',
      updateSequenceNumber: 13246,
      accountCurrencyExchangeRate: 1,
      brokerComment: 'test2',
      clientId: 'TE_GBPUSD_7hyINWqAlE',
    }];
    const ordersHash = await terminalHashManager.recordOrders('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', orders);
    sinon.assert.match(ordersHash, expectedOrdersHash);
  });

  it('should return hashes for cloud-g2 accounts', async () => {
    const expectedSpecificationsHash = [md5('{"symbol":"AUDNZD","tickSize":0.01,"description":"Test1"}'),
      md5('{"symbol":"EURUSD","tickSize":0.000001,"contractSize":1,"maxVolume":30000,' +
    '"hedgedMarginUsesLargerLeg":false,"digits":3,"description":"Test2"}')];
    const expectedPositionsHash = md5('{"id":"46214692","type":"POSITION_TYPE_BUY","symbol":"GBPUSD","magic":1000,' +
    '"time":"2020-04-15T02:45:06.521Z","updateTime":"2020-04-15T02:45:06.521Z","openPrice":1.26101,' + 
    '"volume":0.07,"swap":0,"commission":-0.25,"stopLoss":1.17721}');
    const expectedOrdersHash = md5('{"id":"46871284","type":"ORDER_TYPE_BUY_LIMIT","state":"ORDER_STATE_PLACED",' +
    '"symbol":"AUDNZD","magic":123456,"platform":"mt5","time":"2020-04-20T08:38:58.270Z","openPrice":1.03,' +
    '"volume":0.01,"currentVolume":0.01}');
    const specifications = [
      {symbol: 'AUDNZD', tickSize: 0.01, description: 'Test1'},
      {symbol: 'EURUSD', tickSize: 0.000001, contractSize: 1, maxVolume: 30000,
        hedgedMarginUsesLargerLeg: false, digits: 3, description: 'Test2'}];
    const specificationsHash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g2',
      'connectionId', 'vint-hill:1:ps-mpa-1', specifications);
    const resultSpecificationsHashes = 
      terminalHashManager.getSpecificationsHashesByHash(specificationsHash);
    sinon.assert.match(resultSpecificationsHashes.AUDNZD, expectedSpecificationsHash[0]);
    sinon.assert.match(resultSpecificationsHashes.EURUSD, expectedSpecificationsHash[1]);

    const positions = [{
      id: '46214692',
      type: 'POSITION_TYPE_BUY',
      symbol: 'GBPUSD',
      magic: 1000,
      time: new Date('2020-04-15T02:45:06.521Z'),
      updateTime: new Date('2020-04-15T02:45:06.521Z'),
      openPrice: 1.26101,
      currentPrice: 1.24883,
      currentTickValue: 1,
      volume: 0.07,
      swap: 0,
      profit: -85.25999999999966,
      commission: -0.25,
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      stopLoss: 1.17721,
      unrealizedProfit: -85.25999999999901,
      realizedProfit: -6.536993168992922e-13,
      updateSequenceNumber: 13246,
      accountCurrencyExchangeRate: 1,
      comment: 'test',
      brokerComment: 'test2',
    }];
    const positionsHash = await terminalHashManager.recordPositions('accountId', 'cloud-g2', 'connectionId',
      'vint-hill:1:ps-mpa-1', positions);
    sinon.assert.match(positionsHash, expectedPositionsHash);

    const orders = [{
      id: '46871284',
      type: 'ORDER_TYPE_BUY_LIMIT',
      state: 'ORDER_STATE_PLACED',
      symbol: 'AUDNZD',
      magic: 123456,
      platform: 'mt5',
      time: '2020-04-20T08:38:58.270Z',
      openPrice: 1.03,
      currentPrice: 1.05206,
      volume: 0.01,
      currentVolume: 0.01,
      comment: 'COMMENT2',
      updateSequenceNumber: 13246,
      accountCurrencyExchangeRate: 1,
      brokerComment: 'test2',
      clientId: 'TE_GBPUSD_7hyINWqAlE',
    }];
    const ordersHash = await terminalHashManager.recordOrders('accountId', 'cloud-g2', 'connectionId',
      'vint-hill:1:ps-mpa-1', orders);
    sinon.assert.match(ordersHash, expectedOrdersHash);
  });

});
