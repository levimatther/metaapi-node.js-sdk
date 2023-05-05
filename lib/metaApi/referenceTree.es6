import Fuse from 'fuse.js';
const isBrowser = process.title === 'browser';

/**
 * Class for managing a data tree with hash references
 */
export default class ReferenceTree {

  /**
   * Constructs the instance of reference tree
   * @param {TerminalHashManager} terminalHashManager terminal hash manager
   * @param {string} idKey field name that contains the item id
   * @param {string} dataType data type
   * @param {boolean} [useFuzzySearch] whether to use fuzzy search on nearby categories
   * @param {boolean} [keepHashTrees] if set to true, unused data will not be cleared (for use in debugging)
   */
  constructor(terminalHashManager, idKey, dataType, useFuzzySearch = false, keepHashTrees = false) {
    this._terminalHashManager = terminalHashManager;
    this._idKey = idKey;
    this._dataByHash = {};
    this._hashesByCategory = {};
    this._dataType = dataType;
    this._useFuzzySearch = useFuzzySearch;
    this._recordExpirationTime = 10 * 60 * 1000;
    if(!keepHashTrees) {
      this._optimizeTreesJob = this._optimizeTreesJob.bind(this);
      this._interval = setInterval(this._optimizeTreesJob, 5 * 60 * 1000);
    }
  }

  /**
   * Returns data by hash
   * @param {string} hash records hash
   * @returns {[id: string]: Object}
   */
  // eslint-disable-next-line complexity
  getItemsByHash(hash) {
    const data = this._dataByHash[hash];
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
      let parentData = this._dataByHash[data.parentHash];
      while(parentData.parentHash) {
        hashChain.unshift(parentData.parentHash);
        parentData = this._dataByHash[parentData.parentHash];
      }
      const state = Object.assign({}, this._dataByHash[hashChain.shift()].data);
      for(let chainHash of hashChain) {
        const chainData = this._dataByHash[chainHash];
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
   * @param {string} hash records hash
   * @returns {[id: string]: string}
   */
  getHashesByHash(hash) {
    const data = this._dataByHash[hash];
    if(!data) {
      return null;
    } else if(!data.parentHash) {
      return data.hashes;
    } else {
      let hashChain = [hash];
      hashChain.unshift(data.parentHash);
      let parentData = this._dataByHash[data.parentHash];
      while(parentData.parentHash) {
        hashChain.unshift(parentData.parentHash);
        parentData = this._dataByHash[parentData.parentHash];
      }
      const state = Object.assign({}, this._dataByHash[hashChain.shift()].hashes);
      for(let chainHash of hashChain) {
        const chainData = this._dataByHash[chainHash];
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
  recordItems(categoryName, accountType, connectionId, instanceIndex, items) {
    const region = instanceIndex.split(':')[0];
    const hashDictionary = {};
    const dataDictionary = {};
    if(!items.length)  {
      return null;
    }

    for(let item of items) {
      const hash = this._terminalHashManager.getItemHash(item, this._dataType, accountType, region);
      dataDictionary[item[this._idKey]] = item;
      hashDictionary[item[this._idKey]] = hash;
    }
    const dictionaryHash = this._getArrayXor(Object.values(hashDictionary));
    this._updateCategoryRecord(categoryName, dictionaryHash);
    this.removeReference(connectionId, instanceIndex);
    if(this._dataByHash[dictionaryHash]) {
      this.addReference(dictionaryHash, connectionId, instanceIndex);
    } else {
      this._dataByHash[dictionaryHash] = {
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
  updateItems(categoryName, accountType, connectionId, instanceIndex, items, removedItemIds, parentHash) {
    if(!parentHash) {
      return this.recordItems(categoryName, accountType, connectionId, instanceIndex, items);
    }
    const region = instanceIndex.split(':')[0];
    const hashDictionary = {};
    const dataDictionary = {};
    let parentData = this.getHashesByHash(parentHash);
    if(!parentData) {
      throw Error('Parent data doesn\'t exist');
    } else {
      const parentHashDictionary = Object.assign({}, parentData);
      for(let item of items) {
        const hash = this._terminalHashManager.getItemHash(item, this._dataType, accountType, region);
        dataDictionary[item[this._idKey]] = item;
        hashDictionary[item[this._idKey]] = hash;
        parentHashDictionary[item[this._idKey]] = hash;
      }
      for(let removedId of removedItemIds) {
        delete parentHashDictionary[removedId];
      }
      const dictionaryHash = this._getArrayXor(Object.values(parentHashDictionary));
      this._updateCategoryRecord(categoryName, dictionaryHash);
      if(dictionaryHash !== parentHash) {
        this.removeReference(connectionId, instanceIndex);
        if(this._dataByHash[dictionaryHash]) {
          this.addReference(dictionaryHash, connectionId, instanceIndex);
        } else if(dictionaryHash) {
          this._dataByHash[dictionaryHash] = {
            hashes: hashDictionary,
            data: dataDictionary,
            parentHash,
            removedItemIds,
            childHashes: [],
            lastUpdated: Date.now(),
            references: {[connectionId]: [instanceIndex]}
          };
          this._dataByHash[parentHash].childHashes.push(dictionaryHash);
        }
      } else {
        this.removeReference(connectionId, instanceIndex);
        this.addReference(dictionaryHash, connectionId, instanceIndex);
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
    const getTopHashes = (category, hashAmount) => {
      const categoryData = this._hashesByCategory[category];
      if(!categoryData) {
        return [];
      } else {
        let hashesArray = [];
        if(!hashAmount) {
          hashAmount = Infinity;
        }
        const keys = Object.keys(categoryData);
        keys.sort((a, b) => b - a);
        for(let key of keys) {
          hashesArray = hashesArray.concat(categoryData[key]);
          if(hashesArray.length > hashAmount) {
            hashesArray = hashesArray.slice(0, hashAmount);
            break;
          }
        }
        return hashesArray;
      }
    };

    if(this._useFuzzySearch) {
      let results = this._getSimilarCategoryNames(categoryName);
      // include all results from exact match
      if(results[0] === categoryName) {
        searchHashes = getTopHashes(categoryName);
        results = results.slice(1);
      }
      // include 3 latest updated hashes from close matches
      results.forEach(category => {
        searchHashes = searchHashes.concat(getTopHashes(category, 3));
      });
    } else {
      searchHashes = getTopHashes(categoryName, 20);
    }
      
    searchHashes = searchHashes.slice(0, 20);
    return searchHashes;
  }

  /**
   * Adds a reference from a terminal state instance index to a records hash
   * @param {string} hash records hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  // eslint-disable-next-line complexity
  addReference(hash, connectionId, instanceIndex) {
    if (!this._dataByHash[hash]) {
      throw Error(`Can't add reference - ${this._dataType} data for hash ${hash} doesn't exist`);
    }
    const references = this._dataByHash[hash].references;
    if(!references[connectionId]) {
      references[connectionId] = [instanceIndex];
    } else {
      if(!references[connectionId].includes(instanceIndex)) {
        references[connectionId].push(instanceIndex);
      }
    }
    this._dataByHash[hash].lastUpdated = Date.now();
  }

  /**
   * Removes a reference from a terminal state instance index to a records hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removeReference(connectionId, instanceIndex) {
    Object.keys(this._dataByHash).forEach(hash => {
      const references = this._dataByHash[hash].references;
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

  _getSimilarCategoryNames(categoryName) {
    const categoryNameList = Object.keys(this._hashesByCategory);
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
    return isBrowser
      // eslint-disable-next-line no-bitwise
      ? Array.prototype.map.call(bufResult, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('')
      : bufResult.toString('hex');
  }

  _updateCategoryRecord(categoryName, hash) {
    if(!hash) {
      return;
    }
    const date = Date.now();
    this._removeCategoryRecord(categoryName, hash);
    if(!this._hashesByCategory[categoryName]) {
      this._hashesByCategory[categoryName] = {};
    }
    if(!this._hashesByCategory[categoryName][date]) {
      this._hashesByCategory[categoryName][date] = [];
    }
    this._hashesByCategory[categoryName][date].push(hash);
  }

  _removeCategoryRecord(categoryName, hash) {
    if(this._hashesByCategory[categoryName]) {
      const dates = Object.keys(this._hashesByCategory[categoryName]);
      dates.forEach(date => {
        if(this._hashesByCategory[categoryName][date].includes(hash)) {
          this._hashesByCategory[categoryName][date] = 
            this._hashesByCategory[categoryName][date].filter(item => item !== hash);
          if(this._hashesByCategory[categoryName][date].length === 0) {
            delete this._hashesByCategory[categoryName][date];
          }
        }
      });
      if(Object.keys(this._hashesByCategory[categoryName]).length === 0) {
        delete this._hashesByCategory[categoryName];
      }
    }
  }

  _optimizeTreesJob() {
    const now = Date.now();
    // eslint-disable-next-line complexity
    Object.keys(this._dataByHash).forEach(hash => {
      const data = this._dataByHash[hash];
      if(data.lastUpdated <= now - this._recordExpirationTime && !Object.keys(data.references).length &&
          data.childHashes.length < 2) {
        if (data.childHashes.length === 1) {
          const childHash = data.childHashes[0];
          const childData = this._dataByHash[childHash];
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
            this._dataByHash[data.parentHash].childHashes.push(childHash);
          } else {
            const childItems = this.getItemsByHash(childHash);
            const childHashes = this.getHashesByHash(childHash);
            childData.data = childItems;
            childData.hashes = childHashes;
            childData.removedItemIds = [];
            childData.parentHash = null;
          }
        }
        if(data.parentHash) {
          const parentData = this._dataByHash[data.parentHash];
          if(parentData) {
            parentData.childHashes = parentData.childHashes.filter(itemHash => hash !== itemHash);
          }
        }
        delete this._dataByHash[hash];
        const categories = Object.keys(this._hashesByCategory);
        categories.forEach(category => {
          this._removeCategoryRecord(category, hash);
        });
      }
    });
  }

  /**
   * Stops reference tree optimize job & clears interval
   */
  stop() {
    clearInterval(this._interval);
  }
}
