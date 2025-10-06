/**
 * Remove unused imports and variables with multi-pass cascading removal
 *
 * Uses multi-pass strategy to handle cascading removals where removing one identifier
 * makes another unused. Supports TypeScript type usage detection. Never removes exports.
 *
 * --imports    Remove unused imports (default: true). --imports=false to skip.
 * --variables  Remove unused variables (default: true). --variables=false to skip.
 * --verbose    Log removed identifiers. --verbose shows what was removed.
 */

import { removeNamedImport } from './lib/imports.js'

/**
 * Extract identifier from a qualified name (e.g., Screens.PAYMENT_DETAILS)
 *
 * TypeScript qualified names are namespace-style type references: Namespace.Type.SubType
 * This function recursively extracts all identifier names from the qualified chain.
 *
 * Examples:
 * - Screens.PAYMENT_DETAILS extracts: Screens, PAYMENT_DETAILS
 * - API.Response.User extracts: API, Response, User
 *
 * Used for TypeScript type usage tracking to detect namespace imports.
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
 *
 * Handles complex TypeScript type structures with nested generics, unions, and more.
 * Traverses the type AST to find all referenced type identifiers.
 *
 * Supported type structures:
 * - TSTypeReference: Basic type reference (User, Array<string>)
 * - TSQualifiedName: Namespace.Type
 * - TSUnionType: Type1 | Type2
 * - TSIntersectionType: Type1 & Type2
 * - TSArrayType: Type[]
 * - TSTupleType: [Type1, Type2]
 * - TSIndexedAccessType: Props['variant']
 * - TSTypeQuery: typeof Type
 * - TSTypeLiteral: { prop: Type }
 *
 * Recursively processes:
 * - Generic type parameters: Array<User<Details>>
 * - Nested type literals: { user: { name: string } }
 * - Complex unions: (Type1 & Type2) | Type3
 *
 * Examples:
 * - Array<User> extracts: Array, User
 * - Record<string, User | Admin> extracts: Record, User, Admin
 * - Props['variant'] & BaseProps extracts: Props, BaseProps
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
 * Find all identifier references in the AST (excluding imports and declarations)
 *
 * Tracks both runtime JavaScript usage and TypeScript type usage.
 * This is the core function that determines what is "used" vs "unused".
 *
 * RUNTIME USAGE (Identifier nodes):
 * Includes:
 * - Variable references: console.log(foo)
 * - Function calls: doSomething()
 * - JSX elements: <Component />
 * - Object property values: { key: value }
 * - Shorthand properties: { foo } (foo is used)
 * - Export statements: export { foo }
 *
 * Excludes:
 * - Import specifiers: import { Foo } (declarations, not usage)
 * - Variable declarators: const foo = ... (declarations, not usage)
 * - Function parameters: function(foo) (declarations, not usage)
 * - Object property keys: { foo: 1 } (keys, not usage)
 * - JSX attribute names: <div onClick={...} /> (attribute name, not usage)
 * - Destructuring keys: const { foo: bar } = ... (keys, not usage)
 *
 * TYPESCRIPT TYPE USAGE (Type nodes):
 * - Type annotations on variables, parameters, return types
 * - Generic type parameters: useForm<Type>()
 * - Type alias right-hand sides: type Foo = Bar
 *
 * Returns Set of all used identifier names.
 */
function findUsedIdentifiers(root, j) {
  const used = new Set()

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
    if ((parent.type === 'Property' || parent.type === 'ObjectProperty') && path.name === 'key') {
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

  root.find(j.Node).forEach((path) => {
    const node = path.node

    // Type annotations: `: Type`, return types, etc.
    if (node.type === 'TSTypeAnnotation' && node.typeAnnotation) {
      extractTypeNames(node.typeAnnotation, used)
    }

    // Type alias declarations: type Foo = Bar
    if (node.type === 'TSTypeAliasDeclaration' && node.typeAnnotation) {
      extractTypeNames(node.typeAnnotation, used)
    }

    // Type parameters in generics: useForm<Type>(), new Array<Type>()
    if (node.type === 'CallExpression' || node.type === 'NewExpression') {
      const typeParams = node.typeParameters || node.typeArguments
      if (typeParams?.params) {
        for (const param of typeParams.params) {
          extractTypeNames(param, used)
        }
      }
    }
  })

  return used
}

/**
 * Remove unused named imports from import declarations
 *
 * Iterates through all import declarations and removes unused named imports.
 * Side-effect imports (import './styles') are preserved.
 *
 * IMPORTANT: Recalculates used identifiers on every call for multi-pass support.
 * This ensures cascading removals work correctly (removing variable A may make import B unused).
 *
 * Process:
 * 1. Recalculate used identifiers from current AST state
 * 2. Find import declarations
 * 3. Check each named import specifier against used identifiers
 * 4. Remove unused specifiers (keeps import if other specifiers remain)
 * 5. Return list of removed imports for logging
 *
 * Examples:
 * Input: import { Foo, Bar } from 'lib' where Bar unused
 * Output: import { Foo } from 'lib'
 * Input: import { Foo } from 'lib' where Foo unused
 * Output: entire import removed
 * Input: import './styles'
 * Output: preserved (side-effect import)
 *
 * Returns array of removed imports: [{ name: 'Bar', from: 'lib' }, ...]
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
 * Remove unused variable declarations (const, let, var)
 *
 * Removes unused variable declarations from the file.
 * NEVER removes exported declarations - only internal unused variables.
 *
 * IMPORTANT: Recalculates used identifiers on every call for multi-pass support.
 * This ensures cascading removals work correctly (removing import A may make variable B unused).
 *
 * Process:
 * 1. Recalculate used identifiers from current AST state
 * 2. Find variable declarations
 * 3. Skip exported declarations (export const, export { ... })
 * 4. Check each variable declarator against used identifiers
 * 5. Remove unused declarators (removes entire statement if all unused)
 * 6. Return list of removed variable names for logging
 *
 * Protected from removal:
 * - export const foo = ... (exported)
 * - export { foo } (exported)
 * - export default foo (exported)
 *
 * Examples:
 * Input: const foo = 1, bar = 2 where bar unused
 * Output: const foo = 1
 * Input: const foo = 1 where foo unused
 * Output: entire statement removed
 * Input: export const foo = 1
 * Output: preserved (exported)
 *
 * Returns array of removed variable names: ['bar', 'baz', ...]
 */
function removeUnusedVariables(root, j, options = {}) {
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
