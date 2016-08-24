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
      'asyncFunctions',
      'classConstructorCall',
      'doExpessions',
      'trailingFunctionCommas',
      'decorators',
      'classProperties',
      'exportExtentions',
      'exponentiationOperator',
      'asyncGenerators',
      'functionBind',
      'functionSent'
      // keep up-to-date
    ]
  });
}

/* Return a new mutable array */
function mutableArray(init) {
  return init ? new Array(...init) : new Array();
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
      declNode => pushVariableDeclarator(declNode)
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

  function pushExportSpecifier(node, {source, sourceName} = {}) {
    symbols.push({
      name: `export::${node.exported.name}`,
      type: resolveType(node, {source, sourceName})
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
        declNode => symbols.push({
          name: `export::${declNode.id.name}`,
          type: resolveType(declNode.id)
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
        spec => pushExportSpecifier(spec, {source, sourceName: spec.local.name})
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
        name: T.isIdentifier(spec.exported) ? spec.exported.value : spec.local.name,
        type: resolveType(spec, {source, sourceName: spec.local.name}),
      })
    );
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
    ExportNamedDeclaration(path) {
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
        name,
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
      });
    },

    noScope: true
  };

  traverse(ast, visitor);
  return [...deps];
}

/* Search declarations and references to see if prop types are defined (FLOW?) */
function findProps(/* path */) {
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
  let tPath = path.parentPath;
  while (tPath) {
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

    tPath = tPath.parentPath;
  }

  return false;
}

/* Pull component information out of our ast */
function pullComponents(ast, {globalId, definedIn}) {
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
        let tPath = path.parentPath;
        let name = null;
        const enhancements = mutableArray();
        while (tPath) {
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

          tPath = tPath.parentPath;
        }

        components.push({
          id: globalId(name),
          name,
          node: path.node,
          enhancements: [...enhancements],
          props: findProps(path),
          deps: pullDeps(path.node),
          definedIn
        });
      }

      if (T.isFunctionDeclaration(path) && shouldPullComponent(path)) {
        components.push({
          id: globalId(path.node.id.name),
          name: path.node.id.name,
          node: path.node,
          enhancements: [],
          props: findProps(path),
          deps: pullDeps(path.node),
          definedIn
        });
      }

      if (T.isClassDeclaration(path) && shouldPullComponent(path)) {
        const renderMethod = path.node.body.body.find(node => T.isClassMethod(node) && node.key.name === 'render');
        components.push({
          id: globalId(path.node.id.name),
          name: path.node.id.name,
          node: path.node,
          enhancements: [],
          props: findProps(path),
          deps: pullDeps(renderMethod),
          definedIn
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

function getIdentifiers(ast) {
  const identifiers = mutableArray();

  const visitor = {
    Identifier(path) {
      identifiers.push(path.node);
    },

    noScope: true
  };

  traverse(ast, visitor);
  return [...identifiers];
}

function getCallExpressions(ast) {
  const callExpressions = mutableArray();

  const visitor = {
    CallExpression(path) {
      callExpressions.push(path.node);
    },

    noScope: true
  };

  traverse(ast, visitor);
  return [...callExpressions];
}

function getPotentialComponentPaths(symbols, components) {
  return symbols.map(
    sym => {
      return T.isCallExpression(sym.type.__node)
        ? {
          name: sym.name,
          enhancements: [sym.type.__node, ...getCallExpressions(sym.type.__node)],
          targets: getIdentifiers(sym.type.__node).filter(
            i => components.find(c => c.name === i.name)
          ).map(
            i => ({name: i.name, type: resolveType(i)})
          )
        }
        : {targets: []};
    }
  ).filter(a => !!a.targets.length);
}

/* Pull info from an ast */
function pullData(ast, opts) {
  const symbols = pullSymbols(ast, opts);
  const components = pullComponents(ast, opts);
  const potentialComponentPaths = getPotentialComponentPaths(symbols, components);

  return {
    symbols,
    components,
    potentialComponentPaths
  };
}

/* Given a source module extract and provide a parsed module */
function parseModule({path, src}) {
  function globalId(symbolName) {
    return `${path}::${symbolName}`;
  }

  try {
    const ast = parseSource(src);
    const data = pullData(ast, {globalId, definedIn: path});

    return {
      path,
      data
    };
  } catch (err) {
    return {
      err,
      path,
      data: {
        symbols: [],
        components: [],
        potentialComponentPaths: [],
      }
    };
  }
}

module.exports = parseModule;
