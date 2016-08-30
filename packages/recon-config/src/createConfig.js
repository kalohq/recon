const Jetpack = require('fs-jetpack');

/** File name to look for configuration */
const CONFIG_FILE_NAME = '.reconrc';

/**
 * Generate a full config for a working directory and any user config
 * - Will manage any sensible merging of configs as complexity grows
 */
function createConfig(uc, {cwd = process.cwd()} = {}) {
  // TODO: Search for definition within package.json
  const rc = Jetpack.cwd(cwd).read(CONFIG_FILE_NAME, 'json');
  if (!rc) {
    throw new Error('Oops! Doesn\'t look like there is a valid .reconrc file defined in your project root. See: https://github.com/lystable/recon/tree/master/packages/recon-config for info.'); // eslint-disable-line max-len
  }
  return Object.assign({}, rc, uc);
}

module.exports = createConfig;
