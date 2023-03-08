import MetaApiClient from "../metaApi.client";
import HttpClient from '../httpClient';
import DomainClient from "../domain.client";

/**
 * metaapi.cloud client API client (see https://metaapi.cloud/docs/client/)
 */
export default class ClientApiClient extends MetaApiClient {

  /**
   * Constructs client API client instance
   * @param {HttpClient} httpClient HTTP client
   * @param {DomainClient} domainClient domain client
   */
  constructor(httpClient: HttpClient, domainClient: DomainClient);

  /**
   * Refreshes hashing ignored field lists
   * @param {String} region account region
   * @returns {Promise} promise resolving when the hashing field lists are updated.
   */
  refreshIgnoredFieldLists(region: string): Promise;

  /**
   * Retrieves hashing ignored field lists
   * @param {string} region account region
   * @returns {HashingIgnoredFieldLists} promise resolving with hashing ignored field lists
   */
  getHashingIgnoredFieldLists(region: string): HashingIgnoredFieldLists;
}

/**
 * Type hashing ignored field lists
 */
export declare type TypeHashingIgnoredFieldLists = {

  /**
   * specifications ignored fields
   */
  specification: string[],

  /**
   * position ignored fields
   */
  position: string[],

  /**
   * order ignored fields
   */
  order: string[],
}

/**
 * Hashing ignored field lists
 */
export declare type HashingIgnoredFieldLists = {

  /**
   * g1 hashing ignored field lists
   */
  g1: TypeHashingIgnoredFieldLists,

  /**
   * g2 hashing ignored field lists
   */
  g2: TypeHashingIgnoredFieldLists,
}