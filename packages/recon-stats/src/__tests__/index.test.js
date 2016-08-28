/* eslint-env mocha */
const expect = require('expect');

const api = require('../index');

describe('recon-stats::index', () => {
  it('should provide expected api', () => {
    expect(api.pullStats).toBeA(Function);
  });
});
