'use strict';

import should from 'should';
require('fake-indexeddb/auto');
import {deleteDB} from 'idb';
import BrowserHistoryDatabase from './browserHistoryDatabase';

describe('BrowserHistoryDatabase', () => {

  let db;

  before(async () => {
    db = BrowserHistoryDatabase.getInstance();
  });

  beforeEach(async () => {
    await deleteDB('metaapi');
  });

  afterEach(async () => {
    await deleteDB('metaapi');
  });

  it('should clear db', async () => {
    await db.flush('accountId', 'MetaApi', [{id: '2'}], [{id: '1'}]);
    await db.clear('accountId', 'MetaApi');
    let {deals, historyOrders} = await db.loadHistory('accountId', 'MetaApi');
    deals.should.match([]);
    historyOrders.should.match([]);
  });

  it('should record and then read db contents', async () => {
    await db.flush('accountId', 'MetaApi', [{id: '2'}], [{id: '1'}]);
    await db.flush('accountId', 'MetaApi', [{id: '3'}], [{id: '2'}]);
    let {deals, historyOrders} = await db.loadHistory('accountId', 'MetaApi');
    deals.should.match([{id: '1'}, {id: '2'}]);
    historyOrders.should.match([{id: '2'}, {id: '3'}]);
  });

});
