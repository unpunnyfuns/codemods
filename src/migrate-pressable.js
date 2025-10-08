/**
 * Migrate NativeBase Pressable → React Native Pressable
 *
 * Common wrapper sets accessibilityRole="button" by default, preserve this behavior
 *
 * <Pressable bg="blue.500" p={4} onPress={fn}>{children}</Pressable>
 * =>
 * <Pressable style={styles.pressable0} onPress={fn} accessibilityRole="button">{children}</Pressable>
 * const styles = StyleSheet.create({ pressable0: { backgroundColor: color.blue['500'], padding: 4 } })
 */

import * as commonDirectProps from './mappings/direct-props.js'
import * as commonDropProps from './mappings/drop-props.js'
import * as commonStyleProps from './mappings/style-props.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from './utils/imports.js'
import {
  addPropsToElement,
  addStyleProp,
  buildStyleValue,
  removePropsFromElement,
} from './utils/jsx-transforms.js'
import { addOrExtendStyleSheet, categorizeProps } from './utils/props.js'

// Pressable prop mappings
const STYLE_PROPS = {
  ...commonStyleProps.SPACING,
  ...commonStyleProps.SIZING,
  ...commonStyleProps.COLOR,
  ...commonStyleProps.BORDER,
  ...commonStyleProps.LAYOUT,
  ...commonStyleProps.FLEXBOX,
  ...commonStyleProps.POSITION,
  ...commonStyleProps.EXTRA,
}

const TRANSFORM_PROPS = {}

const DIRECT_PROPS = [
  ...commonDirectProps.COMMON,
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

const DROP_PROPS = [...commonDropProps.COMMON, 'isDisabled']

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport || '@hb-frontend/common/src/components'
  const targetImport = options.targetImport || 'react-native'
  const targetName = options.targetName || 'Pressable'
  const tokenImport = options.tokenImport || '@hb-frontend/nordlys'

  // Find imports
  const imports = root.find(j.ImportDeclaration, {
    source: { value: sourceImport },
  })
  if (!imports.length || !hasNamedImport(imports, 'Pressable')) return fileInfo.source

  // Find all Pressable elements
  const pressableElements = root.find(j.JSXElement, {
    openingElement: { name: { name: 'Pressable' } },
  })
  if (pressableElements.length === 0) return fileInfo.source

  const elementStyles = []
  const usedTokenHelpers = new Set()

  const pressableProps = { STYLE_PROPS, TRANSFORM_PROPS, DIRECT_PROPS, DROP_PROPS }

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
    } = categorizeProps(attributes, pressableProps, j)

    newHelpers.forEach((h) => {
      usedTokenHelpers.add(h)
    })

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
  usedTokenHelpers.forEach((h) => addNamedImport(root, tokenImport, h, j))

  // Add StyleSheet
  if (elementStyles.length > 0) {
    addNamedImport(root, targetImport, 'StyleSheet', j)
  }
  addOrExtendStyleSheet(root, elementStyles, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
