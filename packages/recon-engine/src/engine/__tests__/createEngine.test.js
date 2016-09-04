/* eslint-env mocha */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
const expect = require('expect');
const Path = require('path');
const FS = require('fs');
const match = require('tmatch');

const createEngine = require('../createEngine');

function run(path) {
  const absPath = Path.resolve(__dirname, '../__fixtures__', path);
  const output = require(Path.resolve(absPath, 'output')); // eslint-disable-line global-require
  const query = FS.readFileSync(Path.resolve(absPath, 'query.graphql'), {encoding: 'utf8'});

  const engine = createEngine({
    files: '**/*.js',
    context: Path.resolve(absPath, 'src'),
  });

  return new Promise((accept, reject) => {
    engine.subscribe(stats => {
      if (stats.numModules && stats.canQuery) {
        engine.runQuery(query).then(
          result => {
            expect(match(result, output, {unordered: true})).toExist();
            accept();
          },
          err => reject(err)
        );
      }
    });
  });
}

describe('react-engine::engine/createEngine', () => {
  describe('::createEngine (default)', () => {

    it('should respond to query as expected: basic-app', () => run('basic-app'));

  });
});
