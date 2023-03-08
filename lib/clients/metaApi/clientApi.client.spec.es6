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
  let domainClient;
  let sandbox;
  let requestStub;
  let clock;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    domainClient = {
      token,
      domain: 'agiliumtrade.agiliumtrade.ai',
      getUrl: () => {}
    };
    requestStub = sandbox.stub(httpClient, 'request');
    sandbox.stub(domainClient, 'getUrl').resolves(clientApiUrl);
    clientApiClient = new ClientApiClient(httpClient, domainClient);
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
      const expected2 = {
        g1: {
          specification: ['startTime'],
          position: ['profit'],
          order: ['currentPrice']
        },
        g2: {
          specification: ['pipSize'],
          position: ['comment'],
          order: ['brokerComment']
        },
      };
      requestStub.resolves(expected);
      try {
        clientApiClient.getHashingIgnoredFieldLists('vint-hill');
        sinon.assert.fail();
      } catch (error) {
        sinon.assert.match(error.message, 'Ignored field lists for region vint-hill not found');
      }
      try {
        clientApiClient.getHashingIgnoredFieldLists('combined');
        sinon.assert.fail();
      } catch (error) {
        sinon.assert.match(error.message, 'Ignored field lists not found');
      }
      await clientApiClient.refreshIgnoredFieldLists('vint-hill');
      let ignoredFields = clientApiClient.getHashingIgnoredFieldLists('vint-hill');
      ignoredFields.should.equal(expected);
      let combinedIgnoredFields = clientApiClient.getHashingIgnoredFieldLists('combined');
      combinedIgnoredFields.should.equal(expected);
      sinon.assert.calledOnceWithExactly(httpClient.request, {
        url: `${clientApiUrl}/hashing-ignored-field-lists`,
        method: 'GET',
        json: true,
        headers: {
          'auth-token': token
        }
      }, 'getHashingIgnoredFieldLists');
      await clientApiClient.refreshIgnoredFieldLists('vint-hill');
      sinon.assert.calledOnce(httpClient.request);
      try {
        clientApiClient.getHashingIgnoredFieldLists('new-york');
        sinon.assert.fail();
      } catch (error) {
        sinon.assert.match(error.message, 'Ignored field lists for region new-york not found');
      }
      requestStub.resolves(expected2);
      await clientApiClient.refreshIgnoredFieldLists('new-york');
      sinon.assert.calledTwice(httpClient.request);
      combinedIgnoredFields = clientApiClient.getHashingIgnoredFieldLists('combined');
      combinedIgnoredFields.should.equal(expected2);
    });

    /**
     * @test {ClientApiClient#getHashingIgnoredFieldLists}
     */
    it('should update data when caching time expired', async () => {
      const expected2 = {
        g1: {
          specification: ['description'],
          position: ['profit'],
          order: ['expirationTime']
        },
        g2: {
          specification: ['pipSize'],
          position: ['comment'],
          order: ['brokerComment']
        },
      };
      requestStub.resolves(expected);
      await clientApiClient.refreshIgnoredFieldLists('vint-hill');
      let ignoredFields = clientApiClient.getHashingIgnoredFieldLists('vint-hill');
      ignoredFields.should.equal(expected);
      requestStub.resolves(expected2);
      await clock.tickAsync(61 * 60 * 1000);
      let ignoredFields2 = clientApiClient.getHashingIgnoredFieldLists('vint-hill');
      ignoredFields2.should.equal(expected2);
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
      
      await Promise.all([clientApiClient.refreshIgnoredFieldLists('vint-hill'),
        clientApiClient.refreshIgnoredFieldLists('vint-hill')]);
      let ignoredFields = clientApiClient.getHashingIgnoredFieldLists('vint-hill');
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
    it('should retry request if received error', async () => {
      let callNumber = 0;
      requestStub.callsFake(async (arg) => {
        await new Promise(res => setTimeout(res, 50));
        callNumber++;
        if(callNumber < 3) {
          throw new Error('test');
        } else {
          return expected;
        }
      });
      
      clientApiClient.refreshIgnoredFieldLists('vint-hill');
      clientApiClient.refreshIgnoredFieldLists('vint-hill');
      await clock.tickAsync(6000);
      let ignoredFields = clientApiClient.getHashingIgnoredFieldLists('vint-hill');
      ignoredFields.should.equal(expected);
      sinon.assert.callCount(httpClient.request, 3);
    });

  });

});
