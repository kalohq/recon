const T = require('babel-types');
const {find} = require('lodash');
const traverse = require('babel-traverse').default;

/** Does a given function path contain JSX? */
function containsJSX(node) {
  if (T.isJSXElement(node)) {
    return true;
  }

  let doesContainJSX = false;
  const visitor = {
    ReturnStatement(jsxPath) {
      if (T.isJSXElement(jsxPath.node.argument)) {
        doesContainJSX = true;
        jsxPath.stop();
      }
    },

    noScope: true,
  };

  traverse(node, visitor);
  return doesContainJSX;
}

/** Is given path a react component declaration? */
function isReactComponent(node) {

  // TODO: Is there a stronger way of determining a "react component"?
  // TODO: Accept React.createClass() (unless there is plans to deprecate in *near* future?)

  if (T.isClassDeclaration(node)) {
    return !!find(node.body.body, bNode => T.isClassMethod(bNode) && bNode.key.name === 'render');
  }

  if (T.isFunctionDeclaration(node)) {
    return containsJSX(node.body);
  }

  if (T.isFunctionExpression(node)) {
    return containsJSX(node.body);
  }

  if (T.isArrowFunctionExpression(node)) {
    return containsJSX(node.body);
  }

  return false;
}

module.exports = isReactComponent;
