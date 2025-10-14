// Migrate NativeBase/Common Avatar -> Nordlys Avatar with object-based props
// See avatar.md for documentation

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

// Avatar prop mappings
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
delete styleProps.size

const transformProps = {}

const directPropsList = ['size', ...accessibility]

const dropPropsList = [
  ...allPseudoProps,
  'iconName',
  'imageUri',
  'imageSource',
  'letters',
  'lettersColor',
  'isSecondaryColor',
  'placeholder',
  'resizeMode',
  'source',
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

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Avatar'
  const targetName = options.targetName ?? 'Avatar'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  // Default: true (wrap in View when style props exist)
  const wrap = options.wrap ?? true

  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Avatar')) {
    return fileInfo.source
  }

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
    const iconNameValue = getAttributeValue(attributes, 'iconName')
    const imageUriValue = getAttributeValue(attributes, 'imageUri')
    const imageSourceValue = getAttributeValue(attributes, 'imageSource')
    const lettersValue = getAttributeValue(attributes, 'letters')

    // Cannot migrate: letters prop not supported in Nordlys
    if (lettersValue) {
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
    const avatarAttributes = filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })
    addTransformedProps(avatarAttributes, transformedProps, j)

    // Convert iconName/imageUri/imageSource to Nordlys object props
    if (iconNameValue) {
      avatarAttributes.push(
        createAttribute('icon', createNestedObject({ name: iconNameValue, fill: 'blue' }, j), j),
      )
    } else if (imageUriValue) {
      avatarAttributes.push(
        createAttribute('image', createNestedObject({ source: { uri: imageUriValue } }, j), j),
      )
    } else if (imageSourceValue) {
      avatarAttributes.push(
        createAttribute('image', createNestedObject({ source: imageSourceValue }, j), j),
      )
    }

    path.node.openingElement.attributes = avatarAttributes

    addElementComment(path, droppedProps, invalidStyles, j)
    migrated++

    // Wrap in <View style={styles.avatarN}> if style props exist
    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0
    if (wrap && hasStyleProps) {
      const styleName = `avatar${index}`
      const avatarElement = cloneElement(path.node, j)
      const tempStyles = []
      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }
      const viewElement = createViewWrapper(avatarElement, styleValue, j)
      j(path).replaceWith(viewElement)
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

  removeNamedImport(imports, 'Avatar', j)
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
