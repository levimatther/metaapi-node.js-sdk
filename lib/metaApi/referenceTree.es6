import Fuse from 'fuse.js';

/**
 * Class for managing a data tree with hash references
 */
export default class ReferenceTree {

  /**
   * Constructs the instance of reference tree
   * @param {TerminalHashManager} terminalHashManager terminal hash manager
   * @param {string} idKey field name that contains the item id
   * @param {string} dataType data type
   * @param {Boolean} [useFuzzySearch] whether to use fuzzy search on nearby categories
   */
  constructor(terminalHashManager, idKey, dataType, useFuzzySearch = false) {
    this._terminalHashManager = terminalHashManager;
    this._idKey = idKey;
    this._dataByHash = {};
    this._dataType = dataType;
    this._useFuzzySearch = useFuzzySearch;
    this._recordExpirationTime = 10 * 60 * 1000;
    this._optimizeTreesJob = this._optimizeTreesJob.bind(this);
    setInterval(this._optimizeTreesJob, 5 * 60 * 1000);
  }

  /**
   * Returns data by hash
   * @param {string} categoryName category name
   * @param {string} hash records hash
   * @returns {[id: string]: Object}
   */
  // eslint-disable-next-line complexity
  getItemsByHash(categoryName, hash) {
    let categoryData = this._dataByHash[categoryName];
    if(!categoryData && this._useFuzzySearch) {
      const nearbyCategories = this._getSimilarCategoryNames(categoryName);
      for (let category of nearbyCategories) {
        if(this._dataByHash[category][hash]) {
          categoryData = this._dataByHash[category];
        }
      }
    }
    if(!categoryData) {
      return null;
    }
    const data = categoryData[hash];
    if(!data) {
      return null;
    } else if(!data.parentHash) {
      return data.data;
    } else {
      /**
       * If specified hash is not a base hash, build a chain of hashes
       * to the base one, apply all changes and return
       */
      let hashChain = [hash];
      hashChain.unshift(data.parentHash);
      let parentData = categoryData[data.parentHash];
      while(parentData.parentHash) {
        hashChain.unshift(parentData.parentHash);
        parentData = categoryData[parentData.parentHash];
      }
      const state = Object.assign({}, categoryData[hashChain.shift()].data);
      for(let chainHash of hashChain) {
        const chainData = categoryData[chainHash];
        Object.keys(chainData.data).forEach(id => {
          state[id] = chainData.data[id];
        });
        chainData.removedItemIds.forEach(id => {
          delete state[id];
        });
      }
      return state;
    }
  }

  /**
   * Returns hash data by hash
   * @param {string} categoryName category name
   * @param {string} hash records hash
   * @returns {[id: string]: string}
   */
  getHashesByHash(categoryName, hash) {
    let categoryData = this._dataByHash[categoryName];
    if(!categoryData) {
      return null;
    }
    const data = categoryData[hash];
    if(!data) {
      return null;
    } else if(!data.parentHash) {
      return data.hashes;
    } else {
      let hashChain = [hash];
      hashChain.unshift(data.parentHash);
      let parentData = categoryData[data.parentHash];
      while(parentData.parentHash) {
        hashChain.unshift(parentData.parentHash);
        parentData = categoryData[parentData.parentHash];
      }
      const state = Object.assign({}, categoryData[hashChain.shift()].hashes);
      for(let chainHash of hashChain) {
        const chainData = categoryData[chainHash];
        Object.keys(chainData.hashes).forEach(id => {
          state[id] = chainData.hashes[id];
        });
        chainData.removedItemIds.forEach(id => {
          delete state[id];
        });
      }
      return state;
    }
  }

  /**
   * Creates an entry for data and returns hash
   * @param {string} categoryName category name
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {Object[]} items items to record
   * @returns {string} data hash
   */
  async recordItems(categoryName, accountType, connectionId, instanceIndex, items) {
    const region = instanceIndex.split(':')[0];
    const hashDictionary = {};
    const dataDictionary = {};
    if(!items.length)  {
      return null;
    }

    for(let item of items) {
      const hash = await this._terminalHashManager.getItemHash(item, this._dataType, accountType, region);
      dataDictionary[item[this._idKey]] = item;
      hashDictionary[item[this._idKey]] = hash;
    }
    this._dataByHash[categoryName] = this._dataByHash[categoryName] || {};
    const categoryData = this._dataByHash[categoryName];
    const dictionaryHash = this._getArrayXor(Object.values(hashDictionary));
    this.removeReference(categoryName, connectionId, instanceIndex);
    if(categoryData[dictionaryHash]) {
      this.addReference(categoryName, dictionaryHash, connectionId, instanceIndex);
    } else {
      this._dataByHash[categoryName][dictionaryHash] = {
        hashes: hashDictionary,
        data: dataDictionary,
        removedItemIds: [],
        parentHash: null,
        childHashes: [],
        lastUpdated: Date.now(),
        references: {[connectionId]: [instanceIndex]}
      };
    }
    return dictionaryHash;
  }

  /**
   * Updates data and returns new hash
   * @param {string} categoryName category name 
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {Object[]} items items array
   * @param {string[]} removedItemIds removed item ids
   * @param {string} parentHash parent hash
   * @returns {string} updated dictionary hash
   */
  // eslint-disable-next-line complexity
  async updateItems(categoryName, accountType, connectionId, instanceIndex, items, removedItemIds, parentHash) {
    if(!parentHash) {
      return await this.recordItems(categoryName, accountType, connectionId, instanceIndex, items);
    }
    const region = instanceIndex.split(':')[0];
    const hashDictionary = {};
    const dataDictionary = {};
    let parentData = this.getHashesByHash(categoryName, parentHash);
    if(!parentData) {
      const nearbyCategories = this._getSimilarCategoryNames(categoryName);
      for (let category of nearbyCategories) {
        if(this._dataByHash[category][parentHash]) {
          categoryName = category;
          parentData = this.getHashesByHash(categoryName, parentHash);
        }
      }
    }
    if(!parentData) {
      throw Error('Parent data doesn\'t exist');
    } else {
      const parentHashDictionary = Object.assign({}, parentData);
      for(let item of items) {
        const hash = await this._terminalHashManager.getItemHash(item, this._dataType, accountType, region);
        dataDictionary[item[this._idKey]] = item;
        hashDictionary[item[this._idKey]] = hash;
        parentHashDictionary[item[this._idKey]] = hash;
      }
      for(let removedId of removedItemIds) {
        delete parentHashDictionary[removedId];
      }
      this._dataByHash[categoryName] = this._dataByHash[categoryName] || {};
      const categoryData = this._dataByHash[categoryName];
      const dictionaryHash = this._getArrayXor(Object.values(parentHashDictionary));
      if(dictionaryHash !== parentHash) {
        this.removeReference(categoryName, connectionId, instanceIndex);
        if(categoryData[dictionaryHash]) {
          this.addReference(categoryName, dictionaryHash, connectionId, instanceIndex);
        } else if(dictionaryHash) {
          categoryData[dictionaryHash] = {
            hashes: hashDictionary,
            data: dataDictionary,
            parentHash,
            removedItemIds,
            childHashes: [],
            lastUpdated: Date.now(),
            references: {[connectionId]: [instanceIndex]}
          };
          categoryData[parentHash].childHashes.push(dictionaryHash);
        }
      } else {
        this.removeReference(categoryName, connectionId, instanceIndex);
        this.addReference(categoryName, dictionaryHash, connectionId, instanceIndex);
      }
      return dictionaryHash;
    }
  }

  /**
   * Returns the list of last used records hashes
   * @param {string} categoryName category name
   * @returns {string[]} last used records hashes
   */
  getLastUsedHashes(categoryName) {
    let searchHashes = [];
    if(this._useFuzzySearch) {
      let results = this._getSimilarCategoryNames(categoryName);
      // include all results from exact match
      if(results[0] === categoryName) {
        const categoryData = this._dataByHash[categoryName];
        searchHashes = Object.keys(categoryData);
        searchHashes.sort((a, b) => categoryData[b].lastUpdated - categoryData[a].lastUpdated);
        results = results.slice(1);
      }
      // include 3 latest updated hashes from close matches
      results.forEach(server => {
        const categoryDictionary = this._dataByHash[server];
        let keys = Object.keys(categoryDictionary);
        keys.sort((a, b) => categoryDictionary[b].lastUpdated - categoryDictionary[a].lastUpdated);
        keys = keys.slice(0, 3);
        searchHashes = searchHashes.concat(keys);
      });
    } else {
      const categoryData = this._dataByHash[categoryName];
      searchHashes = categoryData ? Object.keys(categoryData) : [];
      searchHashes.sort((a, b) => categoryData[b].lastUpdated - categoryData[a].lastUpdated);    
    }
      
    searchHashes = searchHashes.slice(0, 20);
    return searchHashes;
  }

  /**
   * Adds a reference from a terminal state instance index to a records hash
   * @param {string} categoryName category name 
   * @param {string} hash records hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  // eslint-disable-next-line complexity
  addReference(categoryName, hash, connectionId, instanceIndex) {
    let categoryData = this._dataByHash[categoryName];
    if(this._useFuzzySearch && (!categoryData || !categoryData[hash])) {
      const nearbyServers = this._getSimilarCategoryNames(categoryName);
      for(let server of nearbyServers) {
        if(this._dataByHash[server][hash]) {
          categoryData = this._dataByHash[server];
        }
      }
    }
    if(!categoryData) {
      throw Error(`Can't add reference - ${this._dataType} category data ${categoryName} doesn't exist`);
    } else if (!categoryData[hash]) {
      throw Error(`Can't add reference - ${this._dataType} data ${categoryName} for hash ${hash} doesn't exist`);
    }
    const references = categoryData[hash].references;
    if(!references[connectionId]) {
      references[connectionId] = [instanceIndex];
    } else {
      if(!references[connectionId].includes(instanceIndex)) {
        references[connectionId].push(instanceIndex);
      }
    }
    categoryData[hash].lastUpdated = Date.now();
  }

  /**
   * Removes a reference from a terminal state instance index to a records hash
   * @param {string} categoryName category name
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removeReference(categoryName, connectionId, instanceIndex) {
    let categoryNames = [categoryName];
    if(this._useFuzzySearch) {
      const nearbyCategories = this._getSimilarCategoryNames(categoryName);
      categoryNames = categoryNames.concat(nearbyCategories);
    }
    categoryNames.forEach(category => {
      Object.keys(this._dataByHash[category] || []).forEach(hash => {
        const references = this._dataByHash[category][hash].references;
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

  _getSimilarCategoryNames(categoryName) {
    const categoryNameList = Object.keys(this._dataByHash);
    const fuse = new Fuse(categoryNameList, {
      threshold: 0.3
    });
    return fuse.search(categoryName).map(result => result.item);
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

  _optimizeTreesJob() {
    const now = Date.now();
    Object.keys(this._dataByHash).forEach(categoryName => {
      const categoryData = this._dataByHash[categoryName];
      // eslint-disable-next-line complexity
      Object.keys(categoryData).forEach(hash => {
        const data = categoryData[hash];
        if(data.lastUpdated <= now - this._recordExpirationTime && !Object.keys(data.references).length &&
          data.childHashes.length < 2) {
          if (data.childHashes.length === 1) {
            const childHash = data.childHashes[0];
            const childData = categoryData[childHash];
            if(data.parentHash) {
              const combinedChanges = Object.assign({}, data.data, childData.data);
              const combinedHashes = Object.assign({}, data.hashes, childData.hashes);
              const childDataIds = Object.keys(childData.data);
              let combinedRemovedIds = data.removedItemIds.filter(id => !childDataIds.includes(id))
                .concat(childData.removedItemIds);
              childData.data = combinedChanges;
              childData.hashes = combinedHashes;
              childData.removedItemIds = combinedRemovedIds;
              childData.parentHash = data.parentHash;
              categoryData[data.parentHash].childHashes.push(childHash);
            } else {
              const childItems = this.getItemsByHash(categoryName, childHash);
              const childHashes = this.getHashesByHash(categoryName, childHash);
              childData.data = childItems;
              childData.hashes = childHashes;
              childData.removedItemIds = [];
              childData.parentHash = null;
            }
          }
          if(data.parentHash) {
            const parentData = categoryData[data.parentHash];
            if(parentData) {
              parentData.childHashes = parentData.childHashes.filter(itemHash => hash !== itemHash);
            }
          }
          delete categoryData[hash];
          if(!Object.keys(categoryData).length) {
            delete this._dataByHash[categoryName];
          }
        }
      });
    });
  }
}
