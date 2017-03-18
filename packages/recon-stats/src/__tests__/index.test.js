/* eslint-env jest */
const api = require('../index');

it('should provide expected api', () => {
  expect(api.pullStats).toBeInstanceOf(Function);
});
