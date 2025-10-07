/**
 * Migrate NativeBase Box → React Native View with StyleSheet
 *
 * <Box bg="blue.500" p={4} m={2} rounded="md">{children}</Box>
 * =>
 * <View style={styles.box0}>{children}</View>
 * const styles = StyleSheet.create({ box0: { backgroundColor: color.blue['500'], padding: 4, margin: 2, borderRadius: radius.md } })
 */

import { toFormattedSource } from './utils/formatting.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from './utils/imports.js'
import { categorizeProps, addOrExtendStyleSheet } from './utils/props.js'
import { updateElementName, removePropsFromElement, addPropsToElement, buildStyleValue, addStyleProp } from './utils/jsx-transforms.js'
import * as boxProps from './mappings/box-props.js'

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport || 'native-base'
  const targetImport = options.targetImport || 'react-native'
  const tokenImport = options.tokenImport || '@hb-frontend/nordlys'

  // Find imports
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Box')) return fileInfo.source

  // Find all Box elements
  const boxElements = root.find(j.JSXElement, { openingElement: { name: { name: 'Box' } } })
  if (boxElements.length === 0) return fileInfo.source

  const elementStyles = []
  const usedTokenHelpers = new Set()

  // Transform each Box element
  boxElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    // Categorize props
    const { styleProps, inlineStyles, transformedProps, propsToRemove, usedTokenHelpers: newHelpers } =
      categorizeProps(attributes, boxProps, j)

    newHelpers.forEach(h => usedTokenHelpers.add(h))

    // Transform element
    removePropsFromElement(attributes, propsToRemove)
    updateElementName(path, 'View')
    addPropsToElement(attributes, transformedProps, j)

    const styleValue = buildStyleValue(styleProps, inlineStyles, `box${index}`, elementStyles, j)
    addStyleProp(attributes, styleValue, j)
  })

  // Update imports
  removeNamedImport(imports, 'Box', j)
  addNamedImport(root, targetImport, 'View', j)
  usedTokenHelpers.forEach(h => addNamedImport(root, tokenImport, h, j))

  // Add StyleSheet
  addOrExtendStyleSheet(root, elementStyles, j)

  return toFormattedSource(root)
}

export default main
