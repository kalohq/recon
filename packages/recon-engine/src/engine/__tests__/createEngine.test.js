/* eslint-env jest */
const Path = require('path');
const FS = require('fs');

const createEngine = require('../createEngine');

function run(path) {
  const absPath = Path.resolve(__dirname, '__fixtures__', path);
  const query = FS.readFileSync(Path.resolve(absPath, 'query.graphql'), {
    encoding: 'utf8',
  });

  const engine = createEngine({
    files: '**/*.js',
    context: Path.resolve(absPath, 'src'),
  });

  return new Promise((accept, reject) => {
    engine.subscribe(stats => {
      if (stats.numModules && stats.canQuery) {
        engine.runQuery(query).then(
          result => {
            // TODO: snapshot tests
            expect(result).toMatchSnapshot();
            accept();
          },
          err => reject(err)
        );
      }
    });
  });
}

it('should respond to query as expected: basic-app', () => run('basic-app'));
