/**
 * Shared utilities for manipulating import statements
 */

/**
 * Create a matcher function for import paths that handles trailing slashes
 * @param {string} importPath - The import path to match
 * @returns {function} Matcher function for use in jscodeshift queries
 */
export function matchesImportPath(importPath) {
  return (value) => value === importPath || value === `${importPath}/`
}

/**
 * Redirect an import to a new path while preserving importKind (type imports)
 * @param {object} importNode - The import declaration node
 * @param {string} newPath - The new import path
 * @param {object} j - jscodeshift API
 * @returns {object} New import declaration with preserved importKind
 */
export function redirectImport(importNode, newPath, j) {
  const newImport = j.importDeclaration(importNode.specifiers, j.literal(newPath))
  if (importNode.importKind) {
    newImport.importKind = importNode.importKind
  }
  return newImport
}

/**
 * Insert new import declarations after the last existing import, or at the top if none exist
 */
export function insertImports(root, newImports, j) {
  if (!Array.isArray(newImports)) {
    newImports = [newImports]
  }

  if (newImports.length === 0) {
    return
  }

  const lastImport = root.find(j.ImportDeclaration).at(-1)
  if (lastImport.length) {
    lastImport.insertAfter(newImports)
  } else {
    root.get().node.program.body.unshift(...newImports)
  }
}

/**
 * Remove a named import from import declarations
 * If it's the only import, removes the entire import statement
 */
export function removeNamedImport(imports, importName, j) {
  imports.forEach((path) => {
    const otherSpecifiers = (path.node.specifiers || []).filter(
      (spec) => !(spec.type === 'ImportSpecifier' && spec.imported.name === importName),
    )

    if (otherSpecifiers.length > 0) {
      // Keep the import with remaining specifiers
      path.node.specifiers = otherSpecifiers
    } else {
      // Remove the entire import
      j(path).remove()
    }
  })
}

/**
 * Add a named import to an import path, reusing existing import if available
 * Creates a new import statement if none exists for the given module
 */
export function addNamedImport(root, modulePath, importName, j) {
  const existingImport = root.find(j.ImportDeclaration, {
    source: {
      value: modulePath,
    },
  })

  if (existingImport.length > 0) {
    // Add to existing import if not already there
    existingImport.forEach((path) => {
      const alreadyImported = (path.node.specifiers || []).some(
        (spec) => spec.type === 'ImportSpecifier' && spec.imported.name === importName,
      )
      if (!alreadyImported) {
        const specifier = j.importSpecifier(j.identifier(importName))
        path.node.specifiers.push(specifier)
      }
    })
  } else {
    // Create new import
    const newImport = j.importDeclaration(
      [j.importSpecifier(j.identifier(importName))],
      j.literal(modulePath),
    )
    insertImports(root, newImport, j)
  }
}

/**
 * Check if a named import is present in any of the given import declarations
 */
export function hasNamedImport(imports, importName) {
  let found = false
  imports.forEach((path) => {
    const specifiers = path.node.specifiers || []
    specifiers.forEach((spec) => {
      if (spec.type === 'ImportSpecifier' && spec.imported.name === importName) {
        found = true
      }
    })
  })
  return found
}
