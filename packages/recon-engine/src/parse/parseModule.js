const Babylon = require('babylon');
//import pullSymbols from './pullSymbols';
const T = require('babel-types');
const traverse = require('babel-traverse').default;
const isReactComponent = require('../utils/isReactComponent').default;

/* Provide the ast from module source */
function parseSource(moduleSource) {
  return Babylon.parse(moduleSource, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'flow',
      'objectRestSpread',
      // TODO: ALL plugins?
    ]
  });
}

/* Return a new mutable array */
function mutableArray(init) {
  return init ? new Array(...init) : new Array();
}

/* Return a new mutable object */
function mutableObject(init) {
  return init ? new Object(init) : new Object();
}

function resolveType(node, data = {}) {
  return Object.assign({type: node.type, __node: node}, data);
}

/* Pull TOP LEVEL symbols out of our ast */
function pullSymbols(ast) {
  const symbols = mutableArray();

  // TODO: Need to think hard about how we store each symbol "type" to allow easy resolution later

  function pushVariableDeclaration(node) {
    node.declarations.forEach(
      node => pushVariableDeclarator(node)
    );
  }

  function pushFunctionDeclaration(node) {
    symbols.push({
      name: node.id.name,
      type: resolveType(node)
    });
  }

  function pushClassDeclaration(node) {
    symbols.push({
      name: node.id.name,
      type: resolveType(node)
    });
  }

  function pushVariableDeclarator(node) {
    symbols.push({
      name: node.id.name,
      type: resolveType(node.init)
    });
  }

  function pushExportSpecifier(node, {source} = {}) {
    symbols.push({
      name: `export::${node.exported.name}`,
      type: resolveType(node, {source})
    });
  }

  function pushExportDeclaration(node) {
    // We'll collect two symbols for export declarations. One is
    // the declared value/type and the other will simply be a pointer
    // with name `export::symbolName`
    if (T.isFunctionDeclaration(node)) {
      pushFunctionDeclaration(node);
      symbols.push({
        name: `export::${node.id.name}`,
        type: resolveType(node.id)
      });
    } else if (T.isVariableDeclaration(node)) {
      pushVariableDeclaration(node);
      node.declarations.forEach(
        node => symbols.push({
          name: `export::${node.id.name}`,
          type: resolveType(node.id)
        })
      );
    } else if (T.isClassDeclaration(node)) {
      pushClassDeclaration(node);
      symbols.push({
        name: `export::${node.id.name}`,
        type: resolveType(node.id)
      });
    }
  }

  function pushExportNamedDeclaration(node) {
    if (node.declaration) {
      pushExportDeclaration(node.declaration);
    } else {
      const source = node.source ? node.source.value : undefined;
      node.specifiers.forEach(
        node => pushExportSpecifier(node, {source})
      );
    }
  }

  function pushExportDefaultDeclaration(node) {
    const decl = node.declaration;

    if (T.isFunctionDeclaration(decl)) {
      pushFunctionDeclaration(decl);
      symbols.push({
        name: `export::default`,
        type: resolveType(decl.id)
      });
    } else if (T.isVariableDeclaration(decl)) {
      pushVariableDeclaration(decl);
      decl.declarations.forEach(
        vDecl => symbols.push({
          name: `export::default`,
          type: resolveType(vDecl.id)
        })
      );
    } else if (T.isClassDeclaration(decl)) {
      pushClassDeclaration(decl);
      symbols.push({
        name: `export::default`,
        type: resolveType(decl.id)
      });
    } else {
      symbols.push({
        name: `export::default`,
        type: resolveType(decl)
      });
    }
  }

  function pushImportDeclaration(node) {
    const source = node.source.value;
    node.specifiers.forEach(
      spec => symbols.push({
        name: spec.local.name,
        type: resolveType(spec, {source}),
      })
    )
  }

  const visitor = {
    FunctionDeclaration(path) {
      if (T.isProgram(path.parent)) {
        pushFunctionDeclaration(path.node);
      }
      path.skip();
    },
    VariableDeclaration(path) {
      if (T.isProgram(path.parent)) {
        pushVariableDeclaration(path.node);
      }
      path.skip();
    },
    ClassDeclaration(path) {
      if (T.isProgram(path.parent)) {
        pushClassDeclaration(path.node);
      }
      path.skip();
    },
    ExportNamedDeclaration(path){
      pushExportNamedDeclaration(path.node);
      path.skip();
    },
    ExportDefaultDeclaration(path) {
      pushExportDefaultDeclaration(path.node);
      path.skip();
    },
    ImportDeclaration(path) {
      pushImportDeclaration(path.node);
      path.skip();
    },
  };

  traverse(ast, visitor);
  return [...symbols];
}

/* Pull dep & usage info out of a render method/func ast */
function pullDeps(ast) {
  const deps = mutableArray();

  // TODO: Search React.createElement
  // TODO: Allow other syntaxes such as hyperscript? part of plugin/config customisation

  const visitor = {
    JSXElement(path) {
      const name = path.node.openingElement.name.name;

      deps.push({
        name: name,
        selfClosing: path.node.openingElement.selfClosing,
        props: path.node.openingElement.attributes.map(
          attr => T.isJSXSpreadAttribute(attr)
            ? ({
                name: '__spread',
                type: resolveType(attr.argument)
              })
            : ({
                name: attr.name.name,
                // TODO: see if we can find  union of possible values. Eg. color = someVar ? 'green' : 'red'
                // TODO: for simple identifier types we could sometimes resolve to component prop types
                type: T.isJSXExpressionContainer(attr.value)
                  ? resolveType(attr.value.expression)
                  : resolveType(attr.value)
              })
        )
      })
    },

    noScope: true
  };

  traverse(ast, visitor);
  return [...deps];
}

/* Search declarations and references to see if prop types are defined (FLOW?) */
function findProps(path) {
  const props = mutableArray();

  // TODO: Pull static def from classes ie. static propTypes = {}
  // TODO: Look for mutations ie. MyComponent.propTypes = {};
  // TODO: Look at *actually referenced* props in render/class methods
  // TODO: Look for rest/spread props (and what component they're inherited from)

  return [...props];
}

/* Should we pull this component path?
 * Currently: is it considered "top level"? Ie. not in closures/constructors etc.
 */
function shouldPullComponent(path) {
  let tPath = path;
  while (tPath = tPath.parentPath) {
    if (T.isProgram(tPath)) {
      return true;
    }

    if (
      !T.isExportDefaultDeclaration(tPath)
      && !T.isExportNamedDeclaration(tPath)
      && !T.isVariableDeclaration(tPath)
    ) {
      break;
    }
  }

  return false;
}

/* Pull component information out of our ast */
function pullComponents(ast) {
  const components = mutableArray();

  function visitReactComponent(path) {
    if (isReactComponent(path)) {

      if (
        T.isArrowFunctionExpression(path)
        || T.isFunctionExpression(path)
      ) {
        // for expressions we need to find the parent variable
        // declarator in order to name it. As we traverse we can
        // also gather "enhancements"
        // TODO: Gather enhancements off of decorators
        let tPath = path;
        let name = null;
        const enhancements = mutableArray();
        while (tPath = tPath.parentPath) {
          // yay! we found the variable
          if (T.isVariableDeclarator(tPath)) {
            if (!shouldPullComponent(tPath)) {
              return;
            }
            name = tPath.node.id.name;
            break;
          }

          // gather "enhancements"
          if (T.isCallExpression(tPath)) {
            enhancements.push(tPath.node);
          }
        }

        components.push({
          name: name,
          node: path.node,
          enhancements: [...enhancements],
          props: findProps(path),
          deps: pullDeps(path.node),
        });
      }

      if (T.isFunctionDeclaration(path) && shouldPullComponent(path)) {
        components.push({
          name: path.node.id.name,
          node: path.node,
          enhancements: [],
          props: findProps(path),
          deps: pullDeps(path.node),
        });
      }

      if (T.isClassDeclaration(path) && shouldPullComponent(path)) {
        const renderMethod = path.node.body.body.find(node => T.isClassMethod(node) && node.key.name === 'render');
        components.push({
          name: path.node.id.name,
          node: path.node,
          enhancements: [],
          props: findProps(path),
          deps: pullDeps(renderMethod),
        });
      }

      // TODO: Pull more meta data... eg. attached docblocs etc

    }

    path.skip();
  }

  const visitor = {
    ArrowFunctionExpression: visitReactComponent,
    FunctionDeclaration: visitReactComponent,
    FunctionExpression: visitReactComponent,
    ClassDeclaration: visitReactComponent,
  };

  traverse(ast, visitor);
  return [...components];
}

/* Pull info from an ast */
function pullData(ast) {
  return {
    symbols: pullSymbols(ast),
    components: pullComponents(ast),
  };
}

/* Given a source module extract and provide a parsed module */
function parseModule({path, src}) {
  const ast = parseSource(src);
  const data = pullData(ast);

  return {
    path,
    data
  };
}

module.exports = parseModule;
