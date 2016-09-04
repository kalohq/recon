/* eslint-env mocha */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
const expect = require('expect');
const Path = require('path');

const getConfig = require('../getConfig');

describe('recon-config::getConfig', () => {
  it('should read a config file with no user config', () => {
    const cwd = Path.resolve(__dirname, '../__fixtures__/all');
    const uc = undefined;
    expect(getConfig(uc, {cwd})).toMatch({
      files: '**/*.js',
      resolve: {},
    });
  });
  it('should read a config file with user config', () => {
    const cwd = Path.resolve(__dirname, '../__fixtures__/all');
    const uc = {files: 'test.js'};
    expect(getConfig(uc, {cwd})).toMatch({
      files: 'test.js',
      resolve: {},
    });
  });
});
