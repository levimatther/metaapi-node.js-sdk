import sinon from 'sinon';
import ReferenceTree from './referenceTree';
import TerminalHashManager from './terminalHashManager';

/**
 * @test {ReferenceTree}
 */
describe('ReferenceTree', () => {

  let sandbox, clock, hashManager;
  let tree = new ReferenceTree(hashManager, 'id', 'positions');
  let fuzzyTree = new ReferenceTree(hashManager, 'symbol', 'specifications', true);
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
    hashManager = new TerminalHashManager(clientApiClient);
    tree = new ReferenceTree(hashManager, 'id', 'positions');
    fuzzyTree = new ReferenceTree(hashManager, 'symbol', 'specifications', true);
  });

  afterEach(() => {
    clock.restore();
    sandbox.restore();
  });

  it('should record data', async () => {
    const data = [{id: '1', volume: 10}, {id: '2', volume: 20}];
    const nodata = tree.getItemsByHash('accountId', 'test');
    sinon.assert.match(nodata, null);
    const hash = await tree.recordItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', data);
    const nodata2 = tree.getItemsByHash('accountId', 'test2');
    sinon.assert.match(nodata2, null);
    const expectedHashes = ['f915d7e4b04a30a96fe6cf770a38fedb', 'c472cdc6239536770a7279af01fc10a7'];
    const items = tree.getItemsByHash('accountId', hash);
    sinon.assert.match(items, { 1: data[0], 2: data[1]});
    const hashes = tree.getHashesByHash('accountId', hash);
    sinon.assert.match(hashes[1], expectedHashes[0]);
    sinon.assert.match(hashes[2], expectedHashes[1]);
  });

  it('should update data', async () => {
    const items = [{id: '1', volume: 10}, {id: '2', volume: 20}, {id: '3', volume: 30}];
    const hash = await tree.recordItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', items); 
    const newItems = [{id: '1', volume: 30}];
    const updatedHash = await tree.updateItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', newItems, [], hash);
    const recordedItems = tree.getItemsByHash('accountId', updatedHash);
    sinon.assert.match(recordedItems, {
      1: newItems[0],
      2: items[1],
      3: items[2]
    });

    const hashes = tree.getHashesByHash('accountId', updatedHash);
    sinon.assert.match(hashes, {
      1: await hashManager.getItemHash(newItems[0], 'positions', 'cloud-g1', 'vint-hill'),
      2: await hashManager.getItemHash(items[1], 'positions', 'cloud-g1', 'vint-hill'),
      3: await hashManager.getItemHash(items[2], 'positions', 'cloud-g1', 'vint-hill')
    });
    const newItems2 = [{id: '3', volume: 50}];
    const updatedHash2 = await tree.updateItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', newItems2, [], updatedHash);
    const recordedItems2 = tree.getItemsByHash('accountId', updatedHash2);
    sinon.assert.match(recordedItems2, {
      1: newItems[0],
      2: items[1],
      3: newItems2[0]
    });
    const hashes2 = tree.getHashesByHash('accountId', updatedHash2);
    sinon.assert.match(hashes2, {
      1: await hashManager.getItemHash(newItems[0], 'positions', 'cloud-g1', 'vint-hill'),
      2: await hashManager.getItemHash(items[1], 'positions', 'cloud-g1', 'vint-hill'),
      3: await hashManager.getItemHash(newItems2[0], 'positions', 'cloud-g1', 'vint-hill')
    });
  });

  it('should remove last item in data', async () => {
    const items = [{id: '1', volume: 10}, {id: '2', volume: 20}, {id: '3', volume: 30}];
    const hash = await tree.recordItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', items); 
    const updatedHash = await tree.updateItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', [], ['1', '2', '3'], hash);
    const recordedItems = tree.getItemsByHash('accountId', updatedHash);
    sinon.assert.match(updatedHash, null);
    sinon.assert.match(recordedItems, null);
  });

  it('should update fuzzy tree data', async () => {
    const hash = await fuzzyTree.recordItems('ICMarkets-Demo02', 'cloud-g1',
      'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
        {symbol: 'CADUSD', tickSize: 0.001}]);
    const updatedHash = await fuzzyTree.updateItems('ICMarkets-Demo01', 'cloud-g1',
      'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'AUDUSD', tickSize: 0.001}, {symbol: 'BTCUSD'},
        {symbol: 'CADUSD', tickSize: 0.002}], ['GBPUSD'], hash);
    try {
      await fuzzyTree.updateItems('Different-Server', 'cloud-g1',
        'connectionId', 'vint-hill:1:ps-mpa-1', [{symbol: 'AUDUSD', tickSize: 0.05}], ['GBPUSD'], hash);
      sinon.assert.fail();
    } catch (error) {
      sinon.assert.match(error.message, 'Parent data doesn\'t exist');
    }
    const data = fuzzyTree.getItemsByHash('ICMarkets-Demo01', updatedHash);
    const data2 = fuzzyTree.getItemsByHash('ICMarkets-Demo02', updatedHash);
    const hashes = fuzzyTree.getHashesByHash('ICMarkets-Demo01', updatedHash);
    const hashes2 = fuzzyTree.getHashesByHash('ICMarkets-Demo02', updatedHash);
    sinon.assert.match(data, data2);
    sinon.assert.match(hashes, null);
    sinon.assert.match(hashes2, {
      EURUSD: 'c1bb242487a96fcc1d1283f31227024c',
      CADUSD: '953493300b07e741327a5ae34daf6c41',
      AUDUSD: '546fe6db57ef786c875de2d62acf91fd',
      BTCUSD: '85cd5a4604853a7448cdd64c67756043'
    });
  });

  it('should remove items', async () => {
    const items = [{id: '1', volume: 10}, {id: '2', volume: 20},
      {id: '3', volume: 30}, {id: '4', volume: 40}];
    const hash = await tree.recordItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', items);
    await clock.tickAsync(500);
    const updatedHash = await tree.updateItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', [], ['2'], hash);
    const recordedItems = tree.getItemsByHash('accountId', updatedHash);
    sinon.assert.match(recordedItems, {
      1: items[0],
      3: items[2],
      4: items[3]
    });
    await clock.tickAsync(500);
    const updatedHash2 = await tree.updateItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', [], ['2'], updatedHash);
    const recordedItems2 = tree.getItemsByHash('accountId', updatedHash2);
    sinon.assert.match(updatedHash, updatedHash2);
    sinon.assert.match({
      1: items[0],
      3: items[2],
      4: items[3]
    }, recordedItems2);
    await clock.tickAsync(500);
    const updatedHash3 = await tree.updateItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', [], ['3'], updatedHash2);
    const recordedItems3 = tree.getItemsByHash('accountId', updatedHash3);
    sinon.assert.match({
      1: items[0],
      4: items[3]
    }, recordedItems3);
    await clock.tickAsync(500);
    const updatedHash4 = await tree.updateItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', [], ['3', '4'], updatedHash3);
    const recordedItems4 = tree.getItemsByHash('accountId', updatedHash4);
    sinon.assert.match({
      1: items[0]
    }, recordedItems4);
  });

  it('should optimize tree', async () => {
    const items = [{id: '1', volume: 10}, {id: '2', volume: 20},
      {id: '3', volume: 30}, {id: '4', volume: 40}];
    const hash = await tree.recordItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', items);
    await clock.tickAsync(60000);
    const updatedHash = await tree.updateItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', [], ['2', '4'], hash);
    await clock.tickAsync(60000);
    const updatedHash2 = await tree.updateItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', [], ['2', '3'], updatedHash);
    const recordedItems = tree.getItemsByHash('accountId', updatedHash2);
    sinon.assert.match(recordedItems, {
      1: items[0]
    });
    await clock.tickAsync(550000);
    const recordedItems2 = tree.getItemsByHash('accountId', updatedHash2);
    sinon.assert.match({
      1: items[0]
    }, recordedItems2);
  });

  it('should remove connection references', async () => {
    const items = [{id: '1', volume: 10}];
    const itemsHash = await tree.recordItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', items);
    await clock.tickAsync(16 * 60 * 1000);
    const itemsData = tree.getItemsByHash('accountId', itemsHash);
    sinon.assert.match(itemsData, { 1: {id: '1', volume: 10} });

    tree.removeReference('accountId', 'connectionId', 'vint-hill:1:ps-mpa-1');
    await clock.tickAsync(16 * 60 * 1000);

    const itemsData2 = tree.getItemsByHash('accountId', itemsHash);
    sinon.assert.match(itemsData2, null);
  });

  it('should get last used hashes', async () => {
    const items = [{id: '1', volume: 10}, {id: '2', volume: 20},
      {id: '3', volume: 30}, {id: '4', volume: 40}];
    const hash = await tree.recordItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', items);
    await clock.tickAsync(500);
    await tree.recordItems('accountId2', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', [items[0]]);
    await clock.tickAsync(500);
    const hash3 = await tree.recordItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', [items[1]]);
    const lastUsedHashes = tree.getLastUsedHashes('accountId');
    sinon.assert.match(lastUsedHashes, [hash3, hash]);
  });

  it('should get fuzzy last used hashes', async () => {
    const data1 = [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, {symbol: 'CADUSD', tickSize: 0.001}];
    const data2 = [{symbol: 'EURUSD', tickSize: 0.0002}, {symbol: 'GBPUSD'}, {symbol: 'CADUSD', tickSize: 0.002}];
    const data3 = [{symbol: 'EURUSD', tickSize: 0.0003}, {symbol: 'GBPUSD'}, {symbol: 'CADUSD', tickSize: 0.003}];
    const hash1 = await fuzzyTree.recordItems('ICMarkets-Demo01', 'cloud-g1',
      'connectionId', 'vint-hill:1:ps-mpa-1', data1);
    const hash2 = await fuzzyTree.recordItems('ICMarkets-Demo02', 'cloud-g1',
      'connectionId', 'vint-hill:1:ps-mpa-1', data2);
    await fuzzyTree.recordItems('Other-Server', 'cloud-g1',
      'connectionId', 'vint-hill:1:ps-mpa-1', data3);
    const lastUsedHashes = fuzzyTree.getLastUsedHashes('ICMarkets-Demo01');
    sinon.assert.match(lastUsedHashes, [hash1, hash2]);
  });

  it('should add reference', async () => {
    try {
      tree.addReference('accountId', 'wronghash', 'connectionId', 'vint-hill:1:ps-mpa-1');
      sinon.assert.fail();
    } catch (error) {
      sinon.assert.match(error.message, 'Can\'t add reference - positions category data accountId doesn\'t exist');
    }
    const items = [{id: '1', volume: 10}, {id: '2', volume: 20},
      {id: '3', volume: 30}, {id: '4', volume: 40}];
    const expected = {
      1: items[0],
      2: items[1],
      3: items[2],
      4: items[3]
    };
    const hash = await tree.recordItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', items);
    try {
      tree.addReference('accountId', 'wronghash', 'connectionId2', 'vint-hill:1:ps-mpa-1');
      sinon.assert.fail();
    } catch (error) {
      sinon.assert.match(error.message,
        'Can\'t add reference - positions data accountId for hash wronghash doesn\'t exist');
    }
    tree.addReference('accountId', hash, 'connectionId2', 'vint-hill:1:ps-mpa-1');
    const result = tree.getItemsByHash('accountId', hash);
    sinon.assert.match(result, expected);
    await clock.tickAsync(550000); 
    const result2 = tree.getItemsByHash('accountId', hash);
    sinon.assert.match(result2, expected);
    tree.removeReference('accountId', 'connectionId', 'vint-hill:1:ps-mpa-1');
    await clock.tickAsync(550000);
    const result3 = tree.getItemsByHash('accountId', hash);
    sinon.assert.match(result3, expected);
    tree.removeReference('accountId', 'connectionId2', 'vint-hill:1:ps-mpa-1');
    await clock.tickAsync(550000);
    const result4 = tree.getItemsByHash('accountId', hash);
    sinon.assert.match(result4, null);
  });

  it('should add fuzzy reference', async () => {
    try {
      fuzzyTree.addReference('ICMarkets-Demo01', 'wronghash', 'connectionId', 'vint-hill:1:ps-mpa-1');
      sinon.assert.fail();
    } catch (error) {
      sinon.assert.match(error.message, 'Can\'t add reference - specifications category data ' +
      'ICMarkets-Demo01 doesn\'t exist');
    }

    const items = [{symbol: 'EURUSD', tickSize: 0.0001}, {symbol: 'GBPUSD'}, 
      {symbol: 'CADUSD', tickSize: 0.001}];
    const expected = {
      CADUSD: items[2],
      GBPUSD: items[1],
      EURUSD: items[0]
    };
    const hash = await fuzzyTree.recordItems('ICMarkets-Demo01', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', items);
    try {
      fuzzyTree.addReference('ICMarkets-Demo01', 'wronghash', 'connectionId2', 'vint-hill:1:ps-mpa-1');
      sinon.assert.fail();
    } catch (error) {
      sinon.assert.match(error.message,
        'Can\'t add reference - specifications data ICMarkets-Demo01 for hash wronghash doesn\'t exist');
    }
    fuzzyTree.addReference('ICMarkets-Demo02', hash, 'connectionId2', 'vint-hill:1:ps-mpa-1');
    const result = fuzzyTree.getItemsByHash('ICMarkets-Demo01', hash);
    sinon.assert.match(result, expected);
    await clock.tickAsync(550000); 
    const result2 = fuzzyTree.getItemsByHash('ICMarkets-Demo01', hash);
    sinon.assert.match(result2, expected);
    fuzzyTree.removeReference('ICMarkets-Demo01', 'connectionId', 'vint-hill:1:ps-mpa-1');
    await clock.tickAsync(550000);
    const result3 = fuzzyTree.getItemsByHash('ICMarkets-Demo01', hash);
    sinon.assert.match(result3, expected);
    fuzzyTree.removeReference('ICMarkets-Demo02', 'connectionId2', 'vint-hill:1:ps-mpa-1');
    await clock.tickAsync(550000);
    const result4 = fuzzyTree.getItemsByHash('ICMarkets-Demo01', hash);
    sinon.assert.match(result4, null);
  });

  it('should hand over children to the parent if the middle record is optimized out', async () => {
    const items = [{id: '1', volume: 10}, {id: '2', volume: 20},
      {id: '3', volume: 30}, {id: '4', volume: 40}];
    const hash = await tree.recordItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', items);
    await clock.tickAsync(60000);
    const updatedHash = await tree.updateItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', [], ['2', '4'], hash);
    await clock.tickAsync(60000);
    const updatedHash2 = await tree.updateItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', [], ['2', '3'], updatedHash);
    tree.addReference('accountId', hash, 'connectionId2', 'vint-hill:1:ps-mpa-1');
    await clock.tickAsync(5500000);
    tree.removeReference('accountId', 'connectionId2', 'vint-hill:1:ps-mpa-1');
    await clock.tickAsync(5500000);
    const newHash = await tree.updateItems('accountId', 'cloud-g1', 'connectionId',
      'vint-hill:1:ps-mpa-1', [{id: '4', volume: 30}], [], updatedHash2);
    const data = tree.getItemsByHash('accountId', newHash);
    sinon.assert.match(data, { '1': { id: '1', volume: 10 }, '4': { id: '4', volume: 30 } });
  });

});