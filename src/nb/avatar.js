/**
 * NativeBase/Common Avatar to target Avatar with object-based props
 *
 * iconName becomes icon={{ name: "...", fill: "blue" }}
 * imageUri becomes image={{ source: { uri: "..." } }}
 * imageSource becomes image={{ source: imageSource }}
 * letters prop NOT SUPPORTED (element skipped)
 * Style props extracted to View wrapper
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
import { createNestedObject } from '../lib/ast-builders.js'
import {
  addTransformedProps,
  buildStyleValue,
  cloneElement,
  createAttribute,
  createViewWrapper,
  filterAttributes,
  getAttributeValue,
} from '../lib/jsx.js'
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

/* ===========================================================================
   Configuration
   =========================================================================== */

const avatarConfig = {
  sourceImport: '@source/components',
  targetImport: '@target/components/Avatar',
  targetName: 'Avatar',
  tokenImport: '@design-tokens',
  wrap: true,
}

const STYLE_PROPS = {
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
delete STYLE_PROPS.size // 'size' is an Avatar prop, not a style

const DIRECT_PROPS = ['size', ...accessibility]

const avatarProps = {
  styleProps: STYLE_PROPS,
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

/* ===========================================================================
   Transform
   =========================================================================== */

function transformAvatar(path, index, ctx) {
  const { j } = ctx
  const attributes = path.node.openingElement.attributes || []
  const warnings = []

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
    warnings.push('Avatar with letters prop cannot be migrated (not supported in target Avatar)')
    return { element: null, warnings }
  }

  const attrs = filterAttributes(attributes, {
    allow: DIRECT_PROPS.filter((prop) => !propsToRemove.includes(prop)),
  })
  addTransformedProps(attrs, transformedProps, j)

  // Convert iconName/imageUri/imageSource to target object props
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

/* ===========================================================================
   Pipeline
   =========================================================================== */

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
