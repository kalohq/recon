/* eslint-env mocha */
const expect = require('expect');

const api = require('../index');

describe('recon-server::index', () => {
  it('should provide expected api', () => {
    expect(api.createServer).toBeA(Function);
  });
});
