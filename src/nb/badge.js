/**
 * NativeBase Badge to target Badge
 *
 * Text badges: children extracted to text prop
 * Indicator dots (no text + style props): converted to styled View
 * colorScheme: renamed to state
 * Complex children: skipped (manual migration required)
 * Default size: "md"
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
  createStringAttribute,
  createViewWrapper,
  filterAttributes,
  hasAttribute,
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

const badgeConfig = {
  sourceImport: 'native-base',
  targetImport: '@target/components/Badge',
  targetName: 'Badge',
  tokenImport: '@design-tokens',
  wrap: true,
}

const DIRECT_PROPS = ['size', 'transparent', ...accessibility]

const badgeProps = {
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
  transformProps: {
    colorScheme: { targetName: 'state' },
  },
  directProps: DIRECT_PROPS,
  dropProps: [...allPseudoProps, 'variant'],
}

/* ===========================================================================
   Helpers
   =========================================================================== */

function extractTextContent(children) {
  if (!children || children.length === 0) {
    return null
  }

  // Single text node
  if (children.length === 1) {
    const child = children[0]
    if (child.type === 'JSXText') {
      const text = child.value.trim()
      return text ? text : null
    }
    if (child.type === 'JSXExpressionContainer') {
      return child.expression
    }
  }

  // Multiple children or complex - can't auto-convert
  return null
}

/* ===========================================================================
   Transform
   =========================================================================== */

function transformBadge(path, index, ctx) {
  const { j } = ctx
  const attributes = path.node.openingElement.attributes || []
  const children = path.node.children || []
  const warnings = []

  const categorized = categorizeProps(attributes, badgeProps, j)
  const { styleProps, inlineStyles, transformedProps, propsToRemove, usedTokenHelpers } =
    categorized

  // Try to extract text content
  const textContent = extractTextContent(children)
  const hasStyles = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0
  const tempStyles = []

  // Pattern 1: No text + style props → indicator dot, convert to View
  if (!textContent && hasStyles) {
    warnings.push(
      'Badge: No text content detected, converting to styled View (indicator dot pattern)',
    )

    const styleName = `badge${index}`
    const style = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])

    // Create self-closing View with style
    const viewElement = createSelfClosingElement(
      'View',
      [j.jsxAttribute(j.jsxIdentifier('style'), j.jsxExpressionContainer(style))],
      j,
    )

    return {
      element: viewElement,
      warnings,
      tokenHelpers: usedTokenHelpers,
      styles: tempStyles,
    }
  }

  // Pattern 2: No text + no styles → can't migrate
  if (!textContent) {
    warnings.push('Badge: No text content or style props, cannot migrate to target Badge')
    return {
      element: null,
      warnings,
      tokenHelpers: usedTokenHelpers,
      styles: tempStyles,
    }
  }

  // Pattern 3: Has text content → migrate to target Badge
  const attrs = filterAttributes(attributes, {
    allow: DIRECT_PROPS.filter((prop) => !propsToRemove.includes(prop)),
  })

  addTransformedProps(attrs, transformedProps, j)

  // Add text prop with extracted content
  attrs.push(createAttribute('text', textContent, j))

  // Add default size if not specified
  if (!hasAttribute(attrs, 'size')) {
    attrs.push(createStringAttribute('size', 'md', j))
  }

  const element = createSelfClosingElement('Badge', attrs, j)

  // Wrap in View if style props exist
  if (badgeConfig.wrap && hasStyles) {
    const styleName = `badge${index}`
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
    parseOptions(badgeConfig),
    checkImports('Badge'),
    findElements('Badge'),
    initStyleContext(),
    transformElements(transformBadge),
    applyCollectedStyles(),
    manageImports('Badge'),
    applyStyleSheet(),
  ])
}
