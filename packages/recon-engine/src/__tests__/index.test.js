const expect = require('expect');
const api = require('../index');

describe('react-engine::index', () => {
  it('should provide expected api', () => {
    expect(api.createEngine).toBeA(Function);
  });
});
