/* eslint-env mocha */
const expect = require('expect');

const api = require('../index');

describe('recon-engine::index', () => {
  it('should provide expected api', () => {
    expect(api.createEngine).toBeA(Function);
  });
});
