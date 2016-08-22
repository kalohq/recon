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
  values
} = require('lodash');

function defaultResolveModule(context, target) {
  const resolvedPath = Path.resolve(Path.dirname(context), target);
  return /\.[a-zA-Z0-9]$/.test(resolvedPath)
    ? resolvedPath
    : `${resolvedPath}.js`;
}

function createSchema(
  store,
  {resolveModule = defaultResolveModule} = {}
) {

  // TODO: Heavy meoizing strategy will be required
  // TODO: Need to generate uuid's for everything

  function allComponents() {
    return flatten(map(store, m => m.data.components))
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
      props: {type: propUsageType}
    })
  });

  const componentDependencyType = new GraphQLObjectType({
    name: 'ComponentDependencyType',
    fields: () => ({
      name: {type: GraphQLString},
      usages: {type: new GraphQLList(componentUsageType)}
    })
  });

  const componentType = new GraphQLObjectType({
    name: 'ComponentType',
    fields: () => ({
      name: {type: GraphQLString},
      dependencies: {
        type: new GraphQLList(componentDependencyType),
        resolve: (component) => {
          return map(
            values(groupBy(component.deps, 'name')),
            usages => ({
              name: usages[0].name,
              usages
            })
          );
        }
      },
      dependants: {
        type: new GraphQLList(componentDependencyType),
        resolve: (component) => {
          return [];
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
            return store;
          }
        }
      })
    })
  });

  return schemaType;
}

module.exports = createSchema;
