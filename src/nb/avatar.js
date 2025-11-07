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

import { createNestedObject } from '@puns/shiftkit'
import {
  addTransformedProps,
  buildStyleValue,
  cloneElement,
  createAttribute,
  createViewWrapper,
  filterAttributes,
  getAttributeValue,
} from '@puns/shiftkit/jsx'
import { pipeline } from '../infrastructure/core/pipeline.js'
import {
  applyCollectedStyles,
  applyStyleSheet,
  checkImports,
  findElements,
  initStyleContext,
  manageImports,
  parseOptions,
  transformElements,
} from '../infrastructure/steps/pipeline-steps.js'
import { accessibility } from './configs/props-direct.js'
import { allPseudoProps } from './configs/props-drop.js'
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

// Avatar configuration
const avatarConfig = {
  sourceImport: '@hb-frontend/common/src/components',
  targetImport: '@hb-frontend/app/src/components/nordlys/Avatar',
  targetName: 'Avatar',
  tokenImport: '@hb-frontend/nordlys',
  wrap: true,
}

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

const DIRECT_PROPS = ['size', ...accessibility]

const avatarProps = {
  styleProps,
  transformProps: {},
  directProps: DIRECT_PROPS,
  dropProps: [
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
  ],
}

/**
 * Transform a single Avatar element to Nordlys Avatar
 *
 * Returns { element, warnings, tokenHelpers, styles } instead of mutating context.
 */
function transformAvatar(path, index, ctx) {
  const { j } = ctx
  const attributes = path.node.openingElement.attributes || []
  const warnings = []

  // Categorize props
  const categorized = categorizeProps(attributes, avatarProps, j)
  const { styleProps, inlineStyles, transformedProps, propsToRemove, usedTokenHelpers } =
    categorized

  // Extract Avatar props
  const iconName = getAttributeValue(attributes, 'iconName')
  const imageUri = getAttributeValue(attributes, 'imageUri')
  const imageSource = getAttributeValue(attributes, 'imageSource')
  const letters = getAttributeValue(attributes, 'letters')

  // Cannot migrate: letters prop not supported
  if (letters) {
    warnings.push('Avatar with letters prop cannot be migrated (not supported in Nordlys Avatar)')
    return { element: null, warnings }
  }

  // Build attributes
  const attrs = filterAttributes(attributes, {
    allow: DIRECT_PROPS.filter((prop) => !propsToRemove.includes(prop)),
  })
  addTransformedProps(attrs, transformedProps, j)

  // Convert iconName/imageUri/imageSource to Nordlys object props
  if (iconName) {
    attrs.push(createAttribute('icon', createNestedObject({ name: iconName, fill: 'blue' }, j), j))
  } else if (imageUri) {
    attrs.push(createAttribute('image', createNestedObject({ source: { uri: imageUri } }, j), j))
  } else if (imageSource) {
    attrs.push(createAttribute('image', createNestedObject({ source: imageSource }, j), j))
  }

  path.node.openingElement.attributes = attrs

  // Wrap in View if style props exist
  const hasStyles = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0
  const tempStyles = []

  if (avatarConfig.wrap && hasStyles) {
    const styleName = `avatar${index}`
    const element = cloneElement(path.node, j)
    const style = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
    const wrappedElement = createViewWrapper(element, style, j)

    return {
      element: wrappedElement,
      warnings,
      tokenHelpers: usedTokenHelpers,
      styles: tempStyles,
    }
  }

  return {
    element: path.node,
    warnings,
    tokenHelpers: usedTokenHelpers,
    styles: tempStyles,
  }
}

/**
 * Main transform - functional pipeline composition
 */
export default function transform(fileInfo, api, options) {
  return pipeline(fileInfo, api, options, [
    parseOptions(avatarConfig),
    checkImports('Avatar'),
    findElements('Avatar'),
    initStyleContext(),
    transformElements(transformAvatar),
    applyCollectedStyles(),
    manageImports('Avatar'),
    applyStyleSheet(),
  ])
}
