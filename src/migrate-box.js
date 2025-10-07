/**
 * Migrate NativeBase Box to React Native View with StyleSheet
 *
 * Before:
 * import { Box } from 'native-base'
 * <Box bg="blue.500" p={4} m={2} rounded="md">
 *   {children}
 * </Box>
 *
 * After:
 * import { View, StyleSheet } from 'react-native'
 * import { color, radius, space } from '@hb-frontend/nordlys'
 *
 * <View style={styles.box0}>
 *   {children}
 * </View>
 *
 * const styles = StyleSheet.create({
 *   box0: {
 *     backgroundColor: color.blue['500'],
 *     padding: 4,
 *     margin: 2,
 *     borderRadius: radius.md,
 *   }
 * })
 *
 * Options:
 * - sourceImport: The import path to look for (default: 'native-base')
 * - targetImport: The import path to use (default: 'react-native')
 * - tokenImport: The import path for token helpers (default: '@hb-frontend/nordlys')
 */

import { toFormattedSource } from './utils/formatting.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from './utils/imports.js'
import { categorizeProps, addOrExtendStyleSheet } from './utils/props.js'
import * as boxProps from './mappings/box-props.js'

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport || 'native-base'
  const targetImport = options.targetImport || 'react-native'
  const tokenImport = options.tokenImport || '@hb-frontend/nordlys'

  // Find imports from the source module
  const imports = root.find(j.ImportDeclaration, {
    source: { value: sourceImport },
  })

  // Bail early if no imports
  if (!imports.length) {
    return fileInfo.source
  }

  // Check if Box is imported
  if (!hasNamedImport(imports, 'Box')) {
    return fileInfo.source
  }

  // Find all Box JSX elements
  const boxElements = root.find(j.JSXElement, {
    openingElement: {
      name: { name: 'Box' },
    },
  })

  if (boxElements.length === 0) {
    return fileInfo.source
  }

  const elementStyles = []
  const allUsedTokenHelpers = new Set()

  // Transform each Box element
  boxElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    // Categorize props using shared utility
    const { styleProps, inlineStyles, transformedProps, propsToRemove, usedTokenHelpers } =
      categorizeProps(attributes, boxProps, j)

    // Track token helpers
    for (const helper of usedTokenHelpers) {
      allUsedTokenHelpers.add(helper)
    }

    // Remove mapped props from element
    propsToRemove.forEach((attr) => {
      const attrIndex = attributes.indexOf(attr)
      if (attrIndex > -1) {
        attributes.splice(attrIndex, 1)
      }
    })

    // Update element name
    path.node.openingElement.name.name = 'View'
    if (path.node.closingElement) {
      path.node.closingElement.name.name = 'View'
    }

    // Add transformed props
    Object.entries(transformedProps).forEach(([key, value]) => {
      const propAttr = j.jsxAttribute(j.jsxIdentifier(key), value)
      attributes.push(propAttr)
    })

    // Build style prop value
    let styleValue = null

    // If we have StyleSheet styles, reference styles.boxN
    if (Object.keys(styleProps).length > 0) {
      const styleName = `box${index}`
      styleValue = j.memberExpression(j.identifier('styles'), j.identifier(styleName))
      elementStyles.push({ name: styleName, styles: styleProps })
    }

    // If we have inline styles, create inline object
    if (Object.keys(inlineStyles).length > 0) {
      const inlineProperties = Object.entries(inlineStyles).map(([key, value]) => {
        return j.property('init', j.identifier(key), value)
      })
      const inlineObject = j.objectExpression(inlineProperties)

      // If we also have StyleSheet styles, combine them in an array
      if (styleValue) {
        styleValue = j.arrayExpression([styleValue, inlineObject])
      } else {
        styleValue = inlineObject
      }
    }

    // Add style prop if we have any styles
    if (styleValue) {
      const styleAttr = j.jsxAttribute(j.jsxIdentifier('style'), j.jsxExpressionContainer(styleValue))
      attributes.push(styleAttr)
    }
  })

  // Update imports
  removeNamedImport(imports, 'Box', j)
  addNamedImport(root, targetImport, 'View', j)

  // Add token helper imports
  allUsedTokenHelpers.forEach((helper) => {
    addNamedImport(root, tokenImport, helper, j)
  })

  // Add StyleSheet if we have styles
  addOrExtendStyleSheet(root, elementStyles, j)

  return toFormattedSource(root)
}

export default main
