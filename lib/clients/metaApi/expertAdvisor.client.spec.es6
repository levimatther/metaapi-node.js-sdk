'use strict';

import HttpClient from '../httpClient';
import sinon from 'sinon';
import ExpertAdvisorClient from './expertAdvisor.client';

const provisioningApiUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {ExpertAdvisorClient}
 */
describe('ExpertAdvisorClient', () => {

  let expertAdvisorClient;
  const token = 'header.payload.sign';
  let httpClient = new HttpClient();
  let domainClient;
  let sandbox;
  let requestStub;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    domainClient = {
      token,
      domain: 'agiliumtrade.agiliumtrade.ai'
    };
    expertAdvisorClient = new ExpertAdvisorClient(httpClient, domainClient);
    requestStub = sandbox.stub(httpClient, 'request');
  });

  afterEach(() => {
    sandbox.restore();
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
    requestStub.resolves(expected);
    let expertAdvisors = await expertAdvisorClient.getExpertAdvisors('id');
    expertAdvisors.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors`,
      method: 'GET',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'getExpertAdvisors');
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
    requestStub.resolves(expected);
    let advisor = await expertAdvisorClient.getExpertAdvisor('id', 'my-ea');
    advisor.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors/my-ea`,
      method: 'GET',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'getExpertAdvisor');
  });

  /**
   * @test {ExpertAdvisorClient#deleteExpertAdvisor}
   */
  it('should delete expert advisor via API', async () => {
    await expertAdvisorClient.deleteExpertAdvisor('id', 'my-ea');
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors/my-ea`,
      method: 'DELETE',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'deleteExpertAdvisor');
  });

  /**
   * @test {ExpertAdvisorClient#updateExpertAdvisor}
   */
  it('should update expert advisor via API', async () => {
    await expertAdvisorClient.updateExpertAdvisor('id', 'my-ea', {
      preset: 'a2V5MT12YWx1ZTEKa2V5Mj12YWx1ZTIKa2V5Mz12YWx1ZTMKc3VwZXI9dHJ1ZQ==',
      period: '15m',
      symbol: 'EURUSD'
    });
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors/my-ea`,
      method: 'PUT',
      headers: {
        'auth-token': token
      },
      json: true,
      body: {
        preset: 'a2V5MT12YWx1ZTEKa2V5Mj12YWx1ZTIKa2V5Mz12YWx1ZTMKc3VwZXI9dHJ1ZQ==',
        period: '15m',
        symbol: 'EURUSD'
      }
    }, 'updateExpertAdvisor');
  });

  /**
   * @test {ExpertAdvisorClient#uploadExpertAdvisorFile}
   */
  it('should upload file to a expert advisor via API', async () => {
    let file = Buffer.from('test', 'utf8');
    await expertAdvisorClient.uploadExpertAdvisorFile('id', 'my-ea', file);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors/my-ea/file`,
      method: 'PUT',
      headers: {
        'auth-token': token
      },
      formData: {
        file
      },
      json: true,
    }, 'uploadExpertAdvisorFile');
  });

});
