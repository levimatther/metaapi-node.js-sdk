'use strict';

import {HttpClientMock} from '../httpClient';
import ProvisioningProfileClient from './provisioningProfile.client';

const provisioningApiUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {ProvisioningProfileClient}
 */
describe('ProvisioningProfileClient', () => {

  let provisioningClient;
  let httpClient = new HttpClientMock(() => 'empty');

  beforeEach(() => {
    provisioningClient = new ProvisioningProfileClient(httpClient, 'header.payload.sign');
  });

  /**
   * @test {ProvisioningProfileClient#getProvisioningProfiles}
   */
  it('should retrieve provisioning profiles from API', async () => {
    let expected = [{
      _id: 'id',
      name: 'name',
      version: 4,
      status: 'active'
    }];
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/provisioning-profiles`,
            method: 'GET',
            qs: {
              version: 5,
              status: 'active'
            },
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000
          });
          return expected;
        });
    };
    let profiles = await provisioningClient.getProvisioningProfiles(5, 'active');
    profiles.should.equal(expected);
  });

  /**
   * @test {MetatraderAccountClient#getProvisioningProfiles}
   */
  it('should not retrieve provisioning profiles from API with account token', async () => {
    provisioningClient = new ProvisioningProfileClient(httpClient, 'token');
    try {
      await provisioningClient.getProvisioningProfiles(5, 'active');
    } catch (error) {
      error.message.should.equal(
        'You can not invoke getProvisioningProfiles method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ProvisioningProfileClient#getProvisioningProfile}
   */
  it('should retrieve provisioning profile from API', async () => {
    let expected = {
      _id: 'id',
      name: 'name',
      version: 4,
      status: 'active'
    };
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/provisioning-profiles/id`,
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
    let profile = await provisioningClient.getProvisioningProfile('id');
    profile.should.equal(expected);
  });

  /**
   * @test {MetatraderAccountClient#getProvisioningProfile}
   */
  it('should not retrieve provisioning profile from API with account token', async () => {
    provisioningClient = new ProvisioningProfileClient(httpClient, 'token');
    try {
      await provisioningClient.getProvisioningProfile('id');
    } catch (error) {
      error.message.should.equal(
        'You can not invoke getProvisioningProfile method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ProvisioningProfileClient#createProvisioningProfile}
   */
  it('should create provisioning profile via API', async () => {
    let expected = {
      id: 'id'
    };
    let profile = {
      name: 'name',
      version: 4
    };
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/provisioning-profiles`,
            method: 'POST',
            body: profile,
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000
          });
          return expected;
        });
    };
    let id = await provisioningClient.createProvisioningProfile(profile);
    id.should.equal(expected);
  });

  /**
   * @test {MetatraderAccountClient#createProvisioningProfile}
   */
  it('should not create provisioning profile via API with account token', async () => {
    provisioningClient = new ProvisioningProfileClient(httpClient, 'token');
    try {
      await provisioningClient.createProvisioningProfile({});
    } catch (error) {
      error.message.should.equal(
        'You can not invoke createProvisioningProfile method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ProvisioningProfileClient#uploadProvisioningProfileFile}
   */
  it('should upload file to a provisioning profile via API', async () => {
    let file = Buffer.from('test', 'utf8');
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.match({
            url: `${provisioningApiUrl}/users/current/provisioning-profiles/id/servers.dat`,
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
          return;
        });
    };
    await provisioningClient.uploadProvisioningProfileFile('id', 'servers.dat', file);
  });

  /**
   * @test {MetatraderAccountClient#uploadProvisioningProfileFile}
   */
  it('should not upload provisioning profile file via API with account token', async () => {
    provisioningClient = new ProvisioningProfileClient(httpClient, 'token');
    try {
      await provisioningClient.uploadProvisioningProfileFile('id', 'servers.dat', {});
    } catch (error) {
      error.message.should.equal(
        'You can not invoke uploadProvisioningProfileFile method, because you have connected with account access' +
        ' token. Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ProvisioningProfileClient#deleteProvisioningProfile}
   */
  it('should delete provisioning profile via API', async () => {
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/provisioning-profiles/id`,
            method: 'DELETE',
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000
          });
          return;
        });
    };
    await provisioningClient.deleteProvisioningProfile('id');
  });

  /**
   * @test {MetatraderAccountClient#deleteProvisioningProfile}
   */
  it('should not delete provisioning profile via API with account token', async () => {
    provisioningClient = new ProvisioningProfileClient(httpClient, 'token');
    try {
      await provisioningClient.deleteProvisioningProfile('id');
    } catch (error) {
      error.message.should.equal(
        'You can not invoke deleteProvisioningProfile method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ProvisioningProfileClient#updateProvisioningProfile}
   */
  it('should update provisioning profile via API', async () => {
    httpClient.requestFn = (opts) => {
      return Promise
        .resolve()
        .then(() => {
          opts.should.eql({
            url: `${provisioningApiUrl}/users/current/provisioning-profiles/id`,
            method: 'PUT',
            headers: {
              'auth-token': 'header.payload.sign'
            },
            json: true,
            timeout: 60000,
            body: {
              name: 'new name'
            }
          });
        });
    };
    await provisioningClient.updateProvisioningProfile('id', {name: 'new name'});
  });

  /**
   * @test {MetatraderAccountClient#updateProvisioningProfile}
   */
  it('should not update provisioning profile via API with account token', async () => {
    provisioningClient = new ProvisioningProfileClient(httpClient, 'token');
    try {
      await provisioningClient.updateProvisioningProfile('id', {name: 'new name'});
    } catch (error) {
      error.message.should.equal(
        'You can not invoke updateProvisioningProfile method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

});
