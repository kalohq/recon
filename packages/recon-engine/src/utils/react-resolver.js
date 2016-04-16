/* @flow */
import * as ReactUtils from './react';
import * as Resolver from './resolver';
import * as T from 'babel-types';

import type {NodePath} from 'babel-traverse';
import type Binding from 'babel-traverse/lib/scope/binding';

type Module = {
  path: string,
  ast: Object
};

type Resolution = {
  failed?: boolean,
  module: Module,
  path: NodePath,
  binding?: Binding
};

/**
 * Like resolveDefinition but will attempt to resolve components through facades.
 *
 * Eg. The following module would resolve to MyComponent VariableDeclaration
 *   const MyComponent = () => null;
 *   const MyStatefulComponent = withState(MyComponent);
 *   export default MyStatefulComponent;
 *
 * Note: We will only resolve these within the SAME module for now otherwise it
 *       would become ridiculously expensive to trawl all possible Identifiers
 *       through all of their file declarations. This obviously won't fulfil
 *       every need but does ours for now.
 *
 */
export function resolveRootComponentDefinition(path: NodePath, module: Module, resolveFile?: Function): Resolution {
  const definition = Resolver.resolveDefinition(path, module, resolveFile);
  const {binding} = definition;

  if (!binding) {
    return definition;
  }

  if (ReactUtils.isReactComponent(binding.path)) {
    return definition;
  }

  // Resolve through a facade
  if (T.isCallExpression(binding.path.node.init)) {
    let foundDefinition;

    // Search through identifier definitions till we find a react component
    const referenceVisitor = {
      Identifier(identifierPath) {
        const nextDefinition = Resolver.resolveDefinition(identifierPath, module);
        if (nextDefinition.binding && ReactUtils.isReactComponent(nextDefinition.binding.path)) {
          foundDefinition = nextDefinition;
          identifierPath.stop();
        }
      }
    };

    binding.path.traverse(referenceVisitor);

    if (foundDefinition) {
      return foundDefinition;
    }
  }

  // ¯\_(ツ)_/¯
  return {failed: true, path, module};
}
