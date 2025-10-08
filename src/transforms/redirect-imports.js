/**
 * Redirect imports from one path to another, optionally renaming a specific imported identifier
 *
 * Options:
 * - sourceImport: The import path to look for (required)
 * - targetImport: The import path to redirect to (required)
 * - sourceName: The imported identifier to rename (optional)
 * - targetName: The new name for the identifier (optional, requires sourceName)
 *
 * Examples:
 * // Simple redirect (no renaming)
 * ./run.sh redirect-imports "src/**\/*.tsx" --sourceImport="native-base" --targetImport="@org/common/src/components/native-base"
 *
 * // Redirect with renaming
 * ./run.sh redirect-imports "src/**\/*.tsx" --sourceImport="native-base" --targetImport="@new/path" --sourceName="Box" --targetName="Container"
 */

import { matchesImportPath } from '../utils/imports.js'

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  if (!options.sourceImport || !options.targetImport) {
    throw new Error('redirect-imports requires --sourceImport and --targetImport options')
  }

  const sourceImport = options.sourceImport
  const targetImport = options.targetImport
  const sourceName = options.sourceName
  const targetName = options.targetName

  if (targetName && !sourceName) {
    throw new Error('--targetName requires --sourceName to be specified')
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
  let localNameToRename = null
  let newName = null

  // Process each import
  imports.forEach((path) => {
    const { node } = path

    // Process specifiers
    const newSpecifiers = node.specifiers?.map((spec) => {
      if (spec.type === 'ImportSpecifier' && sourceName) {
        const importedName = spec.imported.name
        const localName = spec.local.name

        if (importedName === sourceName && targetName) {
          // Track this for renaming throughout the file
          localNameToRename = localName
          newName = targetName

          // Create new specifier with renamed import
          return j.importSpecifier(j.identifier(targetName), j.identifier(targetName))
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
  if (localNameToRename && newName) {
    root
      .find(j.Identifier, { name: localNameToRename })
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

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
