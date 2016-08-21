const T = require('babel-types');
const {find} = require('lodash');

/** Does a given function path contain JSX? */
function containsJSX(path) {
  if (T.isJSXElement(path)) {
    return true;
  }

  let doesContainJSX = false;

  path.traverse({
    JSXElement(jsxPath) {
      doesContainJSX = true;
      jsxPath.stop();
    }
  });

  return doesContainJSX;
}

/** Is given path a react component declaration? */
function isReactComponent(path) {
  if (T.isClassDeclaration(path)) {
    return !!find(path.node.body.body, node => T.isClassMethod(node) && node.key.name === 'render');
  }

  if (T.isFunctionDeclaration(path)) {
    return containsJSX(path.get('body'));
  }

  if (T.isFunctionExpression(path)) {
    return containsJSX(path.get('body'));
  }

  if (T.isArrowFunctionExpression(path)) {
    return containsJSX(path.get('body'));
  }

  return false;
}

exports.default = isReactComponent;
