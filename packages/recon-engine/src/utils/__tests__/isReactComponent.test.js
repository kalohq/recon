/* eslint-env node, mocha */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
const expect = require('expect');
const Babylon = require('babylon');
const traverse = require('babel-traverse').default;

const isReactComponent = require('../isReactComponent');

function parse(type, code) {
  let found;

  const ast = Babylon.parse(code, {
    plugins: [
      'jsx',
      'flow',
      'objectRestSpread',
    ],
  });

  traverse(ast, {
    [type]: function find(path) {
      found = path.node;
      path.stop();
    },
  });

  return found;
}

describe('utils/react/isReactComponent', () => {

  it('should identify class components', () => {
    const node = parse('ClassDeclaration', `class MyComponent {
      render() {}
    }`);
    expect(isReactComponent(node)).toBe(true);
  });

  it('should identify function declarations', () => {
    const node = parse('FunctionDeclaration', `function MyComponent() {
      return <div>Test</div>;
    }`);
    expect(isReactComponent(node)).toBe(true);
  });

  it('should identify function expressions', () => {
    const node = parse('FunctionExpression', `const MyComponent = function() {
      return <div>Test</div>;
    }`);
    expect(isReactComponent(node)).toBe(true);
  });

  it('should identify arrow function expressions', () => {
    const node = parse('ArrowFunctionExpression', `const MyComponent = () => <div>Test</div>;`);
    expect(isReactComponent(node)).toBe(true);
  });

  it('should NOT identify arrow function expressions without JSX', () => {
    const node = parse('ArrowFunctionExpression', `const MyComponent = () => true;`);
    expect(isReactComponent(node)).toBe(false);
  });

  it('should NOT identify function declarations without JSX', () => {
    const node = parse('FunctionDeclaration', `function MyComponent() {
      return null;
    }`);
    expect(isReactComponent(node)).toBe(false);
  });

});
