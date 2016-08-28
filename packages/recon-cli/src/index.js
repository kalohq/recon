const vorpal = require('vorpal')();
const {forEach, padEnd, isArray, map, join, take, max} = require('lodash');
const chalk = vorpal.chalk;

const {createEngine} = require('recon-engine');
const {pullStats} = require('recon-stats');

/** Spawn an engine and return a promise which resolves when it's ready to be queried */
function spawnEngine(opts) {
  return new Promise((accept) => {
    const engine = createEngine(opts);
    engine.subscribe(stats => {
      if (stats.canQuery) {
        accept(engine);
      }
    });
  });
}


/** Given recon stats, dump them to the user */
function dumpStats(stats) {
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
      const displayLines = take(stat.data, 20);
      forEach(
        displayLines,
        l => act.log(join(map(l, (v, i) => padEnd(`${v}`, colWidths[i])), SEP))
      );
      const numHiddenLines = stat.data.length - displayLines.length;
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

vorpal
  .command('stats <files>')
  .description('Prints a bunch of stats about your application')
  .action(args => spawnEngine({files: args.files}).then(pullStats).then(dumpStats));


// final setup
vorpal
  .delimiter('recon$')
  .parse(process.argv)
  .show();
