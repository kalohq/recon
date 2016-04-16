/* eslint-env node, mocha */
import expect from 'expect';
import * as Babylon from 'babylon';
import traverse from 'babel-traverse';

import * as ReactUtils from '../react';

function parse(type, code) {
  let first;

  const ast = Babylon.parse(code, {
    plugins: [
      'jsx',
      'flow',
      'objectRestSpread'
    ]
  });

  traverse(ast, {
    [type]: function find(path) {
      first = path;
      path.stop();
    }
  });

  return first;
}

describe('utils/react', () => {

  describe('isReactComponent', () => {

    it('should give the correct answer', () => {
      const pathA = parse('ClassDeclaration', `class MyComponent {
        render() {}
      }`);
      expect(ReactUtils.isReactComponent(pathA)).toBe(true);

      const pathB = parse('FunctionDeclaration', `function MyComponent() {
        return <div>Test</div>;
      }`);
      expect(ReactUtils.isReactComponent(pathB)).toBe(true);

      const pathC = parse('VariableDeclarator', `const MyComponent = function() {
        return <div>Test</div>;
      }`);
      expect(ReactUtils.isReactComponent(pathC)).toBe(true);

      const pathD = parse('VariableDeclarator', `const MyComponent = () => <div>Test</div>;`);
      expect(ReactUtils.isReactComponent(pathD)).toBe(true);
    });

  });

});
