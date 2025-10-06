/**
 * Redirect imports from one path to another, optionally renaming identifiers
 *
 * Handles aliased imports and preserves TypeScript import kind.
 *
 * --sourceImport  Original import path (required). --sourceImport="native-base"
 * --targetImport  New import path (required). --targetImport="@org/components"
 * --sourceName    Identifier to rename (optional). --sourceName="Box"
 * --targetName    New identifier name (optional). --targetName="View"
 */

import { matchesImportPath } from './lib/imports.js'

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

  // matchesImportPath handles trailing slashes: 'foo' matches 'foo' and 'foo/'
  const imports = root.find(j.ImportDeclaration, {
    source: {
      value: matchesImportPath(sourceImport),
    },
  })

  if (!imports.length) {
    return fileInfo.source
  }

  // Example: import { View as RNView } -> localNameToRename='RNView', newName='CustomView'
  let localNameToRename = null
  let newName = null

  imports.forEach((path) => {
    const { node } = path

    // Map over import specifiers to handle renaming
    // ImportSpecifier: { View, Text } or { View as RNView }
    const newSpecifiers = node.specifiers?.map((spec) => {
      if (spec.type === 'ImportSpecifier' && sourceName) {
        // spec.imported.name = what's imported from the module
        // spec.local.name = what's used in the file (may be aliased)
        const importedName = spec.imported.name
        const localName = spec.local.name

        if (importedName === sourceName && targetName) {
          localNameToRename = localName
          newName = targetName

          // Create new import specifier with renamed identifier
          return j.importSpecifier(j.identifier(targetName), j.identifier(targetName))
        }
      }
      return spec
    })

    // Create new import declaration with updated path and specifiers
    const newImport = j.importDeclaration(newSpecifiers || node.specifiers, j.literal(targetImport))

    // Preserve type-only imports: import type { Foo } from 'bar'
    if (node.importKind) {
      newImport.importKind = node.importKind
    }

    j(path).replaceWith(newImport)
  })

  if (localNameToRename && newName) {
    root
      .find(j.Identifier, { name: localNameToRename })
      .filter((path) => {
        // Skip identifiers in import/export specifiers (already handled above)
        if (path.parent.node.type === 'ImportSpecifier') {
          return false
        }
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
