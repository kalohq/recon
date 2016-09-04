const Jetpack = require('fs-jetpack');
const Path = require('path');
const {CONFIG_FILE_NAME} = require('./shared');

/**
 * Create a new config file with user defined configuration
 */
function createConfig(userConfig, {cwd = process.cwd()} = {}) {
  // TODO: Search for definition within package.json
  const rc = Jetpack.cwd(cwd).exists(CONFIG_FILE_NAME);
  if (rc) {
    throw new Error('Oops! Looks like you already have a .reconrc file!');
  }
  Jetpack.cwd(cwd).write(CONFIG_FILE_NAME, userConfig);
  return Path.join(cwd, CONFIG_FILE_NAME);
}

module.exports = createConfig;
