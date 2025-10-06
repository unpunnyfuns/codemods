/**
 * Routes imports to the native-base shim
 */

import { toFormattedSource } from './utils/formatting.js'
import { matchesImportPath, redirectImport } from './utils/imports.js'

// Path constants
const IMPORTS_PATH = '@org/common/src/components'
const TARGET_PATH = '@org/common/src/components/native-base'

function main(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Find imports
  const imports = root.find(j.ImportDeclaration, {
    source: {
      value: matchesImportPath(IMPORTS_PATH),
    },
  })

  // Bail early if nothing to do
  if (imports.size() === 0) {
    return fileInfo.source
  }

  // Replace each imports source with the shim path
  imports.replaceWith((path) => redirectImport(path.node, TARGET_PATH, j))

  // Return formatted source
  return toFormattedSource(root)
}

export default main
