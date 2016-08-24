const glob = require('glob');
const Path = require('path');
const FS = require('fs');
const {graphql} = require('graphql');

const createSchema = require('../query/createSchema');
const parseModule = require('../parse/parseModule');

function createEngine({files, cwd, resolveModulePaths} = {}) {
  const modules = [];

  glob(files, {cwd}, (error, foundFiles) => {
    if (error) {
      throw error;
    }

    console.log(`Found ${foundFiles.length} modules`);

    let numParsed = 0;
    let numErrored = 0;
    foundFiles.forEach(
      file => {
        const path = Path.join(cwd, file);
        FS.readFile(path, {encoding: 'utf8'},
          (err, src) => {
            if (err) {
              numParsed = numParsed + 1;
              console.log(`Failed reading module: ${path}`);
              throw err;
            }

            const module = {src, path};
            numParsed = numParsed + 1;
            console.log(`Parsing module: ${file} ...`);
            const parsedModule = parseModule(module);
            modules.push(parsedModule);
            if (parsedModule.err) {
              console.error(`Failed parsing module: ${path} (Original error: ${parsedModule.err.message})`);
              numErrored = numErrored + 1;
            } else {
              console.log(`Parsed module: ${file} (${numParsed}/${foundFiles.length})`);
            }

            if (numParsed === foundFiles.length) {
              console.log('---')
              console.log(`Parsed ${numParsed} modules. Saw ${numErrored} errors!`);
              console.log('---');
            }
          }
        )
      }
    );
  });

  const schema = createSchema(modules, {resolveModulePaths});

  /* Run a graphql query against our store */
  function runQuery(query) {
    console.log('Runnning query...');
    return graphql(schema, query);
  }

  return {runQuery};
}

module.exports = createEngine;
