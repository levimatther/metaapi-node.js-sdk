
import {NewProvisioningProfileDto, ProvisioningProfileClient} from "../clients/metaApi/provisioningProfile.client";
import ProvisioningProfile from "./provisioningProfile";

/**
 * Exposes provisioning profile API logic to the consumers
 */
export default class ProvisioningProfileApi {

  /**
   * Constructs a provisioning profile API instance
   * @param {ProvisioningProfileClient} provisioningProfileClient provisioning profile REST API client
   */
  constructor(provisioningProfileClient: ProvisioningProfileClient);

  /**
   * Retrieves provisioning profiles
   * @param {Number} version optional version filter (allowed values are 4 and 5)
   * @param {String} status optional status filter (allowed values are new and active)
   * @return {Promise<Array<ProvisioningProfile>>} promise resolving with an array of provisioning profile entities
   */
  getProvisioningProfiles(version: Number, status: String): Promise<Array<ProvisioningProfile>>;

  /**
   * Retrieves a provisioning profile by id
   * @param {String} provisioningProfileId provisioning profile id
   * @return {Promise<ProvisioningProfile>} promise resolving with provisioning profile entity
   */
  getProvisioningProfile(provisioningProfileId: String): Promise<ProvisioningProfile>;

  /**
   * Creates a provisioning profile
   * @param {NewProvisioningProfileDto} profile provisioning profile data
   * @return {Promise<ProvisioningProfile>} promise resolving with provisioning profile entity
   */
  createProvisioningProfile(profile: NewProvisioningProfileDto): Promise<ProvisioningProfile>;
}