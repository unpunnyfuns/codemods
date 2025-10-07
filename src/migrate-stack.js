/**
 * Migrate NativeBase HStack/VStack → Aurora Stack with direction
 *
 * <HStack space={2}>{children}</HStack>
 * <VStack space={4}>{children}</VStack>
 * =>
 * <Stack direction="horizontal" gap={space[2]}>{children}</Stack>
 * <Stack direction="vertical" gap={space[4]}>{children}</Stack>
 */

import * as stackProps from './mappings/stack-props.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from './utils/imports.js'
import {
  addPropsToElement,
  addStyleProp,
  buildStyleValue,
  removePropsFromElement,
  updateElementName,
} from './utils/jsx-transforms.js'
import { addOrExtendStyleSheet, categorizeProps } from './utils/props.js'

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

  // Find imports
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length) return fileInfo.source

  let transformed = false
  const elementStyles = []
  const usedTokenHelpers = new Set()

  // Process each stack component type
  STACK_COMPONENTS.forEach(({ name: componentName, direction }) => {
    if (!hasNamedImport(imports, componentName)) return

    const stackElements = root.find(j.JSXElement, {
      openingElement: { name: { name: componentName } },
    })
    if (stackElements.length === 0) return

    // Transform each element
    stackElements.forEach((path, index) => {
      const attributes = path.node.openingElement.attributes || []

      // Categorize props
      const {
        styleProps,
        inlineStyles,
        transformedProps,
        propsToRemove,
        usedTokenHelpers: newHelpers,
      } = categorizeProps(attributes, stackProps, j)

      newHelpers.forEach((h) => usedTokenHelpers.add(h))

      // Transform element
      removePropsFromElement(attributes, propsToRemove)
      updateElementName(path, targetName)

      // Add direction prop
      const directionProp = j.jsxAttribute(j.jsxIdentifier('direction'), j.stringLiteral(direction))
      attributes.push(directionProp)

      addPropsToElement(attributes, transformedProps, j)

      const styleValue = buildStyleValue(
        styleProps,
        inlineStyles,
        `${componentName.toLowerCase()}${index}`,
        elementStyles,
        j,
      )
      addStyleProp(attributes, styleValue, j)
    })

    removeNamedImport(imports, componentName, j)
    transformed = true
  })

  if (!transformed) return fileInfo.source

  // Update imports
  addNamedImport(root, targetImport, targetName, j)
  usedTokenHelpers.forEach((h) => addNamedImport(root, tokenImport, h, j))

  // Add StyleSheet
  addOrExtendStyleSheet(root, elementStyles, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
