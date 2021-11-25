import { ProvisioningProfileClient, ProvisioningProfileDto, ProvisioningProfileUpdateDto } from "../clients/metaApi/provisioningProfile.client";

/**
 * Implements a provisioning profile entity
 */
export default class ProvisioningProfile {

  /**
   * Constructs a provisioning profile entity
   * @param {ProvisioningProfileDto} data provisioning profile data
   * @param {ProvisioningProfileClient} provisioningProfileClient provisioning profile REST API client
   */
  constructor(data: ProvisioningProfileDto, provisioningProfileClient: ProvisioningProfileClient);
  
  /**
   * Returns profile id
   * @return {String} profile id
   */
  get id(): String;

  /**
   * Returns profile name
   * @return {String} profile name
   */
  get name(): String;

  /**
   * Returns profile version. Possible values are 4 and 5
   * @return {Number} profile version
   */
  get version(): Number;

  /**
   * Returns profile status. Possible values are new and active
   * @return {String} profile status
   */
  get status(): String;

  /**
   * Returns broker timezone name from Time Zone Database
   * @return {String} broker timezone name
   */
  get brokerTimezone(): String;

  /**
   * Returns broker DST timezone name from Time Zone Database
   * @return {String} broker DST switch timezone name
   */
  get brokerDSTSwitchTimezone(): String;

  /**
   * Reloads provisioning profile from API
   * @return {Promise} promise resolving when provisioning profile is updated
   */
  reload(): Promise<any>;

  /**
   * Removes provisioning profile. The current object instance should be discarded after returned promise resolves.
   * @return {Promise} promise resolving when provisioning profile is removed
   */
  remove(): Promise<any>;

  /**
   * Uploads a file to provisioning profile.
   * @param {String} fileName name of the file to upload. Allowed values are servers.dat for MT5 profile, broker.srv for
   * MT4 profile
   * @param {String|Buffer} file path to a file to upload or buffer containing file contents
   * @return {Promise} promise which resolves when the file was uploaded
   */
  uploadFile(fileName: string, file: String|Buffer);

  /**
   * Updates provisioning profile
   * @param {ProvisioningProfileUpdateDto} profile provisioning profile update
   * @return {Promise} promise resolving when provisioning profile is updated
   */
  update(profile: ProvisioningProfileUpdateDto): Promise<any>;
}