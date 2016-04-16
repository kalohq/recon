/* @flow */
import * as T from 'babel-types';
import traverse from 'babel-traverse';

import type {NodePath} from 'babel-traverse';
import type Binding from 'babel-traverse/lib/scope/binding';

// TODO: Will need to think hard about how to improve the apis seen here (ie. for pluggability)

/**
 * Given a module ast get reference to a specific export path
 * NOTE: name === "default" is treated specially
 */
function getExportPath(name, moduleAst) {
  let identifierPath;

  // Find `export default definition;`
  const defaultVisitor = {
    ExportDefaultDeclaration(path) {
      path.traverse({
        Identifier(identifierNodePath) {
          identifierPath = identifierNodePath;
        }
      });
    }
  };

  if (name === 'default') {
    traverse(moduleAst, defaultVisitor);
  }

  // Find appropriate specifier in `export {foo as bar};`
  const specifierVisitor = {
    ExportSpecifier(path) {
      if (path.node.exported.name === name) {
        identifierPath = path;
      }
    }
  };

  // pull identifier out of `export const definition = 'foo';`
  const identifierVisitor = {
    Identifier(identifierNodePath) {
      if (!identifierPath && identifierNodePath.node.name === name) {
        identifierPath = identifierNodePath;
      }
    }
  };

  const namedVisitor = {
    ExportNamedDeclaration(path) {
      if (!identifierPath) {
        if (path.node.specifiers.length) {
          path.traverse(specifierVisitor);
        } else {
          path.traverse(identifierVisitor);
        }
      }
    }
  };

  traverse(moduleAst, namedVisitor);

  return identifierPath;
}

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
 * Given a path resolve it's definition which may be found in other modules.
 * Ie. This is not resolving the binding within the bounds of a module but will
 * also resolve imports to find the very root definition.
 *
 * Note: path should be an Identifier path OR ExportSpecifier path within
 *       the scope of the specified module
 */
export function resolveDefinition(path: NodePath, module: Module, resolveModule?: Function): Resolution {
  // export {definition as definition} from 'other-module';
  if (T.isExportSpecifier(path.node) && path.parent.source) {
    if (!resolveModule) {
      return {failed: true, module, path};
    }

    const importModulePath = path.parent.source.value;
    const importedModule = resolveModule(module, importModulePath);
    const identifier = getExportPath(path.node.local.name, importedModule.ast);

    return resolveDefinition(identifier, importedModule.path, resolveModule);
  }

  const binding = T.isExportSpecifier(path.node)
    ? path.scope.getBinding(path.node.local.name)
    : path.scope.getBinding(path.node.name);

  if (!binding) {
    return {failed: true, module, path};
  }

  // const definition = 'foo';
  // function definition() {};
  // class Definition {}
  if (
    T.isVariableDeclarator(binding.path.node)
    || T.isFunctionDeclaration(binding.path.node)
    || T.isClassDeclaration(binding.path.node)
  ) {
    return {binding, module, path};
  }

  // import {definition} from './other-module';
  if (T.isImportSpecifier(binding.path.node)) {
    if (!resolveModule) {
      return {failed: true, module, path};
    }

    const importModulePath = binding.path.parent.source.value;
    const importedModule = resolveModule(module, importModulePath);
    const identifier = getExportPath(binding.path.node.imported.name, importedModule.ast);

    return resolveDefinition(identifier, importedModule.path, resolveModule);
  }

  // import definition from './other-module';
  if (T.isImportDefaultSpecifier(binding.path.node)) {
    if (!resolveModule) {
      return {failed: true, module, path};
    }

    const importModulePath = binding.path.parent.source.value;
    const importedModule = resolveModule(module, importModulePath);
    const identifier = getExportPath('default', importedModule.ast);

    return resolveDefinition(identifier, importedModule.path, resolveModule);
  }

  // ¯\_(ツ)_/¯
  return {
    failed: true,
    module,
    path
  };

}
