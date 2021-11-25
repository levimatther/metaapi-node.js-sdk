import ExpertAdvisorClient, { ExpertAdvisorDto, NewExpertAdvisorDto } from "../clients/metaApi/expertAdvisor.client";

/**
 * Implements an expert advisor entity
 */
export default class ExpertAdvisor {
  
  /**
   * Constructs an expert advisor entity
   * @param {ExpertAdvisorDto} data
   * @param accountId
   * @param expertAdvisorClient
   */
  constructor(data: ExpertAdvisorDto, accountId: String, expertAdvisorClient: ExpertAdvisorClient);
  
  /**
   * Returns expert id
   * @returns {String} expert id
   */
  get expertId(): String;
  
  /**
   * Returns expert period
   * @returns {String} expert period
   */
  get period(): String;
  
  /**
   * Returns expert symbol
   * @returns {String} expert symbol
   */
  get symbol(): String;
  
  /**
   * Returns true if expert file was uploaded
   * @returns {Boolean}
   */
  get fileUploaded(): Boolean;
  
  /**
   * Reloads expert advisor from API
   * (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/readExpertAdvisor/)
   * @returns {Promise} promise resolving when expert advisor is updated
   */
  reload(): Promise<any>;
  
  /**
   * Updates expert advisor data
   * (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/updateExpertAdvisor/)
   * @param {NewExpertAdvisorDto} expert new expert advisor data
   * @returns {Promise} promise resolving when expert advisor is updated
   */
  update(expert: NewExpertAdvisorDto): Promise<any>;
  
  /**
   * Uploads an expert advisor file. EAs which use DLLs are not supported
   * (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/uploadEAFile/)
   * @param {String|Buffer} file expert advisor file
   * @returns {Promise} promise resolving when file upload is completed
   */
  uploadFile(file: String|Buffer): Promise<any>;
  
  /**
   * Removes expert advisor
   * (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/deleteExpertAdvisor/)
   * @returns {Promise} promise resolving when expert advisor removed
   */
  remove(): Promise<any>;
}