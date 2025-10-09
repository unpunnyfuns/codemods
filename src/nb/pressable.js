// Migrate NativeBase Pressable → React Native Pressable with StyleSheet
// See pressable.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import {
  addPropsToElement,
  addStyleProp,
  buildStyleValue,
  removePropsFromElement,
} from '../helpers/jsx-transforms.js'
import { directProps } from './mappings/props-direct.js'
import { dropProps } from './mappings/props-drop.js'
import {
  border,
  color,
  extra,
  flexbox,
  layout,
  position,
  sizing,
  spacing,
} from './mappings/props-style.js'
import { addDroppedPropsComment, addOrExtendStyleSheet, categorizeProps } from './props.js'

// Pressable prop mappings
const styleProps = {
  ...spacing,
  ...sizing,
  ...color,
  ...border,
  ...layout,
  ...flexbox,
  ...position,
  ...extra,
}

const transformProps = {}

const directPropsList = [
  ...directProps,
  'onPress',
  'onPressIn',
  'onPressOut',
  'onLongPress',
  'disabled',
  'hitSlop',
  'pressRetentionOffset',
  'android_disableSound',
  'android_ripple',
  'unstable_pressDelay',
]

const dropPropsList = [...dropProps, 'isDisabled']

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? 'react-native'
  const targetName = options.targetName ?? 'Pressable'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'

  // Find imports
  const imports = root.find(j.ImportDeclaration, {
    source: { value: sourceImport },
  })
  if (!imports.length || !hasNamedImport(imports, 'Pressable')) {
    return fileInfo.source
  }

  // Find all Pressable elements
  const pressableElements = root.find(j.JSXElement, {
    openingElement: { name: { name: 'Pressable' } },
  })
  if (pressableElements.length === 0) {
    return fileInfo.source
  }

  const elementStyles = []
  const usedTokenHelpers = new Set()
  const droppedPropsMap = new Map()

  const pressableProps = {
    styleProps,
    transformProps,
    directProps: directPropsList,
    dropProps: dropPropsList,
  }

  // Transform each Pressable element
  pressableElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    // Categorize props
    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
      droppedProps,
    } = categorizeProps(attributes, pressableProps, j)

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    // Store dropped props for this element
    if (droppedProps.length > 0) {
      droppedPropsMap.set(index, droppedProps)
    }

    // Transform element
    removePropsFromElement(attributes, propsToRemove)

    // Preserve wrapper's default accessibilityRole="button" if not explicitly set
    const hasAccessibilityRole = attributes.some(
      (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'accessibilityRole',
    )
    if (!hasAccessibilityRole) {
      attributes.push(
        j.jsxAttribute(j.jsxIdentifier('accessibilityRole'), j.stringLiteral('button')),
      )
    }

    addPropsToElement(attributes, transformedProps, j)

    const styleValue = buildStyleValue(
      styleProps,
      inlineStyles,
      `pressable${index}`,
      elementStyles,
      j,
    )
    addStyleProp(attributes, styleValue, j)
  })

  // Update imports
  removeNamedImport(imports, 'Pressable', j)
  addNamedImport(root, targetImport, targetName, j)
  for (const h of usedTokenHelpers) {
    addNamedImport(root, tokenImport, h, j)
  }

  // Add StyleSheet
  if (elementStyles.length > 0) {
    addNamedImport(root, targetImport, 'StyleSheet', j)
  }
  addOrExtendStyleSheet(root, elementStyles, j)

  // Add comment about dropped props
  addDroppedPropsComment(root, droppedPropsMap, 'Pressable', j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
