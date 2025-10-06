/**
 * Routes native-base imports to the shim
 */

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
  imports.replaceWith((path) => {
    const node = path.node

    // `node.specifiers` contains an array of the imported items
    // `TARGET_PATH` must be cast from a string to an AST node
    const newImport = j.importDeclaration(node.specifiers, j.literal(TARGET_PATH))

    // Save import kind (for type imports)
    if (node.importKind) {
      newImport.importKind = node.importKind
    }

    return newImport
  })

  // Return formatted source
  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
