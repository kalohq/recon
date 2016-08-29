#! /usr/bin/env node
const vorpal = require('vorpal')();
const {forEach, padEnd, isArray, map, join, take, max, memoize} = require('lodash');
const ProgressBar = require('progress');
const dedent = require('dedent');

const {createConfig} = require('recon-config');
const {createEngine} = require('recon-engine');
const {pullStats: _pullStats} = require('recon-stats');
const {createServer} = require('recon-server');
const chalk = vorpal.chalk;

/** Current project config */
const config = createConfig();

/** Get a (persisted) recon engine for current project */
const getEngine = memoize(() => new Promise((accept) => {
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
        clear: true
      });
    }
    if (bar) {
      bar.update(stats.numReadyModules ? stats.numReadyModules / stats.numModules : 0);
    }
    if (stats.canQuery) {
      act.log(`Parsed ${stats.numModules} modules. Saw ${stats.numErroredModules} errors!`);
      accept(createdEngine);
    }
  });
}));


// ----------------------------------------------------------------------------
// Statistics
// ----------------------------------------------------------------------------


/** Given recon stats, dump them to the user */
function dumpStats(stats, {numRows = 20} = {}) {
  const act = vorpal.activeCommand;
  const SEP = ' | ';
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
  .action(args => getEngine().then(pullStats).then(s => dumpStats(s, args.options)));


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


// final setup - either user wants interactive mode or is just running a command
const parsedArgs = vorpal.parse(process.argv, {use: 'minimist'});
if (!parsedArgs._) {
  vorpal.delimiter('recon$').show();
} else {
  vorpal.parse(parsedArgs._);
}
