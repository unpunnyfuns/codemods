/**
 * Redirect imports from one path to another, optionally renaming imported identifiers
 *
 * Options:
 * - sourceImport: The import path to look for (required)
 * - targetImport: The import path to redirect to (required)
 * - rename: JSON object mapping old names to new names (optional)
 *
 * Examples:
 * // Simple redirect (no renaming)
 * ./run.sh redirect-imports "src/**\/*.tsx" --sourceImport="native-base" --targetImport="@org/common/src/components/native-base"
 *
 * // Redirect with renaming
 * ./run.sh redirect-imports "src/**\/*.tsx" --sourceImport="native-base" --targetImport="@new/path" --rename='{"Box":"Container","Button":"Btn"}'
 */

import { matchesImportPath } from './utils/imports.js'

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  if (!options.sourceImport || !options.targetImport) {
    throw new Error('redirect-imports requires --sourceImport and --targetImport options')
  }

  const sourceImport = options.sourceImport
  const targetImport = options.targetImport

  // Parse rename mapping if provided
  let renameMap = {}
  if (options.rename) {
    try {
      renameMap = typeof options.rename === 'string' ? JSON.parse(options.rename) : options.rename
    } catch (err) {
      throw new Error(`Invalid rename mapping: ${err.message}`)
    }
  }

  // Find imports (handles trailing slashes)
  const imports = root.find(j.ImportDeclaration, {
    source: {
      value: matchesImportPath(sourceImport),
    },
  })

  // Bail early if nothing to do
  if (!imports.length) {
    return fileInfo.source
  }

  // Track what needs to be renamed in the file
  const renamings = new Map() // localName -> newName

  // Process each import
  imports.forEach((path) => {
    const { node } = path

    // Process specifiers and build rename map
    const newSpecifiers = node.specifiers?.map((spec) => {
      if (spec.type === 'ImportSpecifier') {
        const importedName = spec.imported.name
        const localName = spec.local.name
        const newName = renameMap[importedName]

        if (newName) {
          // Track this for renaming throughout the file
          renamings.set(localName, newName)

          // Create new specifier with renamed import
          return j.importSpecifier(j.identifier(newName), j.identifier(newName))
        }
      }
      return spec
    })

    // Create new import with updated path and specifiers
    const newImport = j.importDeclaration(newSpecifiers || node.specifiers, j.literal(targetImport))

    // Preserve type imports
    if (node.importKind) {
      newImport.importKind = node.importKind
    }

    j(path).replaceWith(newImport)
  })

  // Rename all usages throughout the file
  if (renamings.size > 0) {
    for (const [oldName, newName] of renamings) {
      // Rename all identifiers (except in import/export declarations)
      root
        .find(j.Identifier, { name: oldName })
        .filter((path) => {
          // Don't rename in import declarations (already handled)
          if (path.parent.node.type === 'ImportSpecifier') {
            return false
          }
          // Don't rename in export declarations
          if (path.parent.node.type === 'ExportSpecifier') {
            return false
          }
          return true
        })
        .replaceWith(() => j.identifier(newName))
    }
  }

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
