const expect = require('expect');
const parseModule = require('../parseModule');
const FS = require('fs');
const Path = require('path');

describe('react-engine::parse/parseModule', () => {
  describe('::parseModule (default)', () => {

    it('should parse module information as expected', () => {
      function run(path) {
        const absPath = Path.join(__dirname, '../__fixtures__/parseModule', path);
        const output = require(`${absPath}/output`);
        const src = FS.readFileSync(`${absPath}/src.js`, {encoding: 'utf8'});
        const module = {src, path};
        expect(parseModule(module)).toMatch(output);
      }

      run('empty');
      run('no-components');
      run('basic-components');
      run('enhanced-components');
      run('real-world-lystable');
    });

  });
});
