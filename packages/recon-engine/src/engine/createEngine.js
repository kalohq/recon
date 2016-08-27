/* eslint-disable no-console */
const _glob = require('glob');
const Path = require('path');
const Jetpack = require('fs-jetpack');
const {graphql} = require('graphql');
const {pull, forEach, values, filter, map} = require('lodash');

const createSchema = require('../query/createSchema');
const parseModule = require('../parse/parseModule');

/** Promisified glob */
function glob(pattern, opts) {
  return new Promise((resolve, reject) => {
    _glob(pattern, opts, (err, files) => {
      return err ? reject(err) : resolve(files);
    });
  });
}

/** Create a new engine instance */
function createEngine({files, cwd, resolveModulePaths} = {}) {
  const subscriptions = [];
  const modules = {};
  let hasFoundFiles = false;

  // TODO: Cache parsed modules
  // TODO: Add persisted/watching support

  glob(files, {cwd}).then((foundFiles) => {
    hasFoundFiles = true;

    forEach(foundFiles, file => {
      const path = Path.join(cwd, file);
      const module = modules[file] = {ready: false, file, path};
      send();

      Jetpack.readAsync(path, 'utf8').then(
        src => {
          module.ready = true;
          module.parsed = parseModule({src, path, id: file});
          module.error = module.parsed.error;
          send();
        },
        error => {
          module.ready = true;
          module.error = error;
          send();
        }
      );
    });
  });

  /** Get data for query/resolution stage */
  function getData() {
    return map(filter(values(modules), m => m.ready), m => m.parsed);
  }

  /** Get stats about the current state */
  function getStats() {
    const allModules = values(modules);
    const readyModules = filter(allModules, m => m.ready);
    const moduleErrors = map(filter(allModules, m => m.error), m => m.error);
    return {
      numModules: allModules.length,
      numReadyModules: readyModules.length,
      numErroredModules: moduleErrors.length,
      moduleErrors,
      canQuery: hasFoundFiles && allModules.length === readyModules.length,
    };
  }

  /* Run a graphql query against our store */
  function runQuery(query) {
    // TODO: Have persistent schema and less aggressive memoizing within resolve. Ie. Not optimal to recreate for every invalidation.
    const schema = createSchema(getData(), {resolveModulePaths});
    return graphql(schema, query);
  }

  /**
   * Push changes to subscribers
   */
  function send() {
    forEach(subscriptions, func => func(getStats()));
  }

  /** Subscribe to changes */
  function subscribe(func) {
    subscriptions.push(func);
    // return an unsubscribe function
    return () => {
      pull(subscriptions, [func]);
    };
  }

  return {runQuery, subscribe};
}

module.exports = createEngine;
