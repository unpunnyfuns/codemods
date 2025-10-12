// Migrate NativeBase Pressable → React Native Pressable with StyleSheet
// See pressable.md for documentation

import { createJSXHelper } from '../helpers/factory.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import { buildStyleValue } from '@puns/shiftkit'
import { createStyleContext } from '../helpers/style-context.js'
import { directProps } from './mappings/props-direct.js'
import {
  allPseudoProps,
  componentAgnostic,
  platformOverrides,
  themeOverrides,
} from './mappings/props-drop.js'
import {
  border,
  color,
  extra,
  flexbox,
  layout,
  position,
  sizing,
  spacing,
  text,
} from './mappings/props-style.js'
import { addElementComment, categorizeProps } from './props.js'

// Pressable prop mappings
const styleProps = {
  ...spacing,
  // Includes 'size' for layout (width/height)
  ...sizing,
  ...color,
  ...border,
  ...layout,
  ...flexbox,
  ...position,
  ...text,
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

// Explicit drop list for Pressable
// NOTE: Pressable is an interaction component (migrates to RN Pressable), not themed - drop colorScheme/variant
// The 'size' prop is handled by styleProps as layout (width/height)
const dropPropsList = [
  ...allPseudoProps,
  ...platformOverrides,
  ...themeOverrides,
  ...componentAgnostic,
  // Pressable is an interaction component, not themed
  'colorScheme',
  'variant',
  'isDisabled',
]

const pressableProps = {
  styleProps,
  transformProps,
  directProps: directPropsList,
  dropProps: dropPropsList,
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const $ = createJSXHelper(j)
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? 'react-native'
  const targetName = options.targetName ?? 'Pressable'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'

  // import { Pressable } from '@hb-frontend/common/src/components'
  const imports = root.find(j.ImportDeclaration, {
    source: { value: sourceImport },
  })
  if (!imports.length || !hasNamedImport(imports, 'Pressable')) {
    return fileInfo.source
  }

  const pressableElements = $.findElements(root, 'Pressable')
  if (pressableElements.length === 0) {
    return fileInfo.source
  }

  const styles = createStyleContext()

  pressableElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
      droppedProps,
      invalidStyles,
      existingStyleReferences,
    } = categorizeProps(attributes, pressableProps, j)

    styles.addHelpers(newHelpers)

    // Remove props that need to be removed
    path.node.openingElement.attributes = attributes.filter((attr) => !propsToRemove.includes(attr))

    // Preserve wrapper's default accessibilityRole="button" if not explicitly set
    if (!$.hasAttribute(path.node.openingElement.attributes, 'accessibilityRole')) {
      path.node.openingElement.attributes.push(
        $.createStringAttribute('accessibilityRole', 'button'),
      )
    }

    // Add transformed props
    $.addTransformedProps(path.node.openingElement.attributes, transformedProps)

    // Build and add style prop
    const tempStyles = []
    const styleValue = buildStyleValue(
      styleProps,
      inlineStyles,
      `pressable${index}`,
      tempStyles,
      j,
      existingStyleReferences,
    )
    if (tempStyles.length > 0) {
      styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
    }

    // Add style prop to element (only if styleValue is not null)
    if (styleValue) {
      const styleProp = j.jsxAttribute(
        j.jsxIdentifier('style'),
        j.jsxExpressionContainer(styleValue),
      )
      path.node.openingElement.attributes.push(styleProp)
    }

    addElementComment(path, droppedProps, invalidStyles, j)
  })

  removeNamedImport(imports, 'Pressable', j)
  addNamedImport(root, targetImport, targetName, j)

  styles.applyToRoot(root, { wrap: false, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
