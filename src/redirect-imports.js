/**
 * Redirect imports from one path to another, optionally renaming identifiers
 *
 * ARCHITECTURE:
 * General-purpose utility codemod for import path migrations and identifier renaming.
 * Supports both simple path redirects and complex identifier renames with aliases.
 *
 * USAGE:
 * ./run.sh redirect-imports "src/STAR_STAR/STAR.tsx" --sourceImport="old/path" --targetImport="new/path"
 * ./run.sh redirect-imports "src/STAR_STAR/STAR.tsx" --sourceImport="old" --targetImport="new" --sourceName="Old" --targetName="New"
 * (Replace STAR_STAR with two asterisks, STAR with one asterisk)
 *
 * OPTIONS:
 * - sourceImport (required): Original import path to redirect from
 * - targetImport (required): New import path to redirect to
 * - sourceName (optional): Identifier name to rename (e.g., component name)
 * - targetName (optional): New identifier name (requires sourceName)
 *
 * TRANSFORMATION RULES:
 * Path-only redirect:
 *   Input: import { View } from 'old/path'
 *   Output: import { View } from 'new/path'
 *
 * Path redirect with rename:
 *   Input: import { OldName } from 'old/path'
 *   Output: import { NewName } from 'new/path'
 *
 * Handles aliased imports:
 *   Input: import { OldName as MyName } from 'old/path'
 *   Output: import { NewName } from 'new/path' (all MyName usages use NewName)
 *
 * TYPE HANDLING:
 * Preserves TypeScript import kind:
 * Input: import type { Foo } from 'old'
 * Output: import type { Foo } from 'new'
 * Type imports and value imports handled separately
 *
 * IDENTIFIER RENAMING:
 * When sourceName and targetName are specified:
 * Import specifier renamed: OldName uses NewName
 * All usages in file renamed: OldName or alias uses NewName
 * Export specifiers excluded (only import usages renamed)
 *
 * USE CASES:
 * Migrate components: native-base with react-native
 * Rename components during migration: NativeBaseButton with Button
 * Redirect barrel imports: @org/common with @org/atoms/Component
 * Update deprecated import paths: old-api with new-api
 *
 * See redirect-imports.md for detailed documentation.
 */

import { matchesImportPath } from '@puns/shiftkit'

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

  // Find import declarations matching the source path
  // matchesImportPath handles trailing slashes: 'foo' matches 'foo' and 'foo/'
  const imports = root.find(j.ImportDeclaration, {
    source: {
      value: matchesImportPath(sourceImport),
    },
  })

  if (!imports.length) {
    return fileInfo.source
  }

  // Track local name that needs to be renamed throughout the file
  // Example: import { View as RNView } -> localNameToRename='RNView', newName='CustomView'
  let localNameToRename = null
  let newName = null

  // Process each import declaration
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
          // Track the local name for renaming throughout the file
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

  // Rename all usages of the identifier throughout the file
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
