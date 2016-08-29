/* eslint-disable no-console */
const _glob = require('glob');
const Path = require('path');
const Jetpack = require('fs-jetpack');
const {graphql} = require('graphql');
const {
  pull,
  forEach,
  values,
  filter,
  map,
  memoize,
  join,
  flatten,
  merge,
  cloneDeepWith,
} = require('lodash');

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

/** Resolve modules based on configuration (allows for some level of rewriting module paths */
function createResolver(
  cwd,
  {
    roots: _roots = [cwd],
    extensions = ['.js', '.jsx'],
  } = {}
) {
  const roots = _roots.map(r => Path.join(cwd, r));
  return memoize((context, target) => {
    const resolveFromPaths = [
      Path.dirname(context),
      ...roots
    ];
    const resolvedPaths = resolveFromPaths.map(path => Path.resolve(path, target));
    const finalPaths = /\.[a-zA-Z0-9]$/.test(target) // has extension
      ? resolvedPaths
      : flatten(resolvedPaths.map(p => [...extensions.map(ext => `${p}${ext}`), Path.join(p, 'index.js')]));

    return finalPaths;
  }, join);
}

/** Create a new engine instance */
function createEngine({files, cwd = process.cwd(), resolve}) {
  const subscriptions = [];
  const modules = {};
  let hasDiscovered = false;

  const resolveModulePaths = createResolver(cwd, resolve);

  // TODO: Cache parsed modules
  // TODO: Add persisted/watching support

  glob(files, {cwd}).then((foundFiles) => {
    hasDiscovered = true;

    forEach(foundFiles, file => {
      const path = Path.join(cwd, file);
      const module = modules[file] = {ready: false, file, path};

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

    send();
  });

  /** Get stats about the current state */
  function getStats() {
    const allModules = values(modules);
    const readyModules = filter(allModules, m => m.ready);
    const moduleErrors = map(filter(allModules, m => m.error), m => ({
      path: m.path,
      error: m.error,
    }));
    return {
      numModules: allModules.length,
      numReadyModules: readyModules.length,
      numErroredModules: moduleErrors.length,
      moduleErrors,
      hasDiscovered,
      canQuery: hasDiscovered && allModules.length === readyModules.length,
    };
  }

  // TODO: The memoizing inside query/resolve doesn't support changing data yet :(
  const schema = createSchema(modules, {resolveModulePaths});

  /* Run a graphql query against our store */
  function runQuery(query) {
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

  /** get debug information */
  function _debug({raw = true}) {
    if (raw) {
      return {modules};
    }

    // exclude ast nodes from debug output (just track source location)
    const ignoreAstNodes = (v, k) => k === '__node' ? v.loc : undefined;

    const strippedModules = cloneDeepWith(modules, ignoreAstNodes);
    return {modules: strippedModules};
  }

  return {runQuery, subscribe, schema, _debug};
}

module.exports = createEngine;
