import TerminalHashManager from "./terminalHashManager";

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
  constructor(terminalHashManager: TerminalHashManager, idKey: string, dataType: string, useFuzzySearch?: boolean, keepHashTrees?: boolean);

  /**
   * Returns data by hash
   * @param {string} hash records hash
   * @returns {[id: string]: Object}
   */
  getItemsByHash(hash: string): {[id: string]: Object}

  /**
   * Returns hash data by hash
   * @param {string} hash records hash
   * @returns {[id: string]: string}
   */
  getHashesByHash(hash: string): {[id: string]: string}

  /**
   * Creates an entry for data and returns hash
   * @param {string} categoryName category name
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {Object[]} items items to record
   * @returns {Promise<string>} data hash
   */
  recordItems(categoryName: string, accountType: string, connectionId: string, instanceIndex: string, items: Object[]): Promise<string>;

  /**
   * Updates data and returns new hash
   * @param {string} categoryName category name 
   * @param {string} accountType account type
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   * @param {Object[]} items items array
   * @param {string[]} removedItemIds removed item ids
   * @param {string} parentHash parent hash
   * @returns {Promise<string>} updated dictionary hash
   */
  updateItems(categoryName: string, accountType: string, connectionId: string, instanceIndex: string, items: Object[], removedItemIds: string[], parentHash: string): Promise<string>;

  /**
   * Returns the list of last used records hashes
   * @param {string} categoryName category name
   * @returns {string[]} last used records hashes
   */
  getLastUsedHashes(categoryName: string): string[];

  /**
   * Adds a reference from a terminal state instance index to a records hash
   * @param {string} hash records hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  addReference(hash: string, connectionId: string, instanceIndex: string): void;

  /**
   * Removes a reference from a terminal state instance index to a records hash
   * @param {string} connectionId connection id
   * @param {string} instanceIndex instance index
   */
  removeReference(connectionId: string, instanceIndex: string): void;

}