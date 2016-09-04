/* eslint-env mocha */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
const expect = require('expect');

const configFromWebpack = require('../configFromWebpack');

describe('recon-config::configFromWebpack', () => {

  it('should return expected configuration', () => {
    const cwd = '/root/test';
    const webpackConfig = {
      context: '/root/test/src',
      resolve: {
        roots: [
          '/root/test/src/core',
        ],
        extensions: ['.test', ''],
      },
    };
    const reconConfig = {
      context: 'src',
      resolve: {
        roots: [
          'core',
        ],
        extensions: ['.test'],
      },
    };

    expect(configFromWebpack(webpackConfig, {cwd})).toMatch(reconConfig);
  });

});
