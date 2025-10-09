// Migrate NativeBase HStack/VStack → Stack with direction
// See stack.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import {
  addPropsToElement,
  addStyleProp,
  buildStyleValue,
  removePropsFromElement,
  updateElementName,
} from '../helpers/jsx-transforms.js'
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
import { addDroppedPropsComment, addOrExtendStyleSheet, categorizeProps } from './props.js'

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
  // align="start" → alignItems: 'flex-start' (extracted to StyleSheet)
  align: {
    styleName: 'alignItems',
    valueMap: alignValues,
  },
  // justify="between" → justifyContent: 'space-between' (extracted to StyleSheet)
  justify: {
    styleName: 'justifyContent',
    valueMap: justifyValues,
  },
}

// Remove space from STYLE_PROPS since it should stay on element as gap
delete styleProps.space

// space={2} → gap={space[2]} (stays on element, not extracted)
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
  const droppedPropsMap = new Map()

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
        droppedProps,
      } = categorizeProps(attributes, stackProps, j)

      for (const h of newHelpers) {
        usedTokenHelpers.add(h)
      }

      // Store dropped props for this element
      if (droppedProps.length > 0) {
        droppedPropsMap.set(index, droppedProps)
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

  // Add comment about dropped props
  addDroppedPropsComment(root, droppedPropsMap, 'Stack', j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
