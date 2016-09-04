/* eslint-env mocha */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
const expect = require('expect');
const Path = require('path');
const Jetpack = require('fs-jetpack');

const createConfig = require('../createConfig');

describe('recon-config::createConfig', () => {
  it('should throw if a config already exists', () => {
    const cwd = Path.resolve(__dirname, '../__fixtures__/all');
    expect(() => createConfig({}, {cwd})).toThrow();
  });
  it('should create a new configuration file', () => {
    const uc = {
      resolve: {
        extensions: ['.jsx', '.js'],
      },
    };
    const cwd = Path.resolve(__dirname, '../__fixtures__/empty');
    const file = createConfig(uc, {cwd});
    expect(Jetpack.cwd(cwd).exists('.reconrc')).toBe('file');
    expect(Jetpack.cwd(cwd).read('.reconrc', 'json')).toMatch(uc);
    expect(file).toMatch(Path.join(cwd, '.reconrc'));
    // finally, clean up test
    Jetpack.cwd(cwd).remove('.reconrc');
  });
});
