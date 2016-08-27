/* eslint-env mocha */
const expect = require('expect');

const api = require('../index');

describe('recon-config::index', () => {
  it('should provide expected api', () => {
    expect(api.createConfig).toBeA(Function);
  });
});
