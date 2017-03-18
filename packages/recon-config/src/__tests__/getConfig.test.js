/* eslint-env jest */
const Path = require('path');

const getConfig = require('../getConfig');

it('should read a config file with no user config', () => {
  const cwd = Path.resolve(__dirname, '__fixtures__/all');
  const uc = undefined;
  expect(getConfig(uc, {cwd})).toMatchObject({
    files: '**/*.js',
    resolve: {},
  });
});

it('should read a config file with user config', () => {
  const cwd = Path.resolve(__dirname, '__fixtures__/all');
  const uc = {files: 'test.js'};
  expect(getConfig(uc, {cwd})).toMatchObject({
    files: 'test.js',
    resolve: {},
  });
});
