/* eslint-env mocha */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
const expect = require('expect');
const Path = require('path');

const createConfig = require('../createConfig');

describe('recon-config::createConfig', () => {
  it('should read a config file with no user config', () => {
    const cwd = Path.resolve(__dirname, '../__fixtures__/all');
    const uc = undefined;
    expect(createConfig(uc, {cwd})).toMatch({
      resolve: {},
    });
  });
});
