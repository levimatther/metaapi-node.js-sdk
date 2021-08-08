'use strict';

import MetaApi from './metaApi/metaApi';
import HistoryStorage from './metaApi/historyStorage';
import MemoryHistoryStorage from './metaApi/memoryHistoryStorage';
import SynchronizationListener from './clients/metaApi/synchronizationListener';
import CopyFactory from 'metaapi.cloud-copyfactory-sdk';
import MetaStats from 'metaapi.cloud-metastats-sdk';
import LoggerManager from './logger';

export default MetaApi;

export {
  HistoryStorage,
  SynchronizationListener,
  MemoryHistoryStorage,
  CopyFactory,
  MetaStats,
  LoggerManager
};
