const Path = require('path');
const Jetpack = require('fs-jetpack');

/** File name to look for configuration */
const CONFIG_FILE_NAME = '.reconrc';

/**
 * Generate a full config for a working directory and any user config
 * - Will manage any sensible merging of configs as complexity grows
 */
function createConfig(cwd, uc) {
  // TODO: Search for definition within package.json
  const rcPath = Path.join(cwd, CONFIG_FILE_NAME);
  const rc = Jetpack.read(rcPath, 'json');
  return Object.assign({}, rc, uc);
}

module.exports = createConfig;
