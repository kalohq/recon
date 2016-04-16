/* eslint-env node, mocha */
import expect from 'expect';
import * as Babylon from 'babylon';
import traverse from 'babel-traverse';

import isReactComponent from '../isReactComponent';

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

describe('utils/react/isReactComponent', () => {

  it('should give the correct answer', () => {
    const pathA = parse('ClassDeclaration', `class MyComponent {
      render() {}
    }`);
    expect(isReactComponent(pathA)).toBe(true);

    const pathB = parse('FunctionDeclaration', `function MyComponent() {
      return <div>Test</div>;
    }`);
    expect(isReactComponent(pathB)).toBe(true);

    const pathC = parse('VariableDeclarator', `const MyComponent = function() {
      return <div>Test</div>;
    }`);
    expect(isReactComponent(pathC)).toBe(true);

    const pathD = parse('VariableDeclarator', `const MyComponent = () => <div>Test</div>;`);
    expect(isReactComponent(pathD)).toBe(true);
  });

});
