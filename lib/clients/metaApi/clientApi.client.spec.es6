'use strict';

import HttpClient from '../httpClient';
import sinon from 'sinon';
import ClientApiClient from './clientApi.client';

const clientApiUrl = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {ClientApiClient}
 */
describe('ClientApiClient', () => {

  let clientApiClient;
  const token = 'header.payload.sign';
  let httpClient = new HttpClient();
  let sandbox;
  let requestStub;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    clientApiClient = new ClientApiClient(httpClient, token);
    requestStub = sandbox.stub(httpClient, 'request');
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {ClientApiClient#getHashingIgnoredFieldLists}
   */
  it('should retrieve hashing ignored field lists', async () => {
    const expected = {
      g1: {
        specification: ['description'],
        position: ['time'],
        order: ['expirationTime']
      },
      g2: {
        specification: ['pipSize'],
        position: ['comment'],
        order: ['brokerComment']
      },
    };
    requestStub.resolves(expected);
    let ignoredFields = await clientApiClient.getHashingIgnoredFieldLists();
    ignoredFields.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${clientApiUrl}/hashing-ignored-field-lists`,
      method: 'GET',
      json: true,
      headers: {
        'auth-token': token
      }
    }, 'getHashingIgnoredFieldLists');
  });

});
