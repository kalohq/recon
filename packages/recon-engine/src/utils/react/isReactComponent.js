/* @flow */
import * as T from 'babel-types';
import {find} from 'lodash';

import type {NodePath} from 'babel-traverse';

/** Does a given function contain JSX? */
function containsJSX(path: NodePath): boolean {
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
export default function isReactComponent(path: NodePath): boolean {
  if (T.isClassDeclaration(path)) {
    return !!find(path.node.body.body, node => T.isClassMethod(node) && node.key.name === 'render');
  }

  if (T.isFunctionDeclaration(path)) {
    return containsJSX(path.get('body'));
  }

  if (T.isVariableDeclarator(path) && T.isFunctionExpression(path.node.init)) {
    return containsJSX(path.get('init').get('body'));
  }

  if (T.isVariableDeclarator(path) && T.isArrowFunctionExpression(path.node.init)) {
    return containsJSX(path.get('init').get('body'));
  }

  return false;
}
