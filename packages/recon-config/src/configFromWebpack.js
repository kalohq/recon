const Path = require('path');

/** Given webpack configuration object return recon config */
function configFromWebpack(webpackConfig, {cwd = process.cwd()} = {}) {
  const config = {};

  if (webpackConfig.context) {
    config.context = Path.relative(cwd, webpackConfig.context);
  }

  if (webpackConfig.resolve) {
    const resolve = {};

    if (webpackConfig.resolve.extensions) {
      resolve.extensions = webpackConfig.resolve.extensions.filter(x => !!x);
    }

    const roots = webpackConfig.resolve.root || webpackConfig.resolve.roots; // support v1 & v2
    if (roots) {
      resolve.roots = roots.map(p => Path.relative(webpackConfig.context || cwd, p));
    }

    config.resolve = resolve;
  }

  return config;
}

module.exports = configFromWebpack;
