// Remove unused imports and variables
// See remove-unused.md for documentation

import { removeNamedImport } from '@puns/shiftkit'

/**
 * Extract identifier from a qualified name (e.g., Screens.PAYMENT_DETAILS)
 */
function extractQualifiedName(node, used) {
  let current = node
  while (current.type === 'TSQualifiedName') {
    if (current.right?.type === 'Identifier') {
      used.add(current.right.name)
    }
    current = current.left
  }
  if (current?.type === 'Identifier') {
    used.add(current.name)
  }
}

/**
 * Recursively extract all type names from a TypeScript type node
 */
function extractTypeNames(typeNode, used) {
  if (!typeNode) {
    return
  }

  // TSTypeReference: the main type node
  if (typeNode.type === 'TSTypeReference' && typeNode.typeName) {
    if (typeNode.typeName.type === 'Identifier') {
      used.add(typeNode.typeName.name)
    } else if (typeNode.typeName.type === 'TSQualifiedName') {
      extractQualifiedName(typeNode.typeName, used)
    }

    // Recursively process type parameters (nested generics)
    if (typeNode.typeParameters?.params) {
      for (const param of typeNode.typeParameters.params) {
        extractTypeNames(param, used)
      }
    }
  }

  // Union/Intersection types: Type1 | Type2, Type1 & Type2
  if (
    (typeNode.type === 'TSUnionType' || typeNode.type === 'TSIntersectionType') &&
    typeNode.types
  ) {
    for (const t of typeNode.types) {
      extractTypeNames(t, used)
    }
  }

  // Array types: Type[]
  if (typeNode.type === 'TSArrayType' && typeNode.elementType) {
    extractTypeNames(typeNode.elementType, used)
  }

  // Tuple types: [Type1, Type2]
  if (typeNode.type === 'TSTupleType' && typeNode.elementTypes) {
    for (const t of typeNode.elementTypes) {
      extractTypeNames(t, used)
    }
  }

  // Indexed access types: Props['variant']
  if (typeNode.type === 'TSIndexedAccessType') {
    extractTypeNames(typeNode.objectType, used)
    extractTypeNames(typeNode.indexType, used)
  }

  // Type query: typeof Type
  if (typeNode.type === 'TSTypeQuery' && typeNode.exprName) {
    if (typeNode.exprName.type === 'Identifier') {
      used.add(typeNode.exprName.name)
    } else if (typeNode.exprName.type === 'TSQualifiedName') {
      extractQualifiedName(typeNode.exprName, used)
    }
  }

  // Type literals: { prop: Type }
  if (typeNode.type === 'TSTypeLiteral' && typeNode.members) {
    for (const member of typeNode.members) {
      if (member.type === 'TSPropertySignature' && member.typeAnnotation) {
        extractTypeNames(member.typeAnnotation.typeAnnotation, used)
      }
    }
  }
}

/**
 * Find all identifier references in the AST (excluding imports)
 * Includes both runtime and TypeScript type usage
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

    // Skip function parameters (only when they're the param itself, not when used in body)
    if (
      parent.type === 'FunctionDeclaration' ||
      parent.type === 'FunctionExpression' ||
      parent.type === 'ArrowFunctionExpression'
    ) {
      // Only skip if this is actually in the params array
      const parentPath = path.parent
      if (parentPath && parentPath.name === 'params') {
        return
      }
    }

    // Skip property keys in object literals (not usages) - UNLESS it's a shorthand property
    if (parent.type === 'Property' && path.name === 'key') {
      if (!parent.computed && !parent.shorthand) {
        return
      }
    }

    // Skip JSX attribute names (the attribute name itself, not the value)
    if (parent.type === 'JSXAttribute' && path.name === 'name') {
      return
    }

    // Skip object property keys in patterns (destructuring) on the left side
    if (
      parent.type === 'Property' &&
      path.name === 'key' &&
      path.parent.parent.node.type === 'ObjectPattern'
    ) {
      return
    }

    used.add(path.node.name)
  })

  // Find TypeScript type annotations on variables, parameters, etc.
  // These include type annotations like `: Type`, return types, etc.
  root.find(j.TSTypeAnnotation).forEach((path) => {
    if (path.node.typeAnnotation) {
      extractTypeNames(path.node.typeAnnotation, used)
    }
  })

  // Type alias declarations: type Foo = Bar
  root.find(j.TSTypeAliasDeclaration).forEach((path) => {
    if (path.node.typeAnnotation) {
      extractTypeNames(path.node.typeAnnotation, used)
    }
  })

  // TypeScript type parameters in generics: useForm<Type>(), new Array<Type>(), etc.
  // These are attached to CallExpression and NewExpression nodes
  const extractTypeParams = (path) => {
    const typeParams = path.node.typeParameters || path.node.typeArguments
    if (typeParams?.params) {
      for (const param of typeParams.params) {
        extractTypeNames(param, used)
      }
    }
  }

  root.find(j.CallExpression).forEach(extractTypeParams)
  root.find(j.NewExpression).forEach(extractTypeParams)

  return used
}

/**
 * Remove unused named imports
 * IMPORTANT: Must recalculate usedIdentifiers each time this is called
 */
function removeUnusedImports(root, j, options = {}) {
  // Recalculate on every call - important for multi-pass
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
 * NEVER removes exported declarations - only internal unused variables
 * IMPORTANT: Must recalculate usedIdentifiers each time this is called
 */
function removeUnusedVariables(root, j, options = {}) {
  // Recalculate on every call - important for multi-pass
  const usedIdentifiers = findUsedIdentifiers(root, j)
  const removedVariables = []

  root.find(j.VariableDeclaration).forEach((path) => {
    // NEVER touch exported declarations
    const parent = path.parent.node
    if (parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportDefaultDeclaration') {
      return
    }

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

  let totalChanged = false
  let passCount = 0
  const maxPasses = 10 // Safety limit to prevent infinite loops

  // Keep running passes until nothing changes (cascading removals)
  while (passCount < maxPasses) {
    passCount++
    let passChanged = false

    if (removeImports) {
      const removed = removeUnusedImports(root, j, { verbose: verbose && passCount === 1 })
      if (removed.length > 0) {
        passChanged = true
        totalChanged = true
      }
    }

    if (removeVariables) {
      const removed = removeUnusedVariables(root, j, { verbose: verbose && passCount === 1 })
      if (removed.length > 0) {
        passChanged = true
        totalChanged = true
      }
    }

    // If nothing changed this pass, we're done
    if (!passChanged) {
      break
    }
  }

  if (!totalChanged) {
    return fileInfo.source
  }

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
