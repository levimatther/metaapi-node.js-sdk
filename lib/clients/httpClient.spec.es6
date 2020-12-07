'use strict';

import should from 'should';
import assert from 'assert';
import sinon  from 'sinon';
import HttpClient from './httpClient';

/**
 * @test {HttpClient}
 */
describe('HttpClient', () => {

  let httpClient;

  beforeEach(() => {
    httpClient = new HttpClient();
  });

  /**
   * @test {HttpClient#request}
   */
  it('should load HTML page from example.com', (done) => {
    let opts = {
      url: 'http://example.com'
    };
    httpClient.request(opts)
      .then((body) => {
        body.should.match(/doctype html/);
      })
      .then(done, done);
  }).timeout(10000);

  /**
   * @test {HttpClient#request}
   */
  it('should return NotFound error if server returns 404', (done) => {
    let opts = {
      url: 'http://example.com/not-found'
    };
    httpClient.request(opts)
      .catch((err) => {
        err.name.should.eql('NotFoundError');
      })
      .then(done, done);
  }).timeout(10000);

  /**
   * @test {HttpClient#request}
   */
  it('should return timeout error if request is timed out', (done) => {
    httpClient = new HttpClient(0.0001);
    let opts = {
      url: 'http://agiliumlabs.cloud/not-found'
    };
    httpClient.request(opts)
      .catch((err) => {
        err.name.should.eql('ApiError');
        err.message.should.eql('ETIMEDOUT');
      })
      .then(done, done);
  }).timeout(10000);

});
