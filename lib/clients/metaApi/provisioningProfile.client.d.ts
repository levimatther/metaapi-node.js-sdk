/**
 * metaapi.cloud provisioning profile API client (see https://metaapi.cloud/docs/provisioning/)
 */
export class ProvisioningProfileClient {

  /**
   * Retrieves provisioning profiles owned by user
   * (see https://metaapi.cloud/docs/provisioning/api/provisioningProfile/readProvisioningProfiles/)
   * Method is accessible only with API access token
   * @param {Number} version optional version filter (allowed values are 4 and 5)
   * @param {String} status optional status filter (allowed values are new and active)
   * @return {Promise<Array<ProvisioningProfileDto>>} promise resolving with provisioning profiles found
   */
   getProvisioningProfiles(version: Number, status: String): Promise<Array<ProvisioningProfileDto>>;

   /**
   * Retrieves a provisioning profile by id (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/readProvisioningProfile/). Throws an error if
   * profile is not found.
   * Method is accessible only with API access token
   * @param {String} id provisioning profile id
   * @return {Promise<ProvisioningProfileDto>} promise resolving with provisioning profile found
   */
  getProvisioningProfile(id: String): Promise<ProvisioningProfileDto>

  /**
   * Creates a new provisioning profile (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/createNewProvisioningProfile/). After creating a
   * provisioning profile you are required to upload extra files in order to activate the profile for further use.
   * Method is accessible only with API access token
   * @param {NewProvisioningProfileDto} provisioningProfile provisioning profile to create
   * @return {Promise<ProvisioningProfileIdDto>} promise resolving with an id of the provisioning profile created
   */
  createProvisioningProfile(provisioningProfile: NewProvisioningProfileDto): Promise<ProvisioningProfileIdDto>;
   
   /**
   * Uploads a file to a provisioning profile (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/uploadFilesToProvisioningProfile/). Uploading a
   * file by name is allowed only for Node.js.
   * Method is accessible only with API access token
   * @param {String} provisioningProfileId provisioning profile id to upload file to
   * @param {String} fileName name of the file to upload. Allowed values are servers.dat for MT5 profile, broker.srv for
   * MT4 profile
   * @param {String|Buffer} file path to a file to upload or buffer containing file contents
   * @return {Promise} promise resolving when file upload is completed
   */
  uploadProvisioningProfileFile(provisioningProfileId: String, fileName: String, file: String|Buffer): Promise<any>;

  /**
   * Deletes a provisioning profile (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/deleteProvisioningProfile/). Please note that in
   * order to delete a provisioning profile you need to delete MT accounts connected to it first.
   * Method is accessible only with API access token
   * @param {String} id provisioning profile id
   * @return {Promise} promise resolving when provisioning profile is deleted
   */
  deleteProvisioningProfile(id: String): Promise<any>;

  /**
   * Updates existing provisioning profile data (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/updateProvisioningProfile/).
   * Method is accessible only with API access token
   * @param {String} id provisioning profile id
   * @param {ProvisioningProfileUpdateDto} provisioningProfile updated provisioning profile
   * @return {Promise} promise resolving when provisioning profile is updated
   */
  updateProvisioningProfile(id: String, provisioningProfile: ProvisioningProfileUpdateDto): Promise<any>;
}

/**
 * Provisioning profile model
 */
export declare type ProvisioningProfileDto = {

  /**
   * provisioning profile unique identifier
   */
  _id: String,

  /**
   * provisioning profile name
   */
  name: String,

  /**
   * MetaTrader version (allowed values are 4 and 5)
   */
  version: Number,

  /**
   * provisioning profile status (allowed values are new and active)
   */
  status: String,

  /**
   * broker timezone name from Time Zone Database
   */
  brokerTimezone: String,

  /**
   * broker DST switch timezone name from Time Zone Database
   */
  brokerDSTSwitchTimezone: String
}

/**
 * New provisioning profile model
 */
export declare type NewProvisioningProfileDto = {

  /**
   * provisioning profile name
   */
  name: String,

  /**
   * MetaTrader version (allowed values are 4 and 5)
   */
  version: Number,

  /**
   * broker timezone name from Time Zone Database
   */
  brokerTimezone: String,

  /**
   * broker DST switch timezone name from Time Zone Database
   */
  brokerDSTSwitchTimezone: String
}

/**
 * Updated provisioning profile data
 */
export declare type ProvisioningProfileUpdateDto = {

  /**
   * provisioning profile name
   */
  name: String
}

/**
 * Provisioning profile id model
 */
export declare type ProvisioningProfileIdDto = {

  /**
   * provisioning profile unique identifier
   */
  id: String
}