/**
 * NativeBase Alert to target Alert
 *
 * Compound components (Alert.Title, Alert.Description) extracted to props
 * Alert.Icon: removed (target handles automatically)
 * description prop: required (warning if missing)
 * Other children: skipped with warning
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
  createAttribute,
  createSelfClosingElement,
  createViewWrapper,
  filterAttributes,
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

const alertConfig = {
  sourceImport: 'native-base',
  targetImport: '@target/components/Alert',
  targetName: 'Alert',
  tokenImport: '@design-tokens',
  wrap: true,
}

const DIRECT_PROPS = ['status', ...accessibility]

const alertProps = {
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
  dropProps: [...allPseudoProps, 'variant', 'colorScheme'],
}

/* ===========================================================================
   Helpers
   =========================================================================== */

function extractMemberContent(child, object, property) {
  const elementName = child.openingElement?.name
  if (
    elementName?.type === 'JSXMemberExpression' &&
    elementName.object?.name === object &&
    elementName.property?.name === property
  ) {
    const children = child.children || []
    if (children.length > 0) {
      const textChild = children[0]
      if (textChild.type === 'JSXText') {
        return textChild.value.trim()
      }
      if (textChild.type === 'JSXExpressionContainer') {
        return textChild.expression
      }
    }
  }
  return null
}

/**
 * Extract Alert.Title and Alert.Description content from children
 */
function extractAlertContent(children) {
  const result = { title: null, description: null, otherChildren: [] }

  if (!children || children.length === 0) {
    return result
  }

  for (const child of children) {
    if (child.type !== 'JSXElement') {
      continue
    }

    const titleContent = extractMemberContent(child, 'Alert', 'Title')
    if (titleContent) {
      result.title = titleContent
      continue
    }

    const descContent = extractMemberContent(child, 'Alert', 'Description')
    if (descContent) {
      result.description = descContent
      continue
    }

    const elementName = child.openingElement?.name
    const isAlertIcon =
      elementName?.type === 'JSXMemberExpression' &&
      elementName.object?.name === 'Alert' &&
      elementName.property?.name === 'Icon'

    if (isAlertIcon) {
      continue
    }

    result.otherChildren.push(child)
  }

  return result
}

/* ===========================================================================
   Transform
   =========================================================================== */

function transformAlert(path, index, ctx) {
  const { j } = ctx
  const attributes = path.node.openingElement.attributes || []
  const children = path.node.children || []
  const warnings = []

  const categorized = categorizeProps(attributes, alertProps, j)
  const { styleProps, inlineStyles, transformedProps, propsToRemove, usedTokenHelpers } =
    categorized

  // Extract title/description from compound components
  const { title, description, otherChildren } = extractAlertContent(children)

  if (otherChildren.length > 0) {
    warnings.push('Alert: Contains unsupported children (buttons, custom content not supported)')
  }

  const attrs = filterAttributes(attributes, {
    allow: DIRECT_PROPS.filter((prop) => !propsToRemove.includes(prop)),
  })

  addTransformedProps(attrs, transformedProps, j)

  if (title) {
    attrs.push(createAttribute('title', title, j))
  }

  if (description) {
    attrs.push(createAttribute('description', description, j))
  } else {
    warnings.push('Alert: No description found - description is required in target Alert')
  }

  const element = createSelfClosingElement('Alert', attrs, j)

  // Wrap in View if style props exist
  const hasStyles = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0
  const tempStyles = []

  if (alertConfig.wrap && hasStyles) {
    const styleName = `alert${index}`
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
    element,
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
    parseOptions(alertConfig),
    checkImports('Alert'),
    findElements('Alert'),
    initStyleContext(),
    transformElements(transformAlert),
    applyCollectedStyles(),
    manageImports('Alert'),
    applyStyleSheet(),
  ])
}
