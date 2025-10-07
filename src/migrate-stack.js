/**
 * Migrate NativeBase Stack components (HStack/VStack) to Aurora Stack
 * Automatically handles both HStack and VStack, setting direction accordingly
 *
 * Before:
 * import { HStack, VStack } from 'native-base'
 * <HStack space={2}>{children}</HStack>
 * <VStack space={4}>{children}</VStack>
 *
 * After:
 * import { Stack } from 'aurora'
 * import { StyleSheet } from 'react-native'
 * import { space } from '@hb-frontend/nordlys'
 * <Stack direction="horizontal" gap={space[2]}>{children}</Stack>
 * <Stack direction="vertical" gap={space[4]}>{children}</Stack>
 *
 * Options:
 * - sourceImport: The import path to look for (default: 'react-native')
 * - targetImport: The import path to use (default: 'aurora')
 * - targetName: The new component name (default: 'Stack')
 * - tokenImport: The import path for token helpers (default: '@hb-frontend/nordlys')
 */

import { toFormattedSource } from './utils/formatting.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from './utils/imports.js'
import { categorizeProps, addOrExtendStyleSheet } from './utils/props.js'
import * as stackProps from './mappings/stack-props.js'

// Component configurations
const STACK_COMPONENTS = [
  { name: 'HStack', direction: 'horizontal' },
  { name: 'VStack', direction: 'vertical' },
]

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport || 'react-native'
  const targetImport = options.targetImport || 'aurora'
  const targetName = options.targetName || 'Stack'
  const tokenImport = options.tokenImport || '@hb-frontend/nordlys'

  // Find imports from the source module
  const imports = root.find(j.ImportDeclaration, {
    source: { value: sourceImport },
  })

  // Bail early if no imports
  if (!imports.length) {
    return fileInfo.source
  }

  let transformed = false
  const allElementStyles = []
  const allUsedTokenHelpers = new Set()

  // Process each stack component type
  STACK_COMPONENTS.forEach((component) => {
    const { name: componentName, direction } = component

    // Check if this component is imported
    if (!hasNamedImport(imports, componentName)) {
      return
    }

    // Find all JSX elements using this component
    const stackElements = root.find(j.JSXElement, {
      openingElement: {
        name: { name: componentName },
      },
    })

    if (stackElements.length === 0) {
      return
    }

    // Transform each element
    stackElements.forEach((path, index) => {
      const attributes = path.node.openingElement.attributes || []

      // Categorize props using shared utility
      const { styleProps, inlineStyles, transformedProps, propsToRemove, usedTokenHelpers } =
        categorizeProps(attributes, stackProps, j)

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
      path.node.openingElement.name.name = targetName
      if (path.node.closingElement) {
        path.node.closingElement.name.name = targetName
      }

      // Add direction prop
      const directionProp = j.jsxAttribute(j.jsxIdentifier('direction'), j.stringLiteral(direction))
      attributes.push(directionProp)

      // Add transformed props
      Object.entries(transformedProps).forEach(([key, value]) => {
        const propAttr = j.jsxAttribute(j.jsxIdentifier(key), value)
        attributes.push(propAttr)
      })

      // Build style prop value
      let styleValue = null

      // If we have StyleSheet styles, reference styles.hstackN or styles.vstackN
      if (Object.keys(styleProps).length > 0) {
        const styleName = `${componentName.toLowerCase()}${index}`
        styleValue = j.memberExpression(j.identifier('styles'), j.identifier(styleName))
        allElementStyles.push({ name: styleName, styles: styleProps })
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
    removeNamedImport(imports, componentName, j)
    transformed = true
  })

  // Bail if nothing was transformed
  if (!transformed) {
    return fileInfo.source
  }

  // Add target component import
  addNamedImport(root, targetImport, targetName, j)

  // Add token helper imports
  allUsedTokenHelpers.forEach((helper) => {
    addNamedImport(root, tokenImport, helper, j)
  })

  // Add StyleSheet if we have styles
  addOrExtendStyleSheet(root, allElementStyles, j)

  return toFormattedSource(root)
}

export default main
