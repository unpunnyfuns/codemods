/**
 * Migrate NativeBase HStack/VStack → Aurora Stack with direction
 *
 * <HStack space={2}>{children}</HStack>
 * <VStack space={4}>{children}</VStack>
 * =>
 * <Stack direction="horizontal" gap={space[2]}>{children}</Stack>
 * <Stack direction="vertical" gap={space[4]}>{children}</Stack>
 */

import { directProps } from './mappings/direct-props.js'
import { dropProps } from './mappings/drop-props.js'
import {
  border,
  color,
  extra,
  flexbox,
  layout,
  position,
  sizing,
  spacing,
} from './mappings/style-props.js'
import { alignValues, justifyValues } from './mappings/value-maps.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from './utils/imports.js'
import {
  addPropsToElement,
  addStyleProp,
  buildStyleValue,
  removePropsFromElement,
  updateElementName,
} from './utils/jsx-transforms.js'
import { addOrExtendStyleSheet, categorizeProps } from './utils/props.js'

// Stack prop mappings
const styleProps = {
  ...spacing,
  ...sizing,
  ...color,
  ...border,
  ...layout,
  ...flexbox,
  ...position,
  ...extra,

  // Stack-specific props with value mapping
  align: {
    styleName: 'alignItems',
    valueMap: alignValues,
  },
  justify: {
    styleName: 'justifyContent',
    valueMap: justifyValues,
  },
}

// Remove space from STYLE_PROPS since it should stay on element
delete styleProps.space

const transformProps = {
  space: 'gap',
}

const directPropsList = directProps

const dropPropsList = [...dropProps, 'divider', 'reversed', '_text', '_stack']

const STACK_COMPONENTS = [
  { name: 'HStack', direction: 'horizontal' },
  { name: 'VStack', direction: 'vertical' },
]

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? 'react-native'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/'
  const targetName = options.targetName ?? 'Stack'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'

  // Find imports
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length) {
    return fileInfo.source
  }

  let transformed = false
  const elementStyles = []
  const usedTokenHelpers = new Set()

  const stackProps = {
    styleProps,
    transformProps,
    directProps: directPropsList,
    dropProps: dropPropsList,
  }

  // Process each stack component type
  for (const { name: componentName, direction } of STACK_COMPONENTS) {
    if (!hasNamedImport(imports, componentName)) {
      continue
    }

    const stackElements = root.find(j.JSXElement, {
      openingElement: { name: { name: componentName } },
    })
    if (stackElements.length === 0) {
      continue
    }

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

      for (const h of newHelpers) {
        usedTokenHelpers.add(h)
      }

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
  }

  if (!transformed) {
    return fileInfo.source
  }

  // Update imports
  addNamedImport(root, targetImport, targetName, j)
  for (const h of usedTokenHelpers) {
    addNamedImport(root, tokenImport, h, j)
  }

  // Add StyleSheet
  addOrExtendStyleSheet(root, elementStyles, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
