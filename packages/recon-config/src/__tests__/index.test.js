/* eslint-env mocha */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
const expect = require('expect');

const api = require('../index');

describe('recon-config::index', () => {
  it('should provide expected api', () => {
    expect(api.createConfig).toBeA(Function);
  });
});
