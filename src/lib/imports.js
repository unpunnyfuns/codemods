/**
 * Utilities for manipulating import statements
 */

/**
 * Create a matcher function for import paths that handles trailing slashes
 */
export function matchesImportPath(importPath) {
  return (value) => value === importPath || value === `${importPath}/`
}

/**
 * Insert new import declarations after the last existing import
 */
export function insertImports(root, newImports, j) {
  const importsArray = Array.isArray(newImports) ? newImports : [newImports]

  if (importsArray.length === 0) {
    return
  }

  const lastImport = root.find(j.ImportDeclaration).at(-1)
  if (lastImport.length) {
    lastImport.insertAfter(importsArray)
  } else {
    root.get().node.program.body.unshift(...importsArray)
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
      path.node.specifiers = otherSpecifiers
    } else {
      j(path).remove()
    }
  })
}

/**
 * Add a named import to an import path, reusing existing import if available
 */
export function addNamedImport(root, modulePath, importName, j) {
  const existingImport = root.find(j.ImportDeclaration, {
    source: { value: modulePath },
  })

  if (existingImport.length > 0) {
    existingImport.forEach((path) => {
      const alreadyImported = (path.node?.specifiers || []).some(
        (spec) => spec.type === 'ImportSpecifier' && spec.imported.name === importName,
      )
      if (!alreadyImported) {
        const specifier = j.importSpecifier(j.identifier(importName))
        if (path.node?.specifiers) {
          path.node.specifiers.push(specifier)
        }
      }
    })
  } else {
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
  return imports.some((path) => {
    const specifiers = path.node?.specifiers || []
    return specifiers.some(
      (spec) => spec.type === 'ImportSpecifier' && spec.imported.name === importName,
    )
  })
}
