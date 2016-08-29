/* eslint-disable no-use-before-define */
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList
} = require('graphql');

// TODO: Roll in graphql-relay to make handling connections nicer

const {
  flatten,
  map,
  groupBy,
  values,
  find,
  last,
  memoize,
  join,
  filter,
} = require('lodash');

const makeDOMComponent = memoize((name) => {
  // TODO: We should *probably* have resolved these within parse when we see a dom reference?
  return {
    id: `__REACT_DOM::${name}`,
    name,
    node: null,
    enhancements: [],
    props: [], // TODO: Probably a standard definition somewhere of dom attributes?
    deps: [],
    definedIn: null
  };
});

function createSchema(
  dataSource,
  {resolveModulePaths}
) {

  // TODO: Need to invalidate memoizing as modules are re-parsed (ie. support persisted engine)

  // RESOLUTION ---------------------------------------------------------------

  /** Get data for query/resolution stage */
  const getModules = memoize(() => {
    return map(filter(values(dataSource), m => m.ready), m => m.parsed);
  });

  const allComponents = memoize(() => {
    return flatten(map(getModules(), m => m.data.components));
  });

  const getModule = memoize((paths) => {
    return find(getModules(), m => find(paths, path => path === m.path));
  }, p => join(p));

  const resolveSymbol = memoize((name, module) => {
    const localSymbol = module.data.symbols.find(s => s.name === name);

    if (!localSymbol) {
      return {
        name,
        module,
        notFound: true
      };
    }

    if (localSymbol.type.type === 'Identifier') {
      return resolveSymbol(localSymbol.type.__node.name, module);
    }

    if (localSymbol.type.type === 'ImportSpecifier') {
      const nextModule = getModule(resolveModulePaths(module.path, localSymbol.type.source));

      if (!nextModule) {
        return {
          name,
          module,
          notFound: true
        };
      }

      return resolveSymbol(
        `export::${localSymbol.type.sourceName}`,
        nextModule
      );
    }

    if (localSymbol.type.type === 'ImportDefaultSpecifier') {
      const nextModule = getModule(resolveModulePaths(module.path, localSymbol.type.source));

      if (!nextModule) {
        return {
          name,
          module,
          notFound: true
        };
      }

      return resolveSymbol(
        'export::default',
        nextModule
      );
    }

    if (localSymbol.type.type === 'ExportSpecifier') {
      const nextModule = getModule(resolveModulePaths(module.path, localSymbol.type.source));

      if (!nextModule) {
        return {
          name,
          module,
          notFound: true
        };
      }

      return resolveSymbol(
        `export::${localSymbol.type.sourceName}`,
        nextModule
      );
    }

    return {
      name,
      module
    };
  }, (n, m) => n + m.path);

  const getComponentFromResolvedSymbol = memoize((resolvedSymbol) => {
    const component = find(resolvedSymbol.module.data.components,
      c => c.name === resolvedSymbol.name
    );

    if (component) {
      return component;
    }

    const componentPath = find(
      resolvedSymbol.module.data.potentialComponentPaths,
      cp => cp.name === resolvedSymbol.name
    );

    // absolutely no paths :(
    if (!componentPath) {
      return null;
    }

    // Only taking the *last* potential component here. Really we should be
    // able to offer all of them as potential components
    const target = last(componentPath.targets);
    const resolvedComponent = resolveComponentByName(target.name, resolvedSymbol.module);

    // Does this break things by being path specific return value?
    // Maybe not since within this module the given symbol would always have the same enhancement path.
    return Object.assign({}, resolvedComponent, {
      pathEnhancements: componentPath.enhancements
    });
  }, s => s.name + s.module.path);

  const resolveComponentByName = memoize((name, module) => {
    // JSX Convention says if the identifier begins lowercase it is
    // a dom node rather than a custom component
    if (/^[a-z][a-z0-9]*/.test(name)) {
      return makeDOMComponent(name);
    }

    const symbol = resolveSymbol(name, module);

    if (symbol.notFound) {
      return null;
    }

    return getComponentFromResolvedSymbol(symbol) || null;
  }, (n, m) => n + m.path);

  const resolveComponent = memoize((component, module) => {

    // TODO: Need to track/resolve enhancement paths via usage

    const resolvedDeps = map(
      values(groupBy(component.deps, 'name')),
      usages => {
        const resolvedComponent = resolveComponentByName(usages[0].name, module);

        return {
          name: usages[0].name,
          component: resolvedComponent,
          usages: map(usages, u => Object.assign({}, u, {component: resolvedComponent}))
        };
      }
    );

    return Object.assign({}, component, {
      resolvedDeps
    });
  }, (c, m) => c.id + m.path);

  const allResolvedComponents = memoize(() => {
    return flatten(getModules().map(
      module => module.data.components.map(
        component => resolveComponent(component, module)
      )
    ));
  });

  const resolveComponentDependants = memoize((component) => {
    const all = allResolvedComponents();

    return flatten(all.filter(
      c => c.resolvedDeps.find(
        depC => depC.component && depC.component.id === component.id
      )
    ).map(
      c => c.resolvedDeps.filter(
        depC => depC.component && depC.component.id === component.id
      ).map(
        depC => Object.assign({}, depC, {component: c})
      )
    ));
  }, c => c.id);

  // SCHEMA -------------------------------------------------------------------

  const symbolType = new GraphQLObjectType({
    name: 'SymbolType',
    fields: () => ({
      name: {type: GraphQLString}
    })
  });

  const moduleDataType = new GraphQLObjectType({
    name: 'ModuleDataType',
    fields: () => ({
      symbols: {type: new GraphQLList(symbolType)},
      components: {type: new GraphQLList(componentType)}
    })
  });

  const moduleType = new GraphQLObjectType({
    name: 'ModuleType',
    fields: () => ({
      path: {type: GraphQLString},
      data: {type: moduleDataType}
    })
  });

  const propUsageType = new GraphQLObjectType({
    name: 'PropUsageType',
    fields: () => ({
      name: {type: GraphQLString},
      valueType: {
        type: GraphQLString,
        resolve: (prop) => prop.type.type
      }
    })
  });

  const componentUsageType = new GraphQLObjectType({
    name: 'ComponentUsageType',
    fields: () => ({
      name: {type: GraphQLString},
      component: {type: componentType},
      props: {type: new GraphQLList(propUsageType)}
    })
  });

  const componentDependencyType = new GraphQLObjectType({
    name: 'ComponentDependencyType',
    fields: () => ({
      name: {type: GraphQLString},
      component: {type: componentType},
      usages: {type: new GraphQLList(componentUsageType)}
    })
  });

  const componentEnhancementType = new GraphQLObjectType({
    // TODO: Enhancements need a lot of work in general. need to decide what useful information we can provide
    name: 'ComponentEnhancementType',
    fields: () => ({
      type: {type: GraphQLString},
      callee: {
        type: new GraphQLObjectType({
          name: 'EnhanceCallee',
          fields: () => ({
            type: {type: GraphQLString}
          })
        })
      },
    })
  });

  const componentType = new GraphQLObjectType({
    name: 'ComponentType',
    fields: () => ({
      id: {type: GraphQLString},
      name: {type: GraphQLString},
      dependencies: {
        type: new GraphQLList(componentDependencyType),
        resolve: (component) => {
          const all = allResolvedComponents();

          return find(all, c => c.id === component.id).resolvedDeps;
        }
      },
      dependants: {
        type: new GraphQLList(componentDependencyType),
        resolve: resolveComponentDependants
      },
      enhancements: {
        type: new GraphQLList(componentEnhancementType)
      },
      pathEnhancements: {
        description: 'Contextual enhancements',
        type: new GraphQLList(componentEnhancementType)
      },
      module: {
        type: moduleType,
        resolve: (component) => getModules().find(m => m.path === component.definedIn),
      }
    })
  });

  const schemaType = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'RootQueryType',
      fields: () => ({
        components: {
          type: new GraphQLList(componentType),
          resolve() {
            return allComponents();
          }
        },
        modules: {
          type: new GraphQLList(moduleType),
          resolve() {
            return getModules();
          }
        },
        numComponents: {
          type: GraphQLString,
          resolve() {
            return allComponents().length;
          }
        }
      })
    })
  });

  return schemaType;
}

module.exports = createSchema;
