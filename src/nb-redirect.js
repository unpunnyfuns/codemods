/**
 * Routes native-base imports to the shim
 */

import { redirectImport } from './utils/imports.js'

// Path constants
const IMPORTS_PATH = 'native-base'
const TARGET_PATH = '@org/common/src/components/native-base'

function main(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Find imports
  const imports = root.find(j.ImportDeclaration, {
    source: {
      value: IMPORTS_PATH,
    },
  })

  // Bail early if nothing to do
  if (imports.size() === 0) {
    return fileInfo.source
  }

  // Replace each imports source with the shim path
  imports.replaceWith((path) => redirectImport(path.node, TARGET_PATH, j))

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
