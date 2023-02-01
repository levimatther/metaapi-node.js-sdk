import crypto from 'crypto-js';
import Fuse from 'fuse.js';
import ReferenceTree from './referenceTree';

/**
 * Responsible for handling positions, orders, and specifications hash data
 */
export default class TerminalHashManager {

  /**
   * Constructs the instance of terminal hash manager class
   * @param {ClientApiClient} clientApiClient client api client
   */
  constructor(clientApiClient) {
    this._clientApiClient = clientApiClient;
    this._specificationsTree = new ReferenceTree(this, 'symbol', 'specifications', true);
    this._positionsTree = new ReferenceTree(this, 'id', 'positions');
    this._ordersTree = new ReferenceTree(this, 'id', 'orders');
  }

  /**
   * Returns specifications data by hash
   * @param {string} serverName server name
   * @param {string} specificationsHash specifications hash
   * @returns {[id: string]: MetatraderSymbolSpecification}
   */
  getSpecificationsByHash(serverName, specificationsHash){
    return this._specificationsTree.getItemsByHash(serverName, specificationsHash);
  }

  /**
   * Returns specifications hash data by hash
   * @param {string} serverName server name
   * @param {string} specificationsHash specifications hash
   * @returns {[id: string]: string}
   */
  getSpecificationsHashesByHash(serverName, specificationsHash){
    return this._specificationsTree.getHashesByHash(serverName, specificationsHash);
  }

  /**
   * Returns positions data by hash
   * @param {string} accountId account id
   * @param {string} positionsHash positions hash
   * @returns {[id: string]: MetatraderPosition}
   */
  getPositionsByHash(accountId, positionsHash) {
    return this._positionsTree.getItemsByHash(accountId, positionsHash);
  }

  /**
   * Returns positions hash data by hash
   * @param {string} accountId account id
   * @param {string} positionsHash positions hash
   * @returns {[id: string]: string} dictionary of position hashes
   */
  getPositionsHashesByHash(accountId, positionsHash) {
    return this._positionsTree.getHashesByHash(accountId, positionsHash);
  }

  /**
   * Returns orders data by hash
   * @param {string} accountId account id
   * @param {string} ordersHash orders hash
   * @returns {[id: string]: MetatraderOrder} removed position ids
   */
  getOrdersByHash(accountId, ordersHash){
    return this._ordersTree.getItemsByHash(accountId, ordersHash);
  }

  /**
   * Returns orders hash data by hash
   * @param {string} accountId account id
   * @param {string} ordersHash orders hash
   * @returns {[id: string]: string} dictionary of order hashes
   */
  getOrdersHashesByHash(accountId, ordersHash) {
    return this._ordersTree.getHashesByHash(accountId, ordersHash);
  }

  /**
   * Creates an entry for specification data and returns hash
   * @param {string} serverName broker server name 
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {MetatraderSymbolSpecification[]} specifications specifications array
   * @returns {string} dictionary hash
   */
  async recordSpecifications(serverName, accountType, connectionId,
    instanceIndex, specifications) {
    return this._specificationsTree.recordItems(serverName, accountType, connectionId,
      instanceIndex, specifications);
  }

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
  // eslint-disable-next-line complexity
  async updateSpecifications(serverName, accountType, connectionId,
    instanceIndex, specifications, removedSymbols, parentHash) {
    return this._specificationsTree.updateItems(serverName, accountType, connectionId,
      instanceIndex, specifications, removedSymbols, parentHash);
  }

  /**
   * Creates an entry for positions data and returns hash
   * @param {string} accountId account id
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {MetatraderPosition[]} positions positions array
   * @returns {string} dictionary hash
   */
  async recordPositions(accountId, accountType, connectionId, instanceIndex, positions) {
    return this._positionsTree.recordItems(accountId, accountType, connectionId, instanceIndex, positions);
  }

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
  async updatePositions(accountId, accountType, connectionId,
    instanceIndex, positions, removedPositions, parentHash) {
    return this._positionsTree.updateItems(accountId, accountType, connectionId,
      instanceIndex, positions, removedPositions, parentHash);
  }

  /**
   * Creates an entry for orders data and returns hash
   * @param {string} accountId account id 
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {Array<MetatraderOrder>} orders orders array
   * @returns {string} dictionary hash
   */
  async recordOrders(accountId, accountType, connectionId, instanceIndex, orders) {
    return this._ordersTree.recordItems(accountId, accountType, connectionId, instanceIndex, orders);
  }

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
  async updateOrders(accountId, accountType, connectionId,
    instanceIndex, orders, completedOrders, parentHash) {
    return this._ordersTree.updateItems(accountId, accountType, connectionId,
      instanceIndex, orders, completedOrders, parentHash);
  }

  /**
   * Returns the list of last used specification hashes, with specified server hashes prioritized
   * @param {string} serverName server name
   * @returns {string[]} last used specification hashes
   */
  getLastUsedSpecificationHashes(serverName) {
    return this._specificationsTree.getLastUsedHashes(serverName);
  }
  
  /**
   * Returns the list of last used position hashes
   * @param {string} accountId account id
   * @returns {string[]} last used position hashes
   */
  getLastUsedPositionHashes(accountId) {
    return this._positionsTree.getLastUsedHashes(accountId);
  }
  
  /**
   * Returns the list of last used order hashes
   * @param {string} accountId account id
   * @returns {string[]} last used order hashes
   */
  getLastUsedOrderHashes(accountId) {
    return this._ordersTree.getLastUsedHashes(accountId);
  }

  /**
   * Removes all references for a connection
   * @param {string} serverName broker server name
   * @param {string} accountId account id
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removeConnectionReferences(serverName, accountId, connectionId, instanceIndex) {
    this.removeSpecificationReference(serverName, connectionId, instanceIndex);
    this.removePositionReference(accountId, connectionId, instanceIndex);
    this.removeOrderReference(accountId, connectionId, instanceIndex);
  }

  /**
   * Adds a reference from a terminal state instance index to a specifications hash
   * @param {string} serverName server name 
   * @param {string} hash specifications hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  addSpecificationReference(serverName, hash, connectionId, instanceIndex) {
    this._specificationsTree.addReference(serverName, hash, connectionId, instanceIndex);
  }

  /**
   * Removes a reference from a terminal state instance index to a specifications hash
   * @param {string} serverName server name
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removeSpecificationReference(serverName, connectionId, instanceIndex) {
    this._specificationsTree.removeReference(serverName, connectionId, instanceIndex);
  }

  /**
   * Adds a reference from a terminal state instance index to a positions hash
   * @param {string} accountId account id
   * @param {string} hash positions hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  addPositionReference(accountId, hash, connectionId, instanceIndex) {
    this._positionsTree.addReference(accountId, hash, connectionId, instanceIndex);
  }

  /**
   * Removes a reference from a terminal state instance index to a positions hash
   * @param {string} accountId account id
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removePositionReference(accountId, connectionId, instanceIndex) {
    this._positionsTree.removeReference(accountId, connectionId, instanceIndex);
  }

  /**
   * Adds a reference from a terminal state instance index to a orders hash
   * @param {string} accountId account id
   * @param {string} hash positions hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  addOrderReference(accountId, hash, connectionId, instanceIndex) {
    this._ordersTree.addReference(accountId, hash, connectionId, instanceIndex);
  }

  /**
   * Removes a reference from a terminal state instance index to a orders hash
   * @param {string} accountId account id
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removeOrderReference(accountId, connectionId, instanceIndex) {
    this._ordersTree.removeReference(accountId, connectionId, instanceIndex);
  }

  // eslint-disable-next-line complexity
  async getItemHash(item, type, accountType, region) {
    const hashFields = await this._clientApiClient.getHashingIgnoredFieldLists(region);
    item = Object.assign({}, item);
    switch(type) {
    case 'specifications':
      if(accountType === 'cloud-g1') {
        hashFields.g1.specification.forEach(field => delete item[field]);
      } else if(accountType === 'cloud-g2') {
        hashFields.g2.specification.forEach(field => delete item[field]);
      }
      return this._getHash(item, accountType, ['digits']);
    case 'positions':
      if(accountType === 'cloud-g1') {
        hashFields.g1.position.forEach(field => delete item[field]);
      } else if(accountType === 'cloud-g2') {
        hashFields.g2.position.forEach(field => delete item[field]);
      }
      return this._getHash(item, accountType, ['magic']);
    case 'orders':
      if(accountType === 'cloud-g1') {
        hashFields.g1.order.forEach(field => delete item[field]);
      } else if(accountType === 'cloud-g2') {
        hashFields.g2.order.forEach(field => delete item[field]);
      }
      return this._getHash(item, accountType, ['magic']);
    }
  }

  _getHash(obj, accountType, integerKeys) {
    let jsonItem = '';
    if(accountType === 'cloud-g1') {
      const stringify = (objFromJson, key) => {
        if(typeof objFromJson === 'number') {
          if(integerKeys.includes(key)) {
            return objFromJson;
          } else {
            return objFromJson.toFixed(8);
          }
        } else if(Array.isArray(objFromJson)) {
          return `[${objFromJson.map(item => stringify(item)).join(',')}]`; 
        } else if (objFromJson === null) {
          return objFromJson;
        } else if (typeof objFromJson !== 'object' || objFromJson.getTime){
          return JSON.stringify(objFromJson);
        }
    
        let props = Object
          .keys(objFromJson)
          .map(keyItem => `"${keyItem}":${stringify(objFromJson[keyItem], keyItem)}`)
          .join(',');
        return `{${props}}`;
      };
    
      jsonItem = stringify(obj);
    } else if(accountType === 'cloud-g2') {
      const stringify = (objFromJson, key) => {
        if(typeof objFromJson === 'number') {
          if(integerKeys.includes(key)) {
            return objFromJson;
          } else {
            return parseFloat(objFromJson.toFixed(8));
          }
        } else if(Array.isArray(objFromJson)) {
          return `[${objFromJson.map(item => stringify(item)).join(',')}]`; 
        } else if (objFromJson === null) {
          return objFromJson;
        } else if (typeof objFromJson !== 'object' || objFromJson.getTime){
          return JSON.stringify(objFromJson);
        }
    
        let props = Object
          .keys(objFromJson)
          .map(keyItem => `"${keyItem}":${stringify(objFromJson[keyItem], keyItem)}`)
          .join(',');
        return `{${props}}`;
      };

      jsonItem = stringify(obj);
    }
    return crypto.MD5(jsonItem).toString();
  }

}
