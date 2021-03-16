'use strict';

import {HttpClientMock} from '../httpClient';
import ExpertAdvisorClient from './expertAdvisor.client';

const provisioningApiUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {ExpertAdvisorClient}
 */
describe('ExpertAdvisorClient', () => {

  let expertAdvisorClient;
  let httpClient = new HttpClientMock(() => 'empty');

  beforeEach(() => {
    expertAdvisorClient = new ExpertAdvisorClient(httpClient, 'header.payload.sign');
  });

  /**
   * @test {ExpertAdvisorClient#getExpertAdvisors}
   */
  it('should retrieve expert advisors from API', async () => {
    const expected = [{
      expertId: 'my-ea',
      period: '1H',
      symbol: 'EURUSD',
      fileUploaded: false
    }];
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors`,
            method: 'GET',
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000
          });
          return expected;
        });
    };
    let expertAdvisors = await expertAdvisorClient.getExpertAdvisors('id');
    expertAdvisors.should.equal(expected);
  });

  /**
   * @test {ExpertAdvisorClient#getExpertAdvisor}
   */
  it('should retrieve expert advisor from API', async () => {
    let expected = {
      expertId: 'my-ea',
      period: '1H',
      symbol: 'EURUSD',
      fileUploaded: false
    };
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors/my-ea`,
            method: 'GET',
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000
          });
          return expected;
        });
    };
    let advisor = await expertAdvisorClient.getExpertAdvisor('id', 'my-ea');
    advisor.should.equal(expected);
  });

  /**
   * @test {ExpertAdvisorClient#deleteExpertAdvisor}
   */
  it('should delete expert advisor via API', async () => {
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors/my-ea`,
            method: 'DELETE',
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000
          });
        });
    };
    await expertAdvisorClient.deleteExpertAdvisor('id', 'my-ea');
  });

  /**
   * @test {ExpertAdvisorClient#updateExpertAdvisor}
   */
  it('should update expert advisor via API', async () => {
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors/my-ea`,
            method: 'PUT',
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000,
            body: {
              preset: 'a2V5MT12YWx1ZTEKa2V5Mj12YWx1ZTIKa2V5Mz12YWx1ZTMKc3VwZXI9dHJ1ZQ==',
              period: '15m',
              symbol: 'EURUSD'
            }
          });
        });
    };
    await expertAdvisorClient.updateExpertAdvisor('id', 'my-ea', {
      preset: 'a2V5MT12YWx1ZTEKa2V5Mj12YWx1ZTIKa2V5Mz12YWx1ZTMKc3VwZXI9dHJ1ZQ==',
      period: '15m',
      symbol: 'EURUSD'
    });
  });

  /**
   * @test {ExpertAdvisorClient#uploadExpertAdvisorFile}
   */
  it('should upload file to a expert advisor via API', async () => {
    let file = Buffer.from('test', 'utf8');
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.match({
            url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors/my-ea/file`,
            method: 'PUT',
            headers: {
              'auth-token': 'header.payload.sign'
            },
            formData: {
              file
            },
            json: true,
            timeout: 60000
          });
        });
    };
    await expertAdvisorClient.uploadExpertAdvisorFile('id', 'my-ea', file);
  });

});
