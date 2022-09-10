import MetaApiWebsocketClient, {
    Margin,
    MarginOrder, MetatraderTradeResponse,
    TrailingStopLoss
} from "../clients/metaApi/metaApiWebsocket.client";
import SynchronizationListener from "../clients/metaApi/synchronizationListener";
import MetatraderAccount from "./metatraderAccount";

/**
 * Exposes MetaApi MetaTrader API connection to consumers
 */
export default class MetaApiConnection extends SynchronizationListener {
  
  /**
   * Constructs MetaApi MetaTrader Api connection
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {string} [application] application to use
   */
  constructor(websocketClient: MetaApiWebsocketClient, account: MetatraderAccount, application: string);

  /**
   * Opens the connection. Can only be called the first time, next calls will be ignored.
   * @param {string} instanceId connection instance id
   * @return {Promise} promise resolving when the connection is opened
   */
  connect(instanceId: string): Promise<void>;

  /**
   * Closes the connection. The instance of the class should no longer be used after this method is invoked.
   * @param {string} instanceId connection instance id
   */
  close(instanceId: string): Promise<void>;

  /**
   * Returns MetaApi account
   * @return {MetatraderAccount} MetaApi account
   */
  get account(): MetatraderAccount;

  /**
   * Returns connection application
   * @return {string} connection application
   */
  get application(): string;

}
