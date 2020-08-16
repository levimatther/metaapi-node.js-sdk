const isBrowser = process.title === 'browser';

let HistoryFileManager;
if(isBrowser) {
  HistoryFileManager = require('./browserManager');
} else {
  HistoryFileManager = require('./nodeManager');
}

export default HistoryFileManager;
