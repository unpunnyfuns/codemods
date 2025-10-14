// Remove unused imports and variables
// See remove-unused.md for documentation

import { removeNamedImport } from '@puns/shiftkit'

/**
 * Find all identifier references in the AST (excluding imports)
 */
function findUsedIdentifiers(root, j) {
  const used = new Set()

  // Find all identifier usages (excluding declarations)
  root.find(j.Identifier).forEach((path) => {
    const parent = path.parent.node

    // Skip import declarations - we're looking for usages
    if (parent.type === 'ImportSpecifier' || parent.type === 'ImportDefaultSpecifier') {
      return
    }

    // Skip variable declarators on the left side (these are declarations, not usages)
    if (parent.type === 'VariableDeclarator' && path.name === 'id') {
      return
    }

    // Skip function parameters
    if (
      parent.type === 'FunctionDeclaration' ||
      parent.type === 'FunctionExpression' ||
      parent.type === 'ArrowFunctionExpression'
    ) {
      if (path.name === 'params') {
        return
      }
    }

    // Skip property keys in object literals (not usages)
    if (parent.type === 'Property' && path.name === 'key' && !parent.computed) {
      return
    }

    // Skip JSX attribute names
    if (parent.type === 'JSXAttribute' && path.name === 'name') {
      return
    }

    used.add(path.node.name)
  })

  return used
}

/**
 * Remove unused named imports
 */
function removeUnusedImports(root, j, options = {}) {
  const usedIdentifiers = findUsedIdentifiers(root, j)
  const removedImports = []

  root.find(j.ImportDeclaration).forEach((path) => {
    const specifiers = path.node.specifiers || []
    const unusedSpecifiers = []

    specifiers.forEach((spec) => {
      if (spec.type === 'ImportSpecifier') {
        const localName = spec.local.name

        // Check if this import is actually used
        if (!usedIdentifiers.has(localName)) {
          unusedSpecifiers.push(spec.imported.name)
        }
      }
    })

    // Remove unused specifiers
    if (unusedSpecifiers.length > 0) {
      const importPath = path.node.source.value
      const collection = j(path)

      unusedSpecifiers.forEach((name) => {
        removeNamedImport(collection, name, j)
        removedImports.push({ name, from: importPath })
      })
    }
  })

  if (removedImports.length > 0 && options.verbose) {
    console.log(`✓ Removed ${removedImports.length} unused imports`)
    removedImports.forEach(({ name, from }) => {
      console.log(`  - ${name} from ${from}`)
    })
  }

  return removedImports
}

/**
 * Remove unused variables (const, let, var declarations)
 */
function removeUnusedVariables(root, j, options = {}) {
  const usedIdentifiers = findUsedIdentifiers(root, j)
  const removedVariables = []

  root.find(j.VariableDeclaration).forEach((path) => {
    const declarations = path.node.declarations || []
    const unusedDeclarations = []

    declarations.forEach((decl, index) => {
      if (decl.id.type === 'Identifier') {
        const varName = decl.id.name

        // Check if this variable is actually used
        if (!usedIdentifiers.has(varName)) {
          unusedDeclarations.push({ name: varName, index })
        }
      }
    })

    // Remove unused declarations
    if (unusedDeclarations.length > 0) {
      // If all declarations are unused, remove the entire statement
      if (unusedDeclarations.length === declarations.length) {
        j(path).remove()
        removedVariables.push(...unusedDeclarations.map((d) => d.name))
      } else {
        // Remove only unused declarations
        path.node.declarations = declarations.filter(
          (_, i) => !unusedDeclarations.some((u) => u.index === i),
        )
        removedVariables.push(...unusedDeclarations.map((d) => d.name))
      }
    }
  })

  if (removedVariables.length > 0 && options.verbose) {
    console.log(`✓ Removed ${removedVariables.length} unused variables`)
    removedVariables.forEach((name) => {
      console.log(`  - ${name}`)
    })
  }

  return removedVariables
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const removeImports = options.imports !== false // default: true
  const removeVariables = options.variables !== false // default: true
  const verbose = options.verbose || false

  let changed = false

  if (removeImports) {
    const removed = removeUnusedImports(root, j, { verbose })
    if (removed.length > 0) {
      changed = true
    }
  }

  if (removeVariables) {
    const removed = removeUnusedVariables(root, j, { verbose })
    if (removed.length > 0) {
      changed = true
    }
  }

  if (!changed) {
    return fileInfo.source
  }

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
