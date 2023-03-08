import { MetatraderOrder, MetatraderPosition, MetatraderSymbolSpecification } from "../clients/metaApi/metaApiWebsocket.client"
import ClientApiClient from "../clients/metaApi/clientApi.client"

export default class TerminalHashManager {

  /**
   * Constructs the instance of terminal hash manager class
   * @param {ClientApiClient} clientApiClient client api client
   * @param {boolean} [keepHashTrees] if set to true, unused data will not be cleared (for use in debugging)
   */
  constructor(clientApiClient: ClientApiClient, keepHashTrees?: boolean)

  /**
   * Refreshes hashing ignored field lists
   * @param {String} region account region
   * @returns {Promise} promise resolving when the hashing field lists are updated.
   */
  refreshIgnoredFieldLists(region: string): Promise;

  /**
   * Returns specifications data by hash
   * @param {string} specificationsHash specifications hash
   * @returns {[id: string]: MetatraderSymbolSpecification}
   */
  getSpecificationsByHash(specificationsHash: string): {[id: string]: MetatraderSymbolSpecification};

  /**
   * Returns specifications hash data by hash
   * @param {string} specificationsHash specifications hash
   * @returns {[id: string]: string}
   */
  getSpecificationsHashesByHash(specificationsHash: string): {[id: string]: string};

  /**
   * Returns positions data by hash
   * @param {string} positionsHash positions hash
   * @returns {[id: string]: MetatraderPosition}
   */
  getPositionsByHash(positionsHash: string): {[id: string]: MetatraderPosition};

  /**
   * Returns the list of removed position ids for specified hash
   * @param {string} positionsHash positions hash
   * @returns {string[]} removed position ids
   */
  getRemovedPositionsByHash(positionsHash: string): string[];

  /**
   * Returns positions hash data by hash
   * @param {string} positionsHash positions hash
   * @returns {[id: string]: string} dictionary of position hashes
   */
  getPositionsHashesByHash(positionsHash: string): {[id: string]: string};

  /**
   * Returns orders data by hash
   * @param {string} ordersHash orders hash
   * @returns {[id: string]: MetatraderOrder} removed position ids
   */
  getOrdersByHash(ordersHash: string): {[id: string]: MetatraderOrder};

  /**
   * Returns completed orders data by hash
   * @param {string} ordersHash orders hash
   * @returns {string[]} completed order ids
   */
  getCompletedOrdersByHash(ordersHash: string): string[];

  /**
   * Returns orders hash data by hash
   * @param {string} ordersHash orders hash
   * @returns {[id: string]: string} dictionary of order hashes
   */
  getOrdersHashesByHash(ordersHash: string): {[id: string]: string};

  /**
   * Creates an entry for specification data and returns hash
   * @param {string} serverName broker server name 
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {MetatraderSymbolSpecification[]} specifications specifications array
   * @returns {string} dictionary hash
   */
  recordSpecifications(serverName: string, accountType: string, connectionId: string,
    instanceIndex: string, specifications: string): Promise<string>;

  /**
   * Updates specification data
   * @param {string} serverName broker server name 
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {MetatraderSymbolSpecification[]} specifications specifications array
   * @param {string[]} removedSymbols removed specification symbols
   * @param {string} parentHash parent hash
   * @returns {string} updated dictionary hash
   */
  updateSpecifications(serverName: string, accountType: string, connectionId: string, instanceIndex: string,
    specifications: MetatraderSymbolSpecification[], removedSymbols: string[], parentHash: string): Promise<string>;

  /**
   * Creates an entry for positions data and returns hash
   * @param {string} accountId account id
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {MetatraderPosition[]} positions positions array
   * @returns {string} dictionary hash
   */
  recordPositions(accountId: string, accountType: string, connectionId: string, instanceIndex: string,
    positions: MetatraderPosition[]): Promise<string>;

  /**
   * Updates positions data
   * @param {string} accountId account id 
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {MetatraderPosition[]} positions positions
   * @param {string[]} removedPositions removed position ids
   * @param {string} parentHash parent hash
   * @returns {string} updated dictionary hash
   */
  updatePositions(accountId: string, accountType: string, connectionId: string,
    instanceIndex: string, positions: MetatraderPosition[], removedPositions: string[],
    parentHash: string): Promise<string>;

  /**
   * Creates an entry for orders data and returns hash
   * @param {string} accountId account id 
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {MetatraderOrder[]} orders orders array
   * @returns {string} dictionary hash
   */
  recordOrders(accountId: string, accountType: string, connectionId: string, instanceIndex: string,
    orders: MetatraderOrder[]): Promise<string>;
  
  /**
   * Updates orders data
   * @param {string} accountId account id 
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {MetatraderOrder[]} orders orders array
   * @param {string[]} completedOrders completed order ids
   * @param {string} parentHash parent hash
   * @returns {string} updated dictionary hash
   */
  updateOrders(accountId: string, accountType: string, connectionId: string,
    instanceIndex: string, orders: MetatraderOrder[], completedOrders: string[], parentHash: string): Promise<string>;

  /**
   * Returns the list of last used specification hashes, with specified server hashes prioritized
   * @param {string} serverName server name
   * @returns {string[]} last used specification hashes
   */
  getLastUsedSpecificationHashes(serverName: string): string[];
  
  /**
   * Returns the list of last used position hashes
   * @param {string} accountId account id
   * @returns {string[]} last used position hashes
   */
  getLastUsedPositionHashes(accountId: string): string[];

  /**
   * Returns the list of last used order hashes
   * @param {string} accountId account id
   * @returns {string[]} last used order hashes
   */
  getLastUsedOrderHashes(accountId: string): string[];
  
  /**
   * Removes all references for a connection
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removeConnectionReferences(connectionId: string, instanceIndex: string): void;

  /**
   * Adds a reference from a terminal state instance index to a specifications hash
   * @param {string} hash specifications hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  addSpecificationReference(hash: string, connectionId: string, instanceIndex: string): void;

  /**
   * Removes a reference from a terminal state instance index to a specifications hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removeSpecificationReference(connectionId: string, instanceIndex: string): void;

  /**
   * Adds a reference from a terminal state instance index to a positions hash
   * @param {string} hash positions hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  addPositionReference(hash: string, connectionId: string, instanceIndex: string): void;

  /**
   * Removes a reference from a terminal state instance index to a positions hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removePositionReference(connectionId: string, instanceIndex: string): void;

  /**
   * Adds a reference from a terminal state instance index to a orders hash
   * @param {string} hash positions hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  addOrderReference(hash: string, connectionId: string, instanceIndex: string): void;

  /**
   * Removes a reference from a terminal state instance index to a orders hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removeOrderReference(connectionId: string, instanceIndex: string): void;

}
