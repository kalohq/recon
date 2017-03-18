/* eslint-env jest */
const api = require('../index');

it('should provide expected api', () => {
  expect(api.getConfig).toBeInstanceOf(Function);
  expect(api.createConfig).toBeInstanceOf(Function);
});
