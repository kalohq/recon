const Jetpack = require('fs-jetpack');
const makeStats = require('./makeStats');

/** Given a recon-engine instance pull stats */
function pullStats(engine) {
  const query = Jetpack.cwd(__dirname).read('query.graphql', 'utf8');
  return engine.runQuery(query).then(makeStats);
}

module.exports = pullStats;
