const Path = require('path');

const {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull
} = require('graphql');

// TODO: Roll in graphql-relay to make handling connections nicer

const {
  flatten,
  map,
  groupBy,
  values,
  find,
  findLast,
  last
} = require('lodash');

function defaultResolveModulePath(context, target) {
  const resolvedPath = Path.resolve(Path.dirname(context), target);
  return /\.[a-zA-Z0-9]$/.test(resolvedPath)
    ? resolvedPath
    : `${resolvedPath}.js`;
}

function createSchema(
  modules,
  {resolveModulePath = defaultResolveModulePath} = {}
) {

  // TODO: Heavy memoizing strategy will be required
  // TODO: Need to generate uuid's for components

  function makeDOMComponent(name) {
    return {
      id: `__REACT_DOM::${name}`,
      name,
      node: null,
      enhancements: [],
      props: [], // TODO: Probably a standard definition somewhere?
      deps: [],
      definedIn: null
    };
  }

  // RESOLUTION ---------------------------------------------------------------

  function allComponents() {
    return flatten(map(modules, m => m.data.components))
  }

  function getModule(path) {
    return find(modules, m => m.path === path);
  }

  function resolveSymbol(name, module) {
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
      const nextModule = getModule(resolveModulePath(module.path, localSymbol.type.source));

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
      const nextModule = getModule(resolveModulePath(module.path, localSymbol.type.source));

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

    return {
      name,
      module
    };
  }

  function getComponentFromResolvedSymbol(resolvedSymbol) {
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
  }

  function resolveComponentByName(name, module) {
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
  }

  function resolveComponent(component, module) {

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
  }

  function allResolvedComponents() {
    return flatten(modules.map(
      module => module.data.components.map(
        component => resolveComponent(component, module)
      )
    ));
  }

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
      name: {type: GraphQLString}
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
        resolve: (component) => {
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
        }
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
        resolve: (component) => {
          return modules.find(m => m.path === component.definedIn)
        }
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
            return modules;
          }
        }
      })
    })
  });

  return schemaType;
}

module.exports = createSchema;
