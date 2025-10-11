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
import { addElementComment, addOrExtendStyleSheet, categorizeProps } from './props.js'

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

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
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

  const pressableElements = root.find(j.JSXElement, {
    openingElement: { name: { name: 'Pressable' } },
  })
  if (pressableElements.length === 0) {
    return fileInfo.source
  }

  const elementStyles = []
  const usedTokenHelpers = new Set()

  const pressableProps = {
    styleProps,
    transformProps,
    directProps: directPropsList,
    dropProps: dropPropsList,
  }

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

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

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
      existingStyleReferences,
    )
    addStyleProp(attributes, styleValue, j)

    addElementComment(path, droppedProps, invalidStyles, j)
  })

  removeNamedImport(imports, 'Pressable', j)
  addNamedImport(root, targetImport, targetName, j)
  for (const h of usedTokenHelpers) {
    addNamedImport(root, tokenImport, h, j)
  }

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
