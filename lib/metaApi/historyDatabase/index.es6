'use strict';

const isBrowser = process.title === 'browser';

let HistoryDatabase;
if(isBrowser) {
  HistoryDatabase = require('./browserHistoryDatabase');
} else {
  HistoryDatabase = require('./filesystemHistoryDatabase');
}

export default HistoryDatabase;
