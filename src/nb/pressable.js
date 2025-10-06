/**
 * NativeBase Pressable to React Native Pressable with StyleSheet
 *
 * Pressable element unchanged (same name, nearly identical API)
 * Style props extracted to StyleSheet
 * Interaction props pass through (onPress, onLongPress, etc.)
 * accessibilityRole defaults to "button"
 * Re-runnable on partially migrated files
 */

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import {
  addTransformedProps,
  buildStyleValue,
  createStringAttribute,
  filterAttributes,
  findJSXElements,
  hasAttribute,
} from '@puns/shiftkit/jsx'
import { createStyleContext } from '../helpers/style-context.js'
import { directProps } from './mappings/props-direct.js'
import {
  allPseudoProps,
  platformPseudoProps,
  themePseudoProps,
  unsupportedProps,
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

// styleProps: spacing, sizing, colors, borders, layout, flexbox, position
// transformProps: none (RN Pressable API compatible)
// directProps: onPress, onPressIn, onPressOut, onLongPress, disabled, hitSlop, accessibility
// dropProps: colorScheme, variant, isDisabled (use 'disabled'), pseudo-props, platform/theme overrides
const styleProps = {
  ...spacing,
  ...sizing, // Includes 'size' for layout (width/height)
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
  ...directProps, // Accessibility, testID, children, etc.
  // Interaction props
  'onPress',
  'onPressIn',
  'onPressOut',
  'onLongPress',
  'disabled',
  // Touch area props
  'hitSlop',
  'pressRetentionOffset',
  // Platform-specific
  'android_disableSound',
  'android_ripple',
  // Experimental
  'unstable_pressDelay',
]

// Explicit drop list for Pressable
// NOTE: Pressable is an interaction component (migrates to RN Pressable), not themed - drop colorScheme/variant
// The 'size' prop is handled by styleProps as layout (width/height)
const dropPropsList = [
  ...allPseudoProps, // _hover, _pressed, _focus (RN Pressable has different state API)
  ...platformPseudoProps, // _ios, _android, _web
  ...themePseudoProps, // _light, _dark
  ...unsupportedProps, // Props that don't map to React Native
  'colorScheme', // Pressable is unstyled, not themed
  'variant', // Pressable is unstyled, not themed
  'isDisabled', // Use standard 'disabled' prop
]

const pressableProps = {
  styleProps,
  transformProps,
  directProps: directPropsList,
  dropProps: dropPropsList,
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport
  const targetImport = options.targetImport ?? 'react-native'
  const targetName = options.targetName ?? 'Pressable'
  const tokenImport = options.tokenImport

  if (!sourceImport) {
    throw new Error('--sourceImport is required (e.g., --sourceImport="@your/common/components")')
  }
  if (!tokenImport) {
    throw new Error('--tokenImport is required (e.g., --tokenImport="@your/design-tokens")')
  }

  // Check for Pressable imports from both source and target (for re-running)
  const sourceImports = root.find(j.ImportDeclaration, {
    source: { value: sourceImport },
  })
  const targetImports = root.find(j.ImportDeclaration, {
    source: { value: targetImport },
  })

  const hasSourcePressable = sourceImports.length > 0 && hasNamedImport(sourceImports, 'Pressable')
  const hasTargetPressable = targetImports.length > 0 && hasNamedImport(targetImports, 'Pressable')

  if (!hasSourcePressable && !hasTargetPressable) {
    return fileInfo.source
  }

  const pressableElements = findJSXElements(root, 'Pressable', j)
  if (pressableElements.length === 0) {
    return fileInfo.source
  }

  const styles = createStyleContext()
  let migrated = 0

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
      hasManualFailures,
    } = categorizeProps(attributes, pressableProps, j)

    // Skip transformation if manual intervention required (unless --unsafe)
    if (hasManualFailures && !options.unsafe) {
      console.warn(`⚠️  Pressable element skipped - manual fixes required (${fileInfo.path})`)
      return
    }

    if (hasManualFailures && options.unsafe) {
      console.warn(
        `⚠️  Pressable element: unsafe mode - proceeding with partial migration (${fileInfo.path})`,
      )
    }

    styles.addHelpers(newHelpers)

    // Keep only direct props (filter out style props and dropped props)
    const pressableAttributes = filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    // Preserve wrapper's default accessibilityRole="button" if not explicitly set
    if (!hasAttribute(pressableAttributes, 'accessibilityRole')) {
      pressableAttributes.push(createStringAttribute('accessibilityRole', 'button', j))
    }

    // Add transformed props
    addTransformedProps(pressableAttributes, transformedProps, j)

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
      pressableAttributes.push(styleProp)
    }

    // Update element attributes
    path.node.openingElement.attributes = pressableAttributes

    addElementComment(path, droppedProps, invalidStyles, j)
    migrated++
  })

  // Only change imports if we migrated at least one element
  if (migrated === 0) {
    return fileInfo.source
  }

  // Remove Pressable from source import (if it exists) and add to target
  if (hasSourcePressable) {
    removeNamedImport(sourceImports, 'Pressable', j)
  }
  addNamedImport(root, targetImport, targetName, j)

  styles.applyToRoot(root, { wrap: false, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
