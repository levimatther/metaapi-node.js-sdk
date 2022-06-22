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
  let clock;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    clientApiClient = new ClientApiClient(httpClient, token);
    requestStub = sandbox.stub(httpClient, 'request');
    clock = sandbox.useFakeTimers({
      shouldAdvanceTime: true,
      now: new Date('2020-10-05T07:00:00.000Z')
    });
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
  });

  describe('getHashingIgnoredFieldLists', () => {

    let expected;
    beforeEach(() => {
      expected = {
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
    });

    /**
     * @test {ClientApiClient#getHashingIgnoredFieldLists}
     */
    it('should retrieve hashing ignored field lists', async () => {
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

    /**
     * @test {ClientApiClient#getHashingIgnoredFieldLists}
     */
    it('should return cached data if requested recently', async () => {
      requestStub.resolves(expected);
      let ignoredFields = await clientApiClient.getHashingIgnoredFieldLists();
      ignoredFields.should.equal(expected);
      let ignoredFields2 = await clientApiClient.getHashingIgnoredFieldLists();
      ignoredFields2.should.equal(expected);
      sinon.assert.calledOnceWithExactly(httpClient.request, {
        url: `${clientApiUrl}/hashing-ignored-field-lists`,
        method: 'GET',
        json: true,
        headers: {
          'auth-token': token
        }
      }, 'getHashingIgnoredFieldLists');
    });

    /**
     * @test {ClientApiClient#getHashingIgnoredFieldLists}
     */
    it('should update data when caching time expired', async () => {
      requestStub.resolves(expected);
      let ignoredFields = await clientApiClient.getHashingIgnoredFieldLists();
      ignoredFields.should.equal(expected);
      await clock.tickAsync(61 * 60 * 1000);
      let ignoredFields2 = await clientApiClient.getHashingIgnoredFieldLists();
      ignoredFields2.should.equal(expected);
      sinon.assert.calledTwice(httpClient.request);
    });

    /**
     * @test {ClientApiClient#getHashingIgnoredFieldLists}
     */
    it('should send one request if two concurrent synchronizations', async () => {
      requestStub.callsFake(async (arg) => {
        await new Promise(res => setTimeout(res, 50));
        return expected;
      });
      
      let ignoredFields = await Promise.all([clientApiClient.getHashingIgnoredFieldLists(),
        clientApiClient.getHashingIgnoredFieldLists()]);
      ignoredFields[0].should.equal(expected);
      ignoredFields[1].should.equal(expected);
      sinon.assert.calledOnceWithExactly(httpClient.request, {
        url: `${clientApiUrl}/hashing-ignored-field-lists`,
        method: 'GET',
        json: true,
        headers: {
          'auth-token': token
        }
      }, 'getHashingIgnoredFieldLists');
    });

    /**
     * @test {ClientApiClient#getHashingIgnoredFieldLists}
     */
    it('should return error to promise', async () => {
      requestStub.callsFake(async (arg) => {
        await new Promise(res => setTimeout(res, 50));
        throw new Error('test');
      });
      
      let responses = [clientApiClient.getHashingIgnoredFieldLists(),
        clientApiClient.getHashingIgnoredFieldLists()];
      try {
        await responses[0];
        sinon.assert.fail();
      } catch (error) {
        error.message.should.equal('test');
      }
      try {
        await responses[1];
        sinon.assert.fail();
      } catch (error) {
        error.message.should.equal('test');
      }
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

});
