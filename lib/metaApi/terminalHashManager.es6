import crypto from 'crypto-js';
import Fuse from 'fuse.js';

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
    this._dataByHash = {
      specifications: {},
      positions: {},
      orders: {}
    };
    this._recordExpirationTime = 10 * 60 * 1000;
    this._optimizeTreesJob = this._optimizeTreesJob.bind(this);
    setInterval(this._optimizeTreesJob, 5 * 60 * 1000);
  }

  /**
   * Returns specifications data by hash
   * @param {string} serverName server name
   * @param {string} specificationsHash specifications hash
   * @returns {[id: string]: MetatraderSymbolSpecification}
   */
  // eslint-disable-next-line complexity
  getSpecificationsByHash(serverName, specificationsHash){
    let serverData = this._dataByHash.specifications[serverName];
    if(!serverData) {
      const nearbyServers = this._getSimilarServerNames(serverName);
      for (let server of nearbyServers) {
        if(this._dataByHash.specifications[server][specificationsHash]) {
          serverData = this._dataByHash.specifications[server];
        }
      }
    }
    if(!serverData) {
      return null;
    }
    const data = serverData[specificationsHash];
    if(!data) {
      return null;
    } else if(!data.parentHash) {
      return data.data;
    } else {
      /**
       * If specified hash is not a base hash, build a chain of hashes
       * to the base one, apply all changes and return
       */
      let hashChain = [specificationsHash];
      hashChain.unshift(data.parentHash);
      let parentData = serverData[data.parentHash];
      while(parentData.parentHash) {
        hashChain.unshift(parentData.parentHash);
        parentData = serverData[parentData.parentHash];
      }
      const state = Object.assign({}, serverData[hashChain.shift()].data);
      for(let chainHash of hashChain) {
        const chainData = serverData[chainHash];
        Object.keys(chainData.data).forEach(symbol => {
          state[symbol] = chainData.data[symbol];
        });
        chainData.removedSymbols.forEach(symbol => {
          delete state[symbol];
        });
      }
      return state;
    }
  }

  /**
   * Returns specifications hash data by hash
   * @param {string} serverName server name
   * @param {string} specificationsHash specifications hash
   * @returns {[id: string]: string}
   */
  // eslint-disable-next-line complexity
  getSpecificationsHashesByHash(serverName, specificationsHash){
    let serverData = this._dataByHash.specifications[serverName];
    if(!serverData) {
      return null;
    }
    const data = serverData[specificationsHash];
    if(!data) {
      return null;
    } else if(!data.parentHash) {
      return data.hashes;
    } else {
      let hashChain = [specificationsHash];
      hashChain.unshift(data.parentHash);
      let parentData = serverData[data.parentHash];
      while(parentData.parentHash) {
        hashChain.unshift(parentData.parentHash);
        parentData = serverData[parentData.parentHash];
      }
      const state = Object.assign({}, serverData[hashChain.shift()].hashes);
      for(let chainHash of hashChain) {
        const chainData = serverData[chainHash];
        Object.keys(chainData.hashes).forEach(symbol => {
          state[symbol] = chainData.hashes[symbol];
        });
        chainData.removedSymbols.forEach(symbol => {
          delete state[symbol];
        });
      }
      return state;
    }
  }

  /**
   * Returns positions data by hash
   * @param {string} accountId account id
   * @param {string} positionsHash positions hash
   * @returns {[id: string]: MetatraderPosition}
   */
  getPositionsByHash(accountId, positionsHash) {
    const accountData = this._dataByHash.positions[accountId];
    if(!accountData) {
      return null;
    }
    const data = accountData[positionsHash];
    if(!data) {
      return null;
    } else if(!data.parentHash) {
      return data.data;
    } else {
      /**
       * If specified hash is not a base hash, build a chain of hashes
       * to the base one, apply all changes and return
       */
      let hashChain = [positionsHash];
      hashChain.unshift(data.parentHash);
      let parentData = accountData[data.parentHash];
      while(parentData.parentHash) {
        hashChain.unshift(parentData.parentHash);
        parentData = accountData[parentData.parentHash];
      }
      const state = Object.assign({}, accountData[hashChain.shift()].data);
      const removedPositions = [];
      for(let chainHash of hashChain) {
        const chainData = accountData[chainHash];
        Object.keys(chainData.data).forEach(id => {
          state[id] = chainData.data[id];
        });
        chainData.removedPositions.forEach(id => {
          if(!removedPositions.includes(id)) {
            removedPositions.push(id);
          }
        });
      }
      removedPositions.forEach(id => delete state[id]);
      return state;
    }
  }

  /**
   * Returns the list of removed position ids for specified hash
   * @param {string} accountId account id
   * @param {string} positionsHash positions hash
   * @returns {string[]} removed position ids
   */
  getRemovedPositionsByHash(accountId, positionsHash){
    const accountData = this._dataByHash.positions[accountId];
    if(!accountData) {
      return [];
    }
    const data = accountData[positionsHash];
    if(!data) {
      return [];
    } else if(!data.parentHash) {
      return data.removedPositions;
    } else {
      /**
       * If specified hash is not a base hash, build a chain of hashes
       * to the base one, apply all changes and return
       */
      let hashChain = [positionsHash];
      hashChain.unshift(data.parentHash);
      let parentData = accountData[data.parentHash];
      while(parentData.parentHash) {
        hashChain.unshift(parentData.parentHash);
        parentData = accountData[parentData.parentHash];
      }
      const ids = [].concat(accountData[hashChain.shift()].removedPositions);
      for(let chainHash of hashChain) {
        const chainData = accountData[chainHash];
        chainData.removedPositions.forEach(id => {
          if(!ids.includes(id)) {
            ids.push(id);
          }
        });
      }
      return ids;
    }
  }

  /**
   * Returns positions hash data by hash
   * @param {string} accountId account id
   * @param {string} positionsHash positions hash
   * @returns {[id: string]: string} dictionary of position hashes
   */
  getPositionsHashesByHash(accountId, positionsHash) {
    const accountData = this._dataByHash.positions[accountId];
    if(!accountData) {
      return null;
    }
    const data = accountData[positionsHash];
    if(!data) {
      return null;
    } else if(!data.parentHash) {
      return data.hashes;
    } else {
      let hashChain = [positionsHash];
      hashChain.unshift(data.parentHash);
      let parentData = accountData[data.parentHash];
      while(parentData.parentHash) {
        hashChain.unshift(parentData.parentHash);
        parentData = accountData[parentData.parentHash];
      }
      const state = Object.assign({}, accountData[hashChain.shift()].hashes);
      for(let chainHash of hashChain) {
        const chainData = accountData[chainHash];
        Object.keys(chainData.hashes).forEach(positionId => {
          state[positionId] = chainData.hashes[positionId];
        });
        Object.keys(chainData.removedPositions).forEach(positionId => {
          delete state[positionId];
        });
      }
      return state;
    }
  }

  /**
   * Returns orders data by hash
   * @param {string} accountId account id
   * @param {string} ordersHash orders hash
   * @returns {[id: string]: MetatraderOrder} removed position ids
   */
  getOrdersByHash(accountId, ordersHash){
    const accountData = this._dataByHash.orders[accountId];
    if(!accountData) {
      return null;
    }
    const data = accountData[ordersHash];
    if(!data) {
      return null;
    } else if(!data.parentHash) {
      return data.data;
    } else {
      /**
       * If specified hash is not a base hash, build a chain of hashes
       * to the base one, apply all changes and return
       */
      let hashChain = [ordersHash];
      hashChain.unshift(data.parentHash);
      let parentData = accountData[data.parentHash];
      while(parentData.parentHash) {
        hashChain.unshift(parentData.parentHash);
        parentData = accountData[parentData.parentHash];
      }
      const state = Object.assign({}, accountData[hashChain.shift()].data);
      const completedOrders = [];
      for(let chainHash of hashChain) {
        const chainData = accountData[chainHash];
        Object.keys(chainData.data).forEach(id => {
          state[id] = chainData.data[id];
        });
        chainData.completedOrders.forEach(id => {
          if(!completedOrders.includes(id)) {
            completedOrders.push(id);
          }
        });
      }
      completedOrders.forEach(id => delete state[id]);
      return state;
    }
  }

  /**
   * Returns completed orders data by hash
   * @param {string} accountId account id
   * @param {string} ordersHash orders hash
   * @returns {string[]} completed order ids
   */
  getCompletedOrdersByHash(accountId, ordersHash) {
    const accountData = this._dataByHash.orders[accountId];
    if(!accountData) {
      return [];
    }
    const data = accountData[ordersHash];
    if(!data) {
      return [];
    } else if(!data.parentHash) {
      return data.completedOrders;
    } else {
      /**
       * If specified hash is not a base hash, build a chain of hashes
       * to the base one, apply all changes and return
       */
      let hashChain = [ordersHash];
      hashChain.unshift(data.parentHash);
      let parentData = accountData[data.parentHash];
      while(parentData.parentHash) {
        hashChain.unshift(parentData.parentHash);
        parentData = accountData[parentData.parentHash];
      }
      const state = [].concat(accountData[hashChain.shift()].completedOrders);
      for(let chainHash of hashChain) {
        const chainData = accountData[chainHash];
        chainData.completedOrders.forEach(id => {
          if(!state.includes(id)) {
            state.push(id);
          }
        });
      }
      return state;
    }
  }

  /**
   * Returns orders hash data by hash
   * @param {string} accountId account id
   * @param {string} ordersHash orders hash
   * @returns {[id: string]: string} dictionary of order hashes
   */
  getOrdersHashesByHash(accountId, ordersHash) {
    const accountData = this._dataByHash.orders[accountId];
    if(!accountData) {
      return null;
    }
    const data = accountData[ordersHash];
    if(!data) {
      return null;
    } else if(!data.parentHash) {
      return data.hashes;
    } else {
      let hashChain = [ordersHash];
      hashChain.unshift(data.parentHash);
      let parentData = accountData[data.parentHash];
      while(parentData.parentHash) {
        hashChain.unshift(parentData.parentHash);
        parentData = accountData[parentData.parentHash];
      }
      const state = Object.assign({}, accountData[hashChain.shift()].hashes);
      for(let chainHash of hashChain) {
        const chainData = accountData[chainHash];
        Object.keys(chainData.hashes).forEach(orderId => {
          state[orderId] = chainData.hashes[orderId];
        });
        chainData.completedOrders.forEach(orderId => {
          delete state[orderId];
        });
      }
      return state;
    }
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
    const region = instanceIndex.split(':')[0];
    const hashDictionary = {};
    const dataDictionary = {};

    for(let specification of specifications) {
      const hash = await this._getSpecificationHash(specification, accountType, region);
      dataDictionary[specification.symbol] = specification;
      hashDictionary[specification.symbol] = hash;
    }
    this._dataByHash.specifications[serverName] = this._dataByHash.specifications[serverName] || {};
    const serverData = this._dataByHash.specifications[serverName];
    const dictionaryHash = this._getArrayXor(Object.values(hashDictionary));
    this.removeSpecificationReference(serverName, connectionId, instanceIndex);
    if(serverData[dictionaryHash]) {
      this.addSpecificationReference(serverName, dictionaryHash, connectionId, instanceIndex);
    } else {
      this._dataByHash.specifications[serverName][dictionaryHash] = {
        hashes: hashDictionary,
        data: dataDictionary,
        removedSymbols: [],
        parentHash: null,
        childHashes: [],
        lastUpdated: Date.now(),
        references: {[connectionId]: [instanceIndex]}
      };
    }
    return dictionaryHash;
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
    const region = instanceIndex.split(':')[0];
    const hashDictionary = {};
    const dataDictionary = {};
    let parentData = this.getSpecificationsHashesByHash(serverName, parentHash);
    if(!parentData) {
      const nearbyServers = this._getSimilarServerNames(serverName);
      for (let server of nearbyServers) {
        if(this._dataByHash.specifications[server][parentHash]) {
          serverName = server;
          parentData = this.getSpecificationsHashesByHash(serverName, parentHash);
        }
      }
    }
    if(!parentData) {
      throw Error('Parent data doesn\'t exist');
    } else {
      const parentHashDictionary = Object.assign({}, parentData);
      for(let specification of specifications) {
        const hash = await this._getSpecificationHash(specification, accountType, region);
        dataDictionary[specification.symbol] = specification;
        hashDictionary[specification.symbol] = hash;
        parentHashDictionary[specification.symbol] = hash;
      }
      for(let removedSymbol of removedSymbols) {
        delete parentHashDictionary[removedSymbol];
      }
      this._dataByHash.specifications[serverName] = this._dataByHash.specifications[serverName] || {};
      const serverData = this._dataByHash.specifications[serverName];
      const dictionaryHash = this._getArrayXor(Object.values(parentHashDictionary));
      if(dictionaryHash !== parentHash) {
        this.removeSpecificationReference(serverName, connectionId, instanceIndex);
        if(serverData[dictionaryHash]) {
          this.addSpecificationReference(serverName, dictionaryHash, connectionId, instanceIndex);
        } else {
          serverData[dictionaryHash] = {
            hashes: hashDictionary,
            data: dataDictionary,
            parentHash,
            removedSymbols,
            childHashes: [],
            lastUpdated: Date.now(),
            references: {[connectionId]: [instanceIndex]}
          };
          serverData[parentHash].childHashes.push(dictionaryHash);
        }
      } else {
        this.removeSpecificationReference(serverName, connectionId, instanceIndex);
        this.addSpecificationReference(serverName, dictionaryHash, connectionId, instanceIndex);
      }
      return dictionaryHash;
    }
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
    const region = instanceIndex.split(':')[0];
    const hashDictionary = {};
    const dataDictionary = {};
    for(let position of positions) {
      const hash = await this._getPositionHash(position, accountType, region);
      dataDictionary[position.id] = position;
      hashDictionary[position.id] = hash;
    }
    if(!this._dataByHash.positions[accountId]) {
      this._dataByHash.positions[accountId] = {};
    }
    const dictionaryHash = this._getArrayXor(Object.values(hashDictionary));
    this._dataByHash.positions[accountId][dictionaryHash] = {
      hashes: hashDictionary,
      data: dataDictionary,
      parentHash: null,
      removedPositions: [],
      childHashes: [],
      lastUpdated: Date.now(),
      references: {[connectionId]: [instanceIndex]}
    };
    return dictionaryHash;
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
    const region = instanceIndex.split(':')[0];
    const hashDictionary = {};
    const dataDictionary = {};
    const parentData = this.getPositionsHashesByHash(accountId, parentHash);
    if(!parentData) {
      throw Error('Parent data doesn\'t exist');
    } else {
      const parentHashDictionary = Object.assign({}, parentData);
      for(let position of positions) {
        const hash = await this._getPositionHash(position, accountType, region);
        dataDictionary[position.id] = position;
        hashDictionary[position.id] = hash;
        parentHashDictionary[position.id] = hash;
      }
      for(let removedPosition of removedPositions) {
        delete parentHashDictionary[removedPosition];
      }
      this._dataByHash.positions[accountId] = this._dataByHash.positions[accountId] || {};
      const accountData = this._dataByHash.positions[accountId];
      const dictionaryHash = this._getArrayXor(Object.values(parentHashDictionary));
      if(dictionaryHash !== parentHash) {
        this.removePositionReference(accountId, connectionId, instanceIndex);
        if(accountData[dictionaryHash]) {
          this.addPositionReference(accountId, dictionaryHash, connectionId, instanceIndex);
        } else {
          accountData[dictionaryHash] = {
            hashes: hashDictionary,
            data: dataDictionary,
            parentHash,
            removedPositions,
            childHashes: [],
            lastUpdated: Date.now(),
            references: {[connectionId]: [instanceIndex]}
          };
          accountData[parentHash].childHashes.push(dictionaryHash);
        }
      } else {
        this.removePositionReference(accountId, connectionId, instanceIndex);
        this.addPositionReference(accountId, dictionaryHash, connectionId, instanceIndex);
      }
      return dictionaryHash;
    }
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
    const region = instanceIndex.split(':')[0];
    const hashDictionary = {};
    const dataDictionary = {};
    for(let order of orders) {
      const hash = await this._getOrderHash(order, accountType, region);
      dataDictionary[order.id] = order;
      hashDictionary[order.id] = hash;
    }
    if(!this._dataByHash.orders[accountId]) {
      this._dataByHash.orders[accountId] = {};
    }
    const dictionaryHash = this._getArrayXor(Object.values(hashDictionary));
    this._dataByHash.orders[accountId][dictionaryHash] = {
      hashes: hashDictionary,
      data: dataDictionary,
      childHashes: [],
      completedOrders: [],
      lastUpdated: Date.now(),
      references: {[connectionId]: [instanceIndex]}
    };
    return dictionaryHash;
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
  // eslint-disable-next-line complexity
  async updateOrders(accountId, accountType, connectionId,
    instanceIndex, orders, completedOrders, parentHash) {
    const region = instanceIndex.split(':')[0];
    const hashDictionary = {};
    const dataDictionary = {};
    const parentData = this.getOrdersHashesByHash(accountId, parentHash);
    if(!parentData) {
      throw Error('Parent data doesn\'t exist');
    } else {
      const parentHashDictionary = Object.assign({}, parentData);
      for(let order of orders) {
        const hash = await this._getOrderHash(order, accountType, region);
        dataDictionary[order.id] = order;
        hashDictionary[order.id] = hash;
        parentHashDictionary[order.id] = hash;
      }
      for(let completedOrder of completedOrders) {
        delete parentHashDictionary[completedOrder];
      }
      this._dataByHash.orders[accountId] = this._dataByHash.orders[accountId] || {};
      const accountData = this._dataByHash.orders[accountId];
      const dictionaryHash = this._getArrayXor(Object.values(parentHashDictionary));
      if(dictionaryHash !== parentHash) {
        this.removeOrderReference(accountId, connectionId, instanceIndex);
        if(accountData[dictionaryHash]) {
          this.addOrderReference(accountId, dictionaryHash, connectionId, instanceIndex);
        } else {
          accountData[dictionaryHash] = {
            hashes: hashDictionary,
            data: dataDictionary,
            parentHash,
            completedOrders,
            childHashes: [],
            lastUpdated: Date.now(),
            references: {[connectionId]: [instanceIndex]}
          };
          accountData[parentHash].childHashes.push(dictionaryHash);
        }
      } else {
        this.removeOrderReference(accountId, connectionId, instanceIndex);
        this.addOrderReference(accountId, dictionaryHash, connectionId, instanceIndex);
      }
      return dictionaryHash;
    }
  }

  /**
   * Returns the list of last used specification hashes, with specified server hashes prioritized
   * @param {string} serverName server name
   * @returns {string[]} last used specification hashes
   */
  getLastUsedSpecificationHashes(serverName) {
    let results = this._getSimilarServerNames(serverName);
    let searchHashes = [];
    // include all results from exact match
    if(results[0] === serverName) {
      const serverData = this._dataByHash.specifications[serverName];
      searchHashes = Object.keys(serverData);
      searchHashes.sort((a, b) => serverData[b].lastUpdated - serverData[a].lastUpdated);
      results = results.slice(1);
    }
    // include 3 latest updated hashes from close matches
    results.forEach(server => {
      const serverDictionary = this._dataByHash.specifications[server];
      let keys = Object.keys(serverDictionary);
      keys.sort((a, b) => serverDictionary[b].lastUpdated - serverDictionary[a].lastUpdated);
      keys = keys.slice(0, 3);
      searchHashes = searchHashes.concat(keys);
    });
      
    searchHashes = searchHashes.slice(0, 20);
    return searchHashes;
  }
  
  /**
   * Returns the list of last used position hashes
   * @param {string} accountId account id
   * @returns {string[]} last used position hashes
   */
  getLastUsedPositionHashes(accountId) {
    const accountData = this._dataByHash.positions[accountId];
    let positionHashes = accountData ? Object.keys(accountData) : [];
    positionHashes.sort((a, b) => accountData[b].lastUpdated - accountData[a].lastUpdated);    
    return positionHashes.slice(0, 20);
  }
  
  /**
   * Returns the list of last used order hashes
   * @param {string} accountId account id
   * @returns {string[]} last used order hashes
   */
  getLastUsedOrderHashes(accountId) {
    const accountData = this._dataByHash.orders[accountId];
    let orderHashes = accountData ? Object.keys(accountData) : [];
    orderHashes.sort((a, b) => accountData[b].lastUpdated - accountData[a].lastUpdated);    
    return orderHashes.slice(0, 20);
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
    const references = this._dataByHash.specifications[serverName][hash].references;
    if(!references[connectionId]) {
      references[connectionId] = [instanceIndex];
    } else {
      if(!references[connectionId].includes(instanceIndex)) {
        references[connectionId].push(instanceIndex);
      }
    }
    this._dataByHash.specifications[serverName][hash].lastUpdated = Date.now();
  }

  /**
   * Removes a reference from a terminal state instance index to a specifications hash
   * @param {string} serverName server name
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removeSpecificationReference(serverName, connectionId, instanceIndex) {
    const nearbyServers = this._getSimilarServerNames(serverName);
    const serverNames = [serverName].concat(nearbyServers);
    serverNames.forEach(server => {
      Object.keys(this._dataByHash.specifications[server] || []).forEach(hash => {
        const references = this._dataByHash.specifications[server][hash].references;
        if(references[connectionId]) {
          const index = references[connectionId].findIndex(instance => instanceIndex === instance);
          if(index !== -1) {
            references[connectionId].splice(index, 1);
          }
          if(!references[connectionId].length) {
            delete references[connectionId];
          }
        }
      });
    });
  }

  /**
   * Adds a reference from a terminal state instance index to a positions hash
   * @param {string} accountId account id
   * @param {string} hash positions hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  addPositionReference(accountId, hash, connectionId, instanceIndex) {
    const references = this._dataByHash.positions[accountId][hash].references;
    if(!references[connectionId]) {
      references[connectionId] = [];
    }
    if(!references[connectionId].includes(instanceIndex)) {
      references[connectionId].push(instanceIndex);
    }
    this._dataByHash.positions[accountId][hash].lastUpdated = Date.now();
  }

  /**
   * Removes a reference from a terminal state instance index to a positions hash
   * @param {string} accountId account id
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removePositionReference(accountId, connectionId, instanceIndex) {
    Object.keys(this._dataByHash.positions[accountId] || []).forEach(hash => {
      const references = this._dataByHash.positions[accountId][hash].references;
      if(references[connectionId]) {
        const index = references[connectionId].findIndex(instance => instanceIndex === instance);
        if(index !== -1) {
          references[connectionId].splice(index, 1);
        }
        if(!references[connectionId].length) {
          delete references[connectionId];
        }
      }
    });
  }

  /**
   * Adds a reference from a terminal state instance index to a orders hash
   * @param {string} accountId account id
   * @param {string} hash positions hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  addOrderReference(accountId, hash, connectionId, instanceIndex) {
    const references = this._dataByHash.orders[accountId][hash].references;
    if(!references[connectionId]) {
      references[connectionId] = [];
    }
    if(!references[connectionId].includes(instanceIndex)) {
      references[connectionId].push(instanceIndex);
    }
    this._dataByHash.orders[accountId][hash].lastUpdated = Date.now();
  }

  /**
   * Removes a reference from a terminal state instance index to a orders hash
   * @param {string} accountId account id
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removeOrderReference(accountId, connectionId, instanceIndex) {
    Object.keys(this._dataByHash.orders[accountId] || []).forEach(hash => {
      const references = this._dataByHash.orders[accountId][hash].references;
      if(references[connectionId]) {
        const index = references[connectionId].findIndex(instance => instanceIndex === instance);
        if(index !== -1) {
          references[connectionId].splice(index, 1);
        }
        if(!references[connectionId].length) {
          delete references[connectionId];
        }
      }
    });
  }

  async _getSpecificationHash(specification, accountType, region) {
    const hashFields = await this._clientApiClient.getHashingIgnoredFieldLists(region);
    specification = Object.assign({}, specification);
    if(accountType === 'cloud-g1') {
      hashFields.g1.specification.forEach(field => delete specification[field]);
    } else if(accountType === 'cloud-g2') {
      hashFields.g2.specification.forEach(field => delete specification[field]);
    }
    return this._getHash(specification, accountType, ['digits']);
  }

  async _getPositionHash(position, accountType, region) {
    const hashFields = await this._clientApiClient.getHashingIgnoredFieldLists(region);
    position = Object.assign({}, position);
    if(accountType === 'cloud-g1') {
      hashFields.g1.position.forEach(field => delete position[field]);
    } else if(accountType === 'cloud-g2') {
      hashFields.g2.position.forEach(field => delete position[field]);
    }
    return this._getHash(position, accountType, ['magic']);
  }

  async _getOrderHash(order, accountType, region) {
    const hashFields = await this._clientApiClient.getHashingIgnoredFieldLists(region);
    order = Object.assign({}, order);
    if(accountType === 'cloud-g1') {
      hashFields.g1.order.forEach(field => delete order[field]);
    } else if(accountType === 'cloud-g2') {
      hashFields.g2.order.forEach(field => delete order[field]);
    }
    return this._getHash(order, accountType, ['magic']);
  }

  /**
   * Calculates hash from array of hashes
   * @param {String[]} hexArray array of hashes
   * @returns {string} resulting hash
   */
  _getArrayXor(hexArray) {
    return hexArray.length ? hexArray.reduce((a, b) => this._getHexXor(a, b)) : null;
  }

  _getHexXor(hex1, hex2) {
    const buf1 = Buffer.from(hex1, 'hex');
    const buf2 = Buffer.from(hex2, 'hex');
    // eslint-disable-next-line no-bitwise
    const bufResult = buf1.map((b, i) => b ^ buf2[i]);
    return bufResult.toString('hex');
  }

  _getSimilarServerNames(serverName) {
    const serverNameList = Object.keys(this._dataByHash.specifications);
    const fuse = new Fuse(serverNameList, {
      threshold: 0.3
    });
    return fuse.search(serverName).map(result => result.item);
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

  _optimizeTreesJob() {
    const now = Date.now();
    Object.keys(this._dataByHash.specifications).forEach(serverName => {
      const serverData = this._dataByHash.specifications[serverName];
      // eslint-disable-next-line complexity
      Object.keys(serverData).forEach(hash => {
        const data = serverData[hash];
        if(data.lastUpdated <= now - this._recordExpirationTime && !Object.keys(data.references).length &&
          data.childHashes.length < 2) {
          if (data.childHashes.length === 1) {
            const childHash = data.childHashes[0];
            const childData = serverData[childHash];
            if(data.parentHash) {
              const combinedChanges = Object.assign({}, data.data, childData.data);
              const combinedHashes = Object.assign({}, data.hashes, childData.hashes);
              const childDataSymbols = Object.keys(childData.data);
              let combinedRemovedSymbols = data.removedSymbols.filter(symbol => !childDataSymbols.includes(symbol))
                .concat(childData.removedSymbols);
              childData.data = combinedChanges;
              childData.hashes = combinedHashes;
              childData.removedSymbols = combinedRemovedSymbols;
              childData.parentHash = data.parentHash;
            } else {
              const childSpecifications = this.getSpecificationsByHash(serverName, childHash);
              const childSpecificationsHashes = this.getSpecificationsHashesByHash(serverName, childHash);
              childData.data = childSpecifications;
              childData.hashes = childSpecificationsHashes;
              childData.removedSymbols = [];
              childData.parentHash = null;
            }
          }
          if(data.parentHash) {
            const parentData = serverData[data.parentHash];
            if(parentData) {
              parentData.childHashes = parentData.childHashes.filter(itemHash => hash !== itemHash);
            }
          }
          delete serverData[hash];
          if(!Object.keys(serverData).length) {
            delete this._dataByHash.specifications[serverName];
          }
        }
      });
    });

    Object.keys(this._dataByHash.positions).forEach(accountId => {
      const accountData = this._dataByHash.positions[accountId];
      // eslint-disable-next-line complexity
      Object.keys(accountData).forEach(hash => {
        const data = accountData[hash];
        if(data.lastUpdated <= now - this._recordExpirationTime && !Object.keys(data.references).length &&
          data.childHashes.length < 2) {
          if (data.childHashes.length === 1) {
            const childHash = data.childHashes[0];
            const childData = accountData[childHash];
            if(data.parentHash) {
              const combinedChanges = Object.assign({}, data.data, childData.data);
              const combinedHashes = Object.assign({}, data.hashes, childData.hashes);
              const childDataPositions = Object.keys(childData.data);
              let combinedRemovedPositions = data.removedPositions.filter(orderId =>
                !childDataPositions.includes(orderId))
                .concat(childData.removedPositions);
              childData.data = combinedChanges;
              childData.hashes = combinedHashes;
              childData.removedPositions = combinedRemovedPositions;
              childData.parentHash = data.parentHash;
            } else {
              const childPositions = this.getPositionsByHash(accountId, childHash);
              const childPositionsHashes = this.getPositionsHashesByHash(accountId, childHash);
              childData.data = childPositions;
              childData.hashes = childPositionsHashes;
              childData.removedPositions = [];
              childData.parentHash = null;
            }
          }
          if(data.parentHash) {
            const parentData = accountData[data.parentHash];
            if(parentData) {
              parentData.childHashes = parentData.childHashes.filter(itemHash => hash !== itemHash);
            }
          }
          delete accountData[hash];
          if(!Object.keys(accountData).length) {
            delete this._dataByHash.positions[accountId];
          }
        }
      });
    });

    Object.keys(this._dataByHash.orders).forEach(accountId => {
      const accountData = this._dataByHash.orders[accountId];
      // eslint-disable-next-line complexity
      Object.keys(accountData).forEach(hash => {
        const data = accountData[hash];
        if(data.lastUpdated <= now - this._recordExpirationTime && !Object.keys(data.references).length &&
          data.childHashes.length < 2) {
          if (data.childHashes.length === 1) {
            const childHash = data.childHashes[0];
            const childData = accountData[childHash];
            if(data.parentHash) {
              const combinedChanges = Object.assign({}, data.data, childData.data);
              const combinedHashes = Object.assign({}, data.hashes, childData.hashes);
              const childDataOrders = Object.keys(childData.data);
              let combinedCompletedOrders = data.completedOrders.filter(orderId => !childDataOrders.includes(orderId))
                .concat(childData.completedOrders);
              childData.data = combinedChanges;
              childData.hashes = combinedHashes;
              childData.completedOrders = combinedCompletedOrders;
              childData.parentHash = data.parentHash;
            } else {
              const childOrders = this.getOrdersByHash(accountId, childHash);
              const childOrdersHashes = this.getOrdersHashesByHash(accountId, childHash);
              childData.data = childOrders;
              childData.hashes = childOrdersHashes;
              childData.completedOrders = [];
              childData.parentHash = null;
            }
          }
          if(data.parentHash) {
            const parentData = accountData[data.parentHash];
            if(parentData) {
              parentData.childHashes = parentData.childHashes.filter(itemHash => hash !== itemHash);
            }
          }
          delete accountData[hash];
          if(!Object.keys(accountData).length) {
            delete this._dataByHash.orders[accountId];
          }
        }
      });
    });

  }

}
