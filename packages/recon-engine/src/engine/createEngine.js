const glob = require('glob');
const Path = require('path');
const FS = require('fs');
const {graphql} = require('graphql');

const createSchema = require('../query/createSchema');
const parseModule = require('../parse/parseModule');

function createEngine({files, cwd} = {}) {
  const modules = [];

  glob(files, {cwd}, (error, foundFiles) => {
    if (error) {
      throw error;
    }

    foundFiles.forEach(
      file => {
        const path = Path.join(cwd, file);
        FS.readFile(path, {encoding: 'utf8'},
          (err, src) => {
            if (err) {
              throw err;
            }

            const module = {src, path};
            modules.push(parseModule(module));
          }
        )
      }
    )
  });

  const schema = createSchema(modules);

  /* Run a graphql query against our store */
  function runQuery(query) {
    return graphql(schema, query);
  }

  return {runQuery};
}

module.exports = createEngine;
