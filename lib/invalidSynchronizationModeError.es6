'use strict';

/**
 * Error which indicates that MetaApi MetaTrader account was created with synchronization mode which does not support
 * streaming API. See https://metaapi.cloud/docs/client/websocket/synchronizationMode/ for more details
 */
export default class InvalidSynchronizationModeError extends Error {

  /**
   * Constructs the error
   * @param {MetatraderAccount} account MetaTrader account
   */
  constructor(account) {
    super(`Your acount ${account.name} (${account.id}) was created with ${account.synchronizationMode} ` +
      'synchronization mode which does not supports the streaming API. Thus please update your account to \'user\' ' +
      'synchronization mode if to invoke this method. See ' +
      'https://metaapi.cloud/docs/client/websocket/synchronizationMode/ for more details');
    this.name = 'InvalidSynchronizationModeError';
  }

}
