/**
 * NativeBase Pressable to React Native Pressable with StyleSheet
 *
 * Pressable element unchanged (same name, nearly identical API)
 * Style props extracted to StyleSheet
 * Interaction props pass through (onPress, onLongPress, etc.)
 * accessibilityRole defaults to "button"
 * Re-runnable on partially migrated files
 */

import { pipeline } from '../lib/pipeline.js'
import {
  applyCollectedStyles,
  applyStyleSheet,
  checkImports,
  findElements,
  initStyleContext,
  manageImports,
  parseOptions,
  transformElements,
} from '../lib/pipeline-steps.js'
import {
  addTransformedProps,
  buildStyleValue,
  createStringAttribute,
  filterAttributes,
  hasAttribute,
} from '../lib/jsx.js'
import { directProps } from './configs/props-direct.js'
import {
  allPseudoProps,
  platformPseudoProps,
  themePseudoProps,
  unsupportedProps,
} from './configs/props-drop.js'
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
} from './configs/props-style.js'
import { categorizeProps } from './props.js'

/* ===========================================================================
   Configuration
   =========================================================================== */

const pressableConfig = {
  sourceImport: '@source/components',
  targetImport: 'react-native',
  targetName: 'Pressable',
  tokenImport: '@design-tokens',
  wrap: false,
}

const DIRECT_PROPS = [
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

const pressableProps = {
  styleProps: {
    ...spacing,
    ...sizing,
    ...color,
    ...border,
    ...layout,
    ...flexbox,
    ...position,
    ...text,
    ...extra,
  },
  transformProps: {},
  directProps: DIRECT_PROPS,
  dropProps: [
    ...allPseudoProps,
    ...platformPseudoProps,
    ...themePseudoProps,
    ...unsupportedProps,
    'colorScheme',
    'variant',
    'isDisabled',
  ],
}

/* ===========================================================================
   Transform
   =========================================================================== */

function transformPressable(path, index, ctx) {
  const { j } = ctx
  const attributes = path.node.openingElement.attributes || []
  const warnings = []

  const categorized = categorizeProps(attributes, pressableProps, j)
  const {
    styleProps,
    inlineStyles,
    transformedProps,
    propsToRemove,
    existingStyleReferences,
    usedTokenHelpers,
  } = categorized

  const attrs = filterAttributes(attributes, {
    allow: DIRECT_PROPS.filter((prop) => !propsToRemove.includes(prop)),
  })

  // Add default accessibilityRole="button" if not specified
  if (!hasAttribute(attrs, 'accessibilityRole')) {
    attrs.push(createStringAttribute('accessibilityRole', 'button', j))
  }

  addTransformedProps(attrs, transformedProps, j)

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

  if (styleValue) {
    attrs.push(j.jsxAttribute(j.jsxIdentifier('style'), j.jsxExpressionContainer(styleValue)))
  }

  // Update element
  path.node.openingElement.attributes = attrs

  // Return results immutably
  return {
    element: path.node,
    warnings,
    tokenHelpers: usedTokenHelpers,
    styles: tempStyles,
  }
}

/* ===========================================================================
   Pipeline
   =========================================================================== */

export default function transform(fileInfo, api, options) {
  return pipeline(fileInfo, api, options, [
    parseOptions(pressableConfig),
    checkImports('Pressable'),
    findElements('Pressable'),
    initStyleContext(),
    transformElements(transformPressable),
    applyCollectedStyles(),
    manageImports('Pressable'),
    applyStyleSheet(),
  ])
}
