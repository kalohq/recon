const expect = require('expect');
const Path = require('path');
const FS = require('fs');

const createEngine = require('../createEngine');

function run(path) {
  const absPath = Path.join(__dirname, '../__fixtures__', path);
  const output = require(Path.join(absPath, 'output'));
  const query = FS.readFileSync(Path.join(absPath, 'query.graphql'), {encoding: 'utf8'});

  const engine = createEngine({
    files: '**/*.js',
    cwd: Path.join(absPath, 'src')
  });

  return new Promise((accept, reject) => {
    setTimeout(() => { // TODO: Need some way of knowing when recon is working/ready :D
      engine.runQuery(query).then(
        result => {
          expect(result).toMatch(output);
          accept();
        }
      );
    }, 1000);
  })
}

describe('react-engine::engine/createEngine', () => {
  describe('::createEngine (default)', () => {

    it('should respond to query as expected: basic-app', () => run('basic-app'));

  });
});
