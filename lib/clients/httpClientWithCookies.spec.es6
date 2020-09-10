'use strict';

import HttpClientWithCookies from './httpClientWithCookies';

/**
 * @test {HttpClientWithCookies}
 */
describe('HttpClientWithCookies', () => {

  let httpClient;

  beforeEach(() => {
    httpClient = new HttpClientWithCookies();
  });

  /**
   * @test {HttpClientWithCookies#request}
   */
  it('should load HTML page from example.com', (done) => {
    let opts = {
      url: 'http://example.com'
    };
    httpClient.request(opts)
      .then((response) => {
        response.body.should.match(/doctype html/);
        response.cookies.should.eql([]);
      })
      .then(done, done);
  }).timeout(10000);
});
