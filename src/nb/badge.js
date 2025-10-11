// Migrate NativeBase Badge → Nordlys Badge (text badges) or View (indicator dots)
// See badge.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import {
  addTransformedProps,
  createAttribute,
  createStringAttribute,
  filterAttributes,
  hasAttribute,
} from '../helpers/jsx-attributes.js'
import { createSelfClosingElement, findJSXElements } from '../helpers/jsx-elements.js'
import { buildStyleValue, createViewWrapper } from '../helpers/jsx-transforms.js'
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
import { addElementComment, addOrExtendStyleSheet, categorizeProps } from './props.js'

// Badge prop mappings
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

const transformProps = {
  colorScheme: 'state',
}

const directPropsList = ['size', 'transparent', ...accessibility]

const dropPropsList = [
  ...allPseudoProps,
  // Badge-specific NativeBase props
  'variant',
]

// Extract text content from Badge children
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

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? 'native-base'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Badge'
  const targetName = options.targetName ?? 'Badge'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  // Default: true (wrap in View when style props exist)
  const wrap = options.wrap ?? true

  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Badge')) {
    return fileInfo.source
  }

  const badgeElements = findJSXElements(root, 'Badge', j)

  if (badgeElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  const elementStyles = []
  const usedTokenHelpers = new Set()
  const badgeProps = {
    styleProps,
    transformProps,
    directProps: directPropsList,
    dropProps: dropPropsList,
  }

  badgeElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    // Try to extract text content
    const textContent = extractTextContent(children)

    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
      droppedProps,
      invalidStyles,
    } = categorizeProps(attributes, badgeProps, j)

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    addElementComment(path, droppedProps, invalidStyles, j)

    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    // If no text content and has style props → indicator dot pattern, convert to View
    if (!textContent && hasStyleProps) {
      warnings.push(
        'Badge: No text content detected, converting to styled View (indicator dot pattern)',
      )

      // Convert to View with styles
      const styleName = `badge${index}`
      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, elementStyles, j, [])

      // Create self-closing View with style
      const viewElement = createSelfClosingElement(
        'View',
        [j.jsxAttribute(j.jsxIdentifier('style'), j.jsxExpressionContainer(styleValue))],
        j,
      )

      // Replace Badge with View
      j(path).replaceWith(viewElement)
      return
    }

    // If no text content and no style props → warn about missing text
    if (!textContent) {
      warnings.push('Badge: No text content or style props, cannot migrate to Nordlys Badge')
      return
    }

    // Has text content → migrate to Nordlys Badge
    const badgeAttributes = filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    addTransformedProps(badgeAttributes, transformedProps, j)

    // Add text prop with extracted content
    badgeAttributes.push(createAttribute('text', textContent, j))

    // Add default size if not specified
    if (!hasAttribute(badgeAttributes, 'size')) {
      badgeAttributes.push(createStringAttribute('size', 'md', j))
    }

    const badgeElement = createSelfClosingElement('Badge', badgeAttributes, j)

    // Wrap in View if style props exist
    if (wrap && hasStyleProps) {
      const styleName = `badge${index}`
      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, elementStyles, j, [])
      const viewElement = createViewWrapper(badgeElement, styleValue, j)
      j(path).replaceWith(viewElement)
    } else {
      j(path).replaceWith(badgeElement)
    }
  })

  if (warnings.length > 0) {
    console.warn('⚠️  Badge migration warnings:')
    for (const w of warnings) {
      console.warn(`   ${w}`)
    }
  }

  removeNamedImport(imports, 'Badge', j)
  addNamedImport(root, targetImport, targetName, j)

  if (wrap && elementStyles.length > 0) {
    addNamedImport(root, 'react-native', 'View', j)
    addNamedImport(root, 'react-native', 'StyleSheet', j)
    for (const h of usedTokenHelpers) {
      addNamedImport(root, tokenImport, h, j)
    }
  }

  if (wrap && elementStyles.length > 0) {
    addOrExtendStyleSheet(root, elementStyles, j)
  }

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
