/* eslint-env mocha */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
const expect = require('expect');
const parseModule = require('../parseModule');
const FS = require('fs');
const Path = require('path');

describe('react-engine::parse/parseModule', () => {
  describe('::parseModule (default)', () => {

    function run(path) {
      const absPath = Path.join(__dirname, '../__fixtures__', path);
      const output = require(`${absPath}/output`); // eslint-disable-line global-require
      const src = FS.readFileSync(`${absPath}/src.js`, {encoding: 'utf8'});
      const module = {src, path, id: path};
      const parsed = parseModule(module);
      expect(parsed).toMatch(output);
    }

    it('should parse module information as expected: empty', () => run('empty'));
    it('should parse module information as expected: no-components', () => run('no-components'));
    it('should parse module information as expected: basic-components', () => run('basic-components'));
    it('should parse module information as expected: enhanced-components', () => run('enhanced-components'));
    it('should parse module information as expected: real-world-lystable', () => run('real-world-lystable'));
    it('should parse module information as expected: re-exports', () => run('re-exports'));
    it('should parse module information as expected: dynamic-components', () => run('dynamic-components'));

  });
});
