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

const {
  flatten,
  map,
  groupBy,
  values,
  find
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

  function getDOMComponent(name) {
    return {
      id: `__REACT_DOM::${name}`,
      name,
      node: null,
      enhancements: [],
      props: [],
      deps: [],
      definedIn: null
    };
  }

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
      return resolveSymbol(
        `export::${localSymbol.type.sourceName}`,
        getModule(resolveModulePath(module.path, localSymbol.type.source))
      );
    }

    if (localSymbol.type.type === 'ImportDefaultSpecifier') {
      return resolveSymbol(
        'export::default',
        getModule(resolveModulePath(module.path, localSymbol.type.source))
      );
    }

    return {
      name,
      module
    };
  }

  function getComponentFromResolvedSymbol(resolvedSymbol) {
    return find(resolvedSymbol.module.data.components,
      c => c.name === resolvedSymbol.name
    );
  }

  function resolveComponentByName(name, module) {
    // JSX Convention says if the identifier begins lowercase it is
    // a dom node rather than a custom component
    if (/^[a-z][a-z0-9]*/.test(name)) {
      return getDOMComponent(name);
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

          // TODO: Fix

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
