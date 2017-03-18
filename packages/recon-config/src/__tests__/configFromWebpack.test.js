/* eslint-env jest */
const configFromWebpack = require('../configFromWebpack');

it('should return expected configuration', () => {
  const cwd = '/root/test';
  const webpackConfig = {
    context: '/root/test/src',
    resolve: {
      roots: ['/root/test/src/core'],
      extensions: ['.test', ''],
    },
  };
  const reconConfig = {
    context: 'src',
    resolve: {
      roots: ['core'],
      extensions: ['.test'],
    },
  };

  expect(configFromWebpack(webpackConfig, {cwd})).toMatchObject(reconConfig);
});
