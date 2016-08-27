/* eslint-env mocha */
const expect = require('expect');
const Path = require('path');

const createConfig = require('../createConfig');

describe('recon-config::createConfig', () => {
  it('should read a config file with no user config', () => {
    const cwd = Path.resolve(__dirname, '../__fixtures__/all');
    const uc = undefined;
    expect(createConfig(cwd, uc)).toMatch({
      resolve: {}
    });
  });
});
