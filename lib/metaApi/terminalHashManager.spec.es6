'use strict';

import should from 'should';
import sinon from 'sinon';
import crypto from 'crypto-js';
import TerminalHashManager from './terminalHashManager';

/**
 * @test {TerminalState}
 */
describe('TerminalHashManager', () => {

  let state, sandbox, clock;
  let terminalHashManager;

  const md5 = (arg) => crypto.MD5(arg).toString();

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    clock = sinon.useFakeTimers({shouldAdvanceTime: true});
    const clientApiClient = {
      getHashingIgnoredFieldLists: () => ({
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
      })
    };
    terminalHashManager = new TerminalHashManager(clientApiClient);
  });

  afterEach(() => {
    clock.restore();
    sandbox.restore();
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
      const data = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash);
      sinon.assert.match(data, { EURUSD: { symbol: 'EURUSD', tickSize: 0.0001 },
        GBPUSD: { symbol: 'GBPUSD' } });
      const updatedHash = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'BTCUSD'}],
        ['GBPUSD'], hash);
      const updatedData = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', updatedHash);
      sinon.assert.match(updatedData, {
        EURUSD: {symbol: 'EURUSD', tickSize: 0.0001},
        AUDUSD: {symbol: 'AUDUSD', tickSize: 0.001},
        BTCUSD: {symbol: 'BTCUSD' }
      });
      const updatedHash2 = await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1',  [{symbol: 'CADUSD', tickSize: 0.001}], ['BTCUSD'], updatedHash);
      const updatedData2 = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', updatedHash2);
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
      terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash);
      await clock.tickAsync(16 * 1000 * 60);
      const specifications = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash);
      sinon.assert.match(specifications, null);
    });
  
    it('should clean up unused entry with one child', async () => {
      const hash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.001}]);
      await terminalHashManager.updateSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-2', [{symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'BTCUSD'},
          {symbol: 'CADUSD', tickSize: 0.002}],
        ['GBPUSD'], hash);
      await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD'}]);
      terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash);
      await clock.tickAsync(16 * 1000 * 60);
      const specifications = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash);
      sinon.assert.match(specifications, null);
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
      terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash);
      await clock.tickAsync(16 * 1000 * 60);
      terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash);
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
      const data1 = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash3);
      await clock.tickAsync(16 * 1000 * 60);
      const specifications = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash2);
      sinon.assert.match(specifications, null);
      const data2 = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash3);
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
      const data1 = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash3);
      await clock.tickAsync(16 * 1000 * 60);
      const specifications2 = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash2);
      sinon.assert.match(specifications2, null);

      await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.005}]);
      const data2 = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', hash3);
  
      sinon.assert.match(data1, data2);
    });

    it('should get last used position hashes with fuzzy search', async () => {
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

    it('should operate with data of an adjacent server', async () => {
      const hash = await terminalHashManager.recordSpecifications('ICMarkets-Demo02', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
          {symbol: 'CADUSD', tickSize: 0.001}]);
      const updatedHash = await terminalHashManager.updateSpecifications('ICMarkets-Demo01', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'BTCUSD'},
          {symbol: 'CADUSD', tickSize: 0.002}], ['GBPUSD'], hash);
      const data = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo01', updatedHash);
      const data2 = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', updatedHash);
      const hashes = terminalHashManager.getSpecificationsHashesByHash('ICMarkets-Demo01', updatedHash);
      const hashes2 = terminalHashManager.getSpecificationsHashesByHash('ICMarkets-Demo02', updatedHash);
      sinon.assert.match(data, data2);
      sinon.assert.match(hashes, null);
      sinon.assert.match(hashes2, {
        EURUSD: 'c1bb242487a96fcc1d1283f31227024c',
        CADUSD: '953493300b07e741327a5ae34daf6c41',
        AUDUSD: '546fe6db57ef786c875de2d62acf91fd',
        BTCUSD: '85cd5a4604853a7448cdd64c67756043'
      });
    });

  });

  describe('positions', () => {

    it('should record positions and return by hash', async () => {
      const positions = [{id: '1', volume: 10}, {id: '2', volume: 20}];
      const expectedHashes = ['f915d7e4b04a30a96fe6cf770a38fedb', 'c472cdc6239536770a7279af01fc10a7'];
      const hash = await terminalHashManager.recordPositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', positions);

      const recordedPositions = terminalHashManager.getPositionsByHash('accountId', hash);
      const hashes = terminalHashManager.getPositionsHashesByHash('accountId', hash);
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
      const recordedPositions = terminalHashManager.getPositionsByHash('accountId', updatedHash);
      sinon.assert.match(recordedPositions, {
        1: newPositions[0],
        2: positions[1],
        3: positions[2]
      });
      const hashes = terminalHashManager.getPositionsHashesByHash('accountId', updatedHash);
      sinon.assert.match(hashes, {
        1: await terminalHashManager._getPositionHash(newPositions[0], 'cloud-g1', 'vint-hill'),
        2: await terminalHashManager._getPositionHash(positions[1], 'cloud-g1', 'vint-hill'),
        3: await terminalHashManager._getPositionHash(positions[2], 'cloud-g1', 'vint-hill')
      });
      const newPositions2 = [{id: '3', volume: 50}];
      const updatedHash2 = await terminalHashManager.updatePositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', newPositions2, [], updatedHash);
      const recordedPositions2 = terminalHashManager.getPositionsByHash('accountId', updatedHash2);
      sinon.assert.match(recordedPositions2, {
        1: newPositions[0],
        2: positions[1],
        3: newPositions2[0]
      });
      const hashes2 = terminalHashManager.getPositionsHashesByHash('accountId', updatedHash2);
      sinon.assert.match(hashes2, {
        1: await terminalHashManager._getPositionHash(newPositions[0], 'cloud-g1', 'vint-hill'),
        2: await terminalHashManager._getPositionHash(positions[1], 'cloud-g1', 'vint-hill'),
        3: await terminalHashManager._getPositionHash(newPositions2[0], 'cloud-g1', 'vint-hill')
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
      const recordedPositions = terminalHashManager.getPositionsByHash('accountId', updatedHash);
      const removedPositions = terminalHashManager.getRemovedPositionsByHash('accountId', updatedHash);
      sinon.assert.match(recordedPositions, {
        1: positions[0],
        3: positions[2],
        4: positions[3]
      });
      sinon.assert.match(removedPositions, ['2']);
      await clock.tickAsync(500);
      const updatedHash2 = await terminalHashManager.updatePositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['2'], updatedHash);
      const recordedPositions2 = terminalHashManager.getPositionsByHash('accountId', updatedHash2);
      const removedPositions2 = terminalHashManager.getRemovedPositionsByHash('accountId', updatedHash2);
      sinon.assert.match(updatedHash, updatedHash2);
      sinon.assert.match({
        1: positions[0],
        3: positions[2],
        4: positions[3]
      }, recordedPositions2);
      sinon.assert.match(removedPositions2, ['2']);
      await clock.tickAsync(500);
      const updatedHash3 = await terminalHashManager.updatePositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['3'], updatedHash2);
      const recordedPositions3 = terminalHashManager.getPositionsByHash('accountId', updatedHash3);
      const removedPositions3 = terminalHashManager.getRemovedPositionsByHash('accountId', updatedHash3);
      sinon.assert.match({
        1: positions[0],
        4: positions[3]
      }, recordedPositions3);
      sinon.assert.match(removedPositions3, ['2', '3']);
      await clock.tickAsync(500);
      const updatedHash4 = await terminalHashManager.updatePositions('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['3', '4'], updatedHash3);
      const recordedPositions4 = terminalHashManager.getPositionsByHash('accountId', updatedHash4);
      const removedPositions4 = terminalHashManager.getRemovedPositionsByHash('accountId', updatedHash4);
      sinon.assert.match({
        1: positions[0]
      }, recordedPositions4);
      sinon.assert.match(removedPositions4, ['2', '3', '4']);
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
      const recordedPositions = terminalHashManager.getPositionsByHash('accountId', updatedHash2);
      const removedPositions = terminalHashManager.getRemovedPositionsByHash('accountId', updatedHash2);
      sinon.assert.match(recordedPositions, {
        1: positions[0]
      });
      sinon.assert.match(removedPositions, ['2', '4', '3']);
      await clock.tickAsync(550000);
      const recordedPositions2 = terminalHashManager.getPositionsByHash('accountId', updatedHash2);
      const removedPositions2 = terminalHashManager.getRemovedPositionsByHash('accountId', updatedHash2);
      sinon.assert.match({
        1: positions[0]
      }, recordedPositions2);
      sinon.assert.match(removedPositions2, ['2', '3']);
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

      const recordedOrders = terminalHashManager.getOrdersByHash('accountId', hash);
      const hashes = terminalHashManager.getOrdersHashesByHash('accountId', hash);
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
      const recordedOrders = terminalHashManager.getOrdersByHash('accountId', updatedHash);
      sinon.assert.match(recordedOrders, {
        1: newOrders[0],
        2: orders[1],
        3: orders[2]
      });
      const hashes = terminalHashManager.getOrdersHashesByHash('accountId', updatedHash);
      sinon.assert.match(hashes, {
        1: await terminalHashManager._getOrderHash(newOrders[0], 'cloud-g1', 'vint-hill'),
        2: await terminalHashManager._getOrderHash(orders[1], 'cloud-g1', 'vint-hill'),
        3: await terminalHashManager._getOrderHash(orders[2], 'cloud-g1', 'vint-hill')
      });
      const newOrders2 = [{id: '3', openPrice: 50}];
      const updatedHash2 = await terminalHashManager.updateOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', newOrders2, [], updatedHash);
      const recordedOrders2 = terminalHashManager.getOrdersByHash('accountId', updatedHash2);
      sinon.assert.match(recordedOrders2, {
        1: newOrders[0],
        2: orders[1],
        3: newOrders2[0]
      });
      const hashes2 = terminalHashManager.getOrdersHashesByHash('accountId', updatedHash2);
      sinon.assert.match(hashes2, {
        1: await terminalHashManager._getOrderHash(newOrders[0], 'cloud-g1', 'vint-hill'),
        2: await terminalHashManager._getOrderHash(orders[1], 'cloud-g1', 'vint-hill'),
        3: await terminalHashManager._getOrderHash(newOrders2[0], 'cloud-g1', 'vint-hill')
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
      const recordedOrders = terminalHashManager.getOrdersByHash('accountId', updatedHash);
      const completedOrders = terminalHashManager.getCompletedOrdersByHash('accountId', updatedHash);
      sinon.assert.match(recordedOrders, {
        1: orders[0],
        3: orders[2],
        4: orders[3]
      });
      sinon.assert.match(completedOrders, ['2']);
      await clock.tickAsync(500);
      const updatedHash2 = await terminalHashManager.updateOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['2'], updatedHash);
      const recordedOrders2 = terminalHashManager.getOrdersByHash('accountId', updatedHash2);
      const completedOrders2 = terminalHashManager.getCompletedOrdersByHash('accountId', updatedHash2);
      sinon.assert.match(updatedHash, updatedHash2);
      sinon.assert.match(recordedOrders2, {
        1: orders[0],
        3: orders[2],
        4: orders[3]
      });
      sinon.assert.match(completedOrders2, ['2']);
      await clock.tickAsync(500);
      const updatedHash3 = await terminalHashManager.updateOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['3'], updatedHash2);
      const recordedOrders3 = terminalHashManager.getOrdersByHash('accountId', updatedHash3);
      const completedOrders3 = terminalHashManager.getCompletedOrdersByHash('accountId', updatedHash3);
      sinon.assert.match(recordedOrders3, {
        1: orders[0],
        4: orders[3]
      });
      sinon.assert.match(completedOrders3, ['2', '3']);
      await clock.tickAsync(500);
      const updatedHash4 = await terminalHashManager.updateOrders('accountId', 'cloud-g1', 'connectionId',
        'vint-hill:1:ps-mpa-1', [], ['3', '4'], updatedHash3);
      const recordedOrders4 = terminalHashManager.getOrdersByHash('accountId', updatedHash4);
      const completedOrders4 = terminalHashManager.getCompletedOrdersByHash('accountId', updatedHash4);
      sinon.assert.match(recordedOrders4, {
        1: orders[0]
      });
      sinon.assert.match(completedOrders4, ['2', '3', '4']);
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
      const recordedOrders = terminalHashManager.getOrdersByHash('accountId', updatedHash2);
      const completedOrders = terminalHashManager.getCompletedOrdersByHash('accountId', updatedHash2);
      sinon.assert.match(recordedOrders, {
        1: orders[0]
      });
      sinon.assert.match(completedOrders, ['2', '4', '3']);
      await clock.tickAsync(550000);
      const recordedOrders2 = terminalHashManager.getOrdersByHash('accountId', updatedHash2);
      const completedOrders2 = terminalHashManager.getCompletedOrdersByHash('accountId', updatedHash2);
      sinon.assert.match(recordedOrders2, {
        1: orders[0]
      });
      sinon.assert.match(completedOrders2, ['2', '3']);
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
    const specsData = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', specificationsHash);
    sinon.assert.match(specsData, { EURUSD: { symbol: 'EURUSD', tickSize: 0.0001 } });

    const positionsData = terminalHashManager.getPositionsByHash('accountId', positionsHash);
    sinon.assert.match(positionsData, { 1: {id: '1', volume: 10} });

    const ordersData = terminalHashManager.getOrdersByHash('accountId', ordersHash);
    sinon.assert.match(ordersData, { 1: {id: '1', openPrice: 10} });
    terminalHashManager.removeConnectionReferences('ICMarkets-Demo02', 'accountId',
      'connectionId', 'vint-hill:1:ps-mpa-1');
    await clock.tickAsync(16 * 60 * 1000);

    const specsData2 = terminalHashManager.getSpecificationsByHash('ICMarkets-Demo02', specificationsHash);
    sinon.assert.match(specsData2, null);

    const positionsData2 = terminalHashManager.getPositionsByHash('accountId', positionsHash);
    sinon.assert.match(positionsData2, null);

    const ordersData2 = terminalHashManager.getOrdersByHash('accountId', ordersHash);
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
      terminalHashManager.getSpecificationsHashesByHash('ICMarkets-Demo02', specificationsHash);
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
      terminalHashManager.getSpecificationsHashesByHash('ICMarkets-Demo02', specificationsHash);
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
