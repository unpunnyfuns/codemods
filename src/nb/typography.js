/**
 * NativeBase Typography to Nordlys Typography with wrapper View
 *
 * Typography element unchanged (same component name)
 * Text props (type, size, color, align, numberOfLines) stay on Typography
 * Font props (fontFamily, fontSize, fontWeight, lineHeight) DROPPED (managed internally)
 * External style props (spacing, colors, layout) wrapped in View
 * Color prop mapped from NativeBase ColorPath to Nordlys ColorPath
 * Re-runnable on partially migrated files
 */

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import { cloneElement, createViewWrapper, findJSXElements } from '@puns/shiftkit/jsx'
import { createStyleContext } from '../helpers/style-context.js'
import { getNordlysColorPath } from './mappings/maps-color.js'
import { TYPOGRAPHY_RESTRICTED_PROPS } from './mappings/nordlys-props.js'
import { accessibility, eventHandlers } from './mappings/props-direct.js'
import { allPseudoProps } from './mappings/props-drop.js'
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
import { addElementComment, categorizeProps } from './props.js'

// styleProps: spacing, sizing, colors, borders, layout, flexbox, position (for View wrapper)
// transformProps: none
// directProps: type, size, color, align, numberOfLines, textDecorationLine, accessibility, events
// dropProps: fontFamily, fontSize, fontWeight, fontStyle, lineHeight, letterSpacing (managed internally), pseudo-props
const typographyPropConfig = {
  styleProps: {
    ...spacing,
    ...sizing,
    ...color,
    ...border,
    ...layout,
    ...flexbox,
    ...position,
    ...extra,
  },
  transformProps: {},
  directProps: [
    // Typography-specific props
    'type', // Typography variant
    'size', // Typography size
    'color', // Text color (ColorPath)
    'align', // Text alignment
    'numberOfLines', // Truncation
    'textDecorationLine', // Underline, etc.
    // Standard props
    ...accessibility,
    ...eventHandlers,
  ],
  dropProps: [
    ...allPseudoProps,
    // Font props managed internally by Nordlys Typography
    // (fontFamily, fontSize, fontWeight, fontStyle, lineHeight, letterSpacing)
    ...TYPOGRAPHY_RESTRICTED_PROPS.managed,
  ],
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport
  const targetImport = options.targetImport
  const targetName = options.targetName ?? 'Typography'
  const tokenImport = options.tokenImport
  const wrap = options.wrap ?? true

  if (!sourceImport) {
    throw new Error('--sourceImport is required (e.g., --sourceImport="@your/common/components")')
  }
  if (!targetImport) {
    throw new Error(
      '--targetImport is required (e.g., --targetImport="@your/components/Typography")',
    )
  }
  if (!tokenImport) {
    throw new Error('--tokenImport is required (e.g., --tokenImport="@your/design-tokens")')
  }

  // Check for Typography imports from both source and target (for re-running)
  const sourceImports = root.find(j.ImportDeclaration, {
    source: { value: sourceImport },
  })
  const targetImports = root.find(j.ImportDeclaration, {
    source: { value: targetImport },
  })

  const hasSourceTypography =
    sourceImports.length > 0 && hasNamedImport(sourceImports, 'Typography')
  const hasTargetTypography =
    targetImports.length > 0 && hasNamedImport(targetImports, 'Typography')

  if (!hasSourceTypography && !hasTargetTypography) {
    return fileInfo.source
  }

  const typographyElements = findJSXElements(root, 'Typography', j)

  if (typographyElements.length === 0) {
    return fileInfo.source
  }

  const styles = createStyleContext()
  let migrated = 0
  const warnings = []

  typographyElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    // Use layered categorizeProps
    const {
      styleProps,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
      droppedProps,
      invalidStyles,
      hasManualFailures,
    } = categorizeProps(attributes, typographyPropConfig, j)

    // Skip transformation if manual intervention required (unless --unsafe)
    if (hasManualFailures && !options.unsafe) {
      console.warn(`⚠️  Typography element skipped - manual fixes required (${fileInfo.path})`)
      return
    }

    if (hasManualFailures && options.unsafe) {
      console.warn(
        `⚠️  Typography element: unsafe mode - proceeding with partial migration (${fileInfo.path})`,
      )
    }

    styles.addHelpers(newHelpers)

    // Warn about dropped font props
    for (const { name } of droppedProps) {
      if (TYPOGRAPHY_RESTRICTED_PROPS.managed.includes(name)) {
        warnings.push(`Typography: Dropped ${name} prop (managed internally by Nordlys Typography)`)
      }
    }

    // Handle color prop special case - Typography resolves color internally as string
    const typographyAttributes = attributes.filter((attr) => {
      if (attr.type !== 'JSXAttribute' || !attr.name) {
        return true
      }
      const propName = attr.name.name

      // Keep directProps that aren't being removed
      if (typographyPropConfig.directProps.includes(propName) && !propsToRemove.includes(attr)) {
        // Remap color path but keep as string literal
        if (propName === 'color' && attr.value?.type === 'StringLiteral') {
          const colorPath = getNordlysColorPath(attr.value.value)
          attr.value.value = colorPath
        }
        return true
      }

      return false
    })

    // Add transformed props
    for (const [name, value] of Object.entries(transformedProps)) {
      typographyAttributes.push(j.jsxAttribute(j.jsxIdentifier(name), value))
    }

    path.node.openingElement.attributes = typographyAttributes

    addElementComment(path, droppedProps, invalidStyles, j)
    migrated++

    const hasStyleProps = Object.keys(styleProps).length > 0

    if (wrap && hasStyleProps) {
      const styleName = `typography${index}`
      styles.addStyle(styleName, styleProps)

      const typographyElement = cloneElement(path.node, j)

      const styleValue = j.memberExpression(j.identifier('styles'), j.identifier(styleName))
      const viewElement = createViewWrapper(typographyElement, styleValue, j)

      j(path).replaceWith(viewElement)
    }
  })

  if (warnings.length > 0) {
    console.warn('⚠️  Typography migration warnings:')
    for (const w of warnings) {
      console.warn(`   ${w}`)
    }
  }

  // Only change imports if we migrated at least one element
  if (migrated === 0) {
    return fileInfo.source
  }

  // Remove Typography from source import (if it exists) and add to target
  if (hasSourceTypography) {
    removeNamedImport(sourceImports, 'Typography', j)
  }
  addNamedImport(root, targetImport, targetName, j)

  styles.applyToRoot(root, { wrap, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
