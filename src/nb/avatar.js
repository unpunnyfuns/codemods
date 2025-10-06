/**
 * NativeBase/Common Avatar to Nordlys Avatar with object-based props
 *
 * iconName becomes icon={{ name: "...", fill: "blue" }}
 * imageUri becomes image={{ source: { uri: "..." } }}
 * imageSource becomes image={{ source: imageSource }}
 * letters prop NOT SUPPORTED (element skipped)
 * Style props extracted to View wrapper
 * Re-runnable on partially migrated files
 */

import {
  addNamedImport,
  createNestedObject,
  hasNamedImport,
  removeNamedImport,
} from '@puns/shiftkit'
import {
  addTransformedProps,
  buildStyleValue,
  cloneElement,
  createAttribute,
  createViewWrapper,
  filterAttributes,
  findJSXElements,
  getAttributeValue,
} from '@puns/shiftkit/jsx'
import { createStyleContext } from '../helpers/style-context.js'
import { accessibility } from './mappings/props-direct.js'
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
  text,
} from './mappings/props-style.js'
import { addElementComment, categorizeProps } from './props.js'

// styleProps: spacing, sizing, colors, borders, layout, flexbox, position (excludes 'size')
// transformProps: none
// directProps: size, accessibility
// dropProps: iconName, imageUri, imageSource, letters, lettersColor, isSecondaryColor, placeholder, resizeMode, source, pseudo-props
const styleProps = {
  ...spacing,
  ...sizing,
  ...color,
  ...border,
  ...layout,
  ...flexbox,
  ...position,
  ...text,
  ...extra,
}
delete styleProps.size // 'size' is an Avatar prop, not a style

const transformProps = {}

const directPropsList = ['size', ...accessibility]

const dropPropsList = [
  ...allPseudoProps, // _hover, _pressed, etc.
  'iconName', // Converted to icon object
  'imageUri', // Converted to image object
  'imageSource', // Converted to image object
  'letters', // NOT SUPPORTED
  'lettersColor', // Not supported
  'isSecondaryColor', // Not supported
  'placeholder', // Not supported
  'resizeMode', // Not supported
  'source', // Not supported
]

const avatarProps = {
  styleProps,
  transformProps,
  directProps: directPropsList,
  dropProps: dropPropsList,
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport
  const targetImport = options.targetImport
  const targetName = options.targetName ?? 'Avatar'
  const tokenImport = options.tokenImport
  const wrap = options.wrap ?? true

  if (!sourceImport) {
    throw new Error('--sourceImport is required (e.g., --sourceImport="@your/common/components")')
  }
  if (!targetImport) {
    throw new Error('--targetImport is required (e.g., --targetImport="@your/components/Avatar")')
  }
  if (!tokenImport) {
    throw new Error('--tokenImport is required (e.g., --tokenImport="@your/design-tokens")')
  }

  // Check for Avatar imports from both source and target (for re-running)
  const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  const targetImports = root.find(j.ImportDeclaration, { source: { value: targetImport } })

  const hasSourceAvatar = sourceImports.length > 0 && hasNamedImport(sourceImports, 'Avatar')
  const hasTargetAvatar = targetImports.length > 0 && hasNamedImport(targetImports, 'Avatar')

  if (!hasSourceAvatar && !hasTargetAvatar) {
    return fileInfo.source
  }

  // Find Avatar elements (works for both source and target since both use 'Avatar')
  const avatarElements = findJSXElements(root, 'Avatar', j)

  if (avatarElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  const styles = createStyleContext()
  let migrated = 0
  let hasViewWrappers = false

  avatarElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    // Extract Avatar props (iconName, imageUri, imageSource, letters)
    const iconName = getAttributeValue(attributes, 'iconName')
    const imageUri = getAttributeValue(attributes, 'imageUri')
    const imageSource = getAttributeValue(attributes, 'imageSource')
    const letters = getAttributeValue(attributes, 'letters')

    // Cannot migrate: letters prop not supported in Nordlys
    if (letters) {
      warnings.push('Avatar with letters prop cannot be migrated (not supported in Nordlys Avatar)')
      return
    }

    // Categorize props into style/transform/direct/drop buckets
    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers,
      droppedProps,
      invalidStyles,
      hasManualFailures,
    } = categorizeProps(attributes, avatarProps, j)

    // Skip if manual fixes needed (unless --unsafe mode)
    if (hasManualFailures) {
      const msg = options.unsafe
        ? `⚠️  Avatar: unsafe mode - proceeding with partial migration (${fileInfo.path})`
        : `⚠️  Avatar skipped - manual fixes required (${fileInfo.path})`
      console.warn(msg)
      if (!options.unsafe) {
        return
      }
    }

    // Track token helpers used
    styles.addHelpers(usedTokenHelpers)

    // Build Nordlys Avatar attributes
    const attrs = filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })
    addTransformedProps(attrs, transformedProps, j)

    // Convert iconName/imageUri/imageSource to Nordlys object props
    if (iconName) {
      attrs.push(
        createAttribute('icon', createNestedObject({ name: iconName, fill: 'blue' }, j), j),
      )
    } else if (imageUri) {
      attrs.push(createAttribute('image', createNestedObject({ source: { uri: imageUri } }, j), j))
    } else if (imageSource) {
      attrs.push(createAttribute('image', createNestedObject({ source: imageSource }, j), j))
    }

    path.node.openingElement.attributes = attrs

    addElementComment(path, droppedProps, invalidStyles, j)
    migrated++

    // Wrap in <View style={styles.avatarN}> if style props exist
    const hasStyles = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0
    if (wrap && hasStyles) {
      const styleName = `avatar${index}`
      const element = cloneElement(path.node, j)
      const tempStyles = []
      const style = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }
      const wrapper = createViewWrapper(element, style, j)
      j(path).replaceWith(wrapper)
      hasViewWrappers = true
    }
  })

  if (warnings.length > 0) {
    console.warn('⚠️  Avatar migration warnings:')
    const uniqueWarnings = [...new Set(warnings)]
    for (const w of uniqueWarnings) {
      console.warn(`   ${w}`)
    }
  }

  // Only change imports if we migrated at least one element
  if (migrated === 0) {
    return fileInfo.source
  }

  // Remove Avatar from source import (if it exists) and add to target
  if (hasSourceAvatar) {
    removeNamedImport(sourceImports, 'Avatar', j)
  }
  addNamedImport(root, targetImport, targetName, j)

  // Add View import if we created View wrappers with inline styles only
  if (hasViewWrappers && styles.length === 0) {
    addNamedImport(root, 'react-native', 'View', j)
  }

  styles.applyToRoot(root, { wrap, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
