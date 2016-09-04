#! /usr/bin/env node
const vorpal = require('vorpal')();
const {forEach, padEnd, isArray, map, join, take, max, memoize, has} = require('lodash');
const ProgressBar = require('progress');
const dedent = require('dedent');
const jetpack = require('fs-jetpack');
const Path = require('path');

const {
  getConfig: _getConfig,
  createConfig: _createConfig,
  configFromWebpack: _configFromWebpack,
} = require('recon-config');
const {createEngine} = require('recon-engine');
const {pullStats: _pullStats} = require('recon-stats');
const {createServer} = require('recon-server');

const chalk = vorpal.chalk;

// helpful urls
const CONFIG_HELP_URL = 'https://github.com/lystable/recon/tree/master/packages/recon-config';


// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------


/** Determine whether the user may be using webpack or not? */
const detectWebpack = () => {
  const pkg = jetpack.cwd(process.cwd()).read('package.json', 'json');
  return has(pkg.dependencies, 'webpack') || has(pkg.devDependencies, 'webpack');
};

/** Given path to webpack config file lets gen recon config */
const configFromWebpack = (path) => {
  const configPath = Path.join(process.cwd(), path);
  const webpackConfig = require(configPath); // eslint-disable-line global-require
  return _configFromWebpack(webpackConfig);
};

/** Current project config */
const getConfig = uc => new Promise(accept => accept(_getConfig(uc))).catch(() => {
  // Looks like we need a config file...
  const act = vorpal.activeCommand;
  act.log(chalk.red('Oops! Looks like we failed to load any configuration.'));

  return makeConfig().catch( // eslint-disable-line no-use-before-define
    () => {
      throw new Error('We need a configuration file to continue! :(');
    }
  );
});

const makeConfig = () => {
  const act = vorpal.activeCommand;

  return act.prompt([
    {
      type: 'confirm',
      name: 'create',
      message: 'Would you like us to create a config file for you?',
    },
    {
      type: 'confirm',
      name: 'webpack',
      message: 'We detected you\'re using webpack. Would you like us to try and generate resolve config from there?',
      when: ({create}) => create && detectWebpack(),
    },
    {
      type: 'input',
      name: 'webpackConfig',
      message: 'What webpack config file should we use for your configuration? (relative to cwd)',
      default: './webpack.config.js',
      when: ({webpack}) => webpack,
      validate: path => jetpack.exists(path) === 'file' || 'Could not find that file.',
    },
    {
      type: 'input',
      name: 'files',
      message: 'What modules should we parse in your application? (glob pattern, relative to context)',
      default: '**/!(*.test|*.manifest).js*',
      when: ({create}) => create,
    },
  ]).then(result => {
    const {create, files, webpack, webpackConfig} = result;

    if (create) {
      const config = Object.assign({files}, webpack ? configFromWebpack(webpackConfig) : {});
      const file = _createConfig(config);
      act.log(chalk.green(`Configuration file created! ${file}`));
      act.log(chalk.dim(`Read more about .reconrc configuration here: ${CONFIG_HELP_URL}`));
      // anddd, try again...
      return getConfig();
    }

    return null;
  });
};

vorpal
  .command('init', 'Initialise recon for this project. Creates config etc.')
  .action(makeConfig);


// ----------------------------------------------------------------------------
// Engine Management
// ----------------------------------------------------------------------------


/** Get a (persisted) recon engine for current project */
const getEngine = memoize(() => getConfig().then(config => new Promise((accept) => {
  const act = vorpal.activeCommand;
  act.log('Starting Recon Engine...');
  const createdEngine = createEngine(config);
  let hasLoggedDiscovered = false;
  let bar;

  createdEngine.subscribe(stats => {
    if (!hasLoggedDiscovered && stats.hasDiscovered) {
      act.log(`Discovered ${stats.numModules} modules. Parsing...`);
      hasLoggedDiscovered = true;
      // TODO: right way to do progress bars in vorpal? https://github.com/dthree/vorpal/issues/176
      bar = new ProgressBar('parsing [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: stats.numModules,
        clear: true,
      });
    }
    if (bar) {
      bar.update(stats.numReadyModules ? stats.numReadyModules / stats.numModules : 0);
    }
    if (stats.canQuery) {
      act.log(`Parsed ${stats.numModules} modules.`);
      if (stats.numErroredModules) {
        act.log('');
        act.log(chalk.bold(`Saw ${stats.numErroredModules} errors while parsing:`));
        map(stats.moduleErrors, (m, i) => act.log(chalk.red(`${i + 1}. ${m.error.message} <${m.path}>`)));
        act.log('');
      }
      accept(createdEngine);
    }
  });
})));


// ----------------------------------------------------------------------------
// Statistics
// ----------------------------------------------------------------------------


/** Given recon stats, dump them to the user */
function logStats(stats, {numRows = 20} = {}) {
  const act = vorpal.activeCommand;
  const SEP = ' | ';
  act.log('');
  forEach(stats, stat => {
    act.log(chalk.bold(stat.title));
    act.log(chalk.italic.dim(stat.description));
    act.log('');
    const colWidths = stat.headers
      ? stat.headers.map((h, i) => max([h.length, ...map(stat.data, l => `${l[i]}`.length)]))
      : [];
    if (stat.headers) {
      act.log(join(map(stat.headers, (h, i) => chalk.bold(padEnd(h, colWidths[i]))), SEP));
    }
    if (isArray(stat.data)) {
      const displayRows = take(stat.data, parseInt(numRows, 10));
      forEach(
        displayRows,
        l => act.log(join(map(l, (v, i) => padEnd(`${v}`, colWidths[i])), SEP))
      );
      const numHiddenLines = stat.data.length - displayRows.length;
      if (numHiddenLines > 0) {
        act.log('');
        act.log(`& ${numHiddenLines} more rows ...`);
      }
    } else {
      act.log(stat.data);
    }
    act.log('');
    act.log('---');
    act.log('');
  });
}

/** Given a "ready to query" engine lets pull some stats */
function pullStats(engine) {
  vorpal.activeCommand.log('Querying and pulling stats...');
  return _pullStats(engine);
}

vorpal
  .command('stats', 'Prints statistics about your React application')
  .option('--numRows', 'Max number of rows to display within printed stats')
  .action(args => getEngine().then(pullStats).then(s => logStats(s, args.options)));


// ----------------------------------------------------------------------------
// Server
// ----------------------------------------------------------------------------


/** Current running server */
let runningServer = null;

/** Create a new server */
function spawnServer(engine, opts) {
  if (runningServer) {
    return runningServer;
  }
  const act = vorpal.activeCommand;
  act.log('Spawning server...');
  return createServer(engine, opts).then(server => {
    runningServer = server;
    const port = server.address().port;
    act.log('');
    act.log(dedent`
      Recon server listening on port ${port}!
      Visit ${chalk.bold(`http://localhost:${port}/graphql`)} to play with your data!
    `);
    act.log('');
    return server;
  });
}

/** Create a new server */
function killServer() {
  if (!runningServer) {
    return;
  }
  runningServer.close();
  vorpal.activeCommand.log('Server stopped');
  runningServer = null;
}

vorpal
  .command('server start', 'Spawn a server which accepts graphql queries')
  .alias('server')
  .option('-p --port', 'Port to run the server on')
  .action(args => getEngine().then(e => spawnServer(e, args.options)));

vorpal
  .command('server stop', 'Kill the current recon server')
  .alias('server kill')
  .action(() => killServer());


// ----------------------------------------------------------------------------
// Debug
// ----------------------------------------------------------------------------


/** Dump data from engine to disk */
function dumpDebug(engine) {
  vorpal.activeCommand.log('Dumping debug information...');
  jetpack.write('recon-dump.json', engine._debug({raw: false}), {jsonIndent: 0});
  vorpal.activeCommand.log('Dumped successfully to recon-dump.json');
}

vorpal
  .command('dump', 'Dump debug information')
  .action(() => getEngine().then(dumpDebug));


// final setup - either user wants interactive mode or is just running a command
const parsedArgs = vorpal.parse(process.argv, {use: 'minimist'});
if (!parsedArgs._) {
  // TODO: display working project? Ie. recon:my-app$
  vorpal.delimiter('recon$').show();
} else {
  vorpal.parse(parsedArgs._);
}
