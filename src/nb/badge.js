// Migrate NativeBase Badge -> Nordlys Badge (text badges) or View (indicator dots)
// See badge.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import {
  addTransformedProps,
  buildStyleValue,
  createAttribute,
  createSelfClosingElement,
  createStringAttribute,
  createViewWrapper,
  filterAttributes,
  findJSXElements,
  hasAttribute,
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

const dropPropsList = [...allPseudoProps, 'variant']

const badgeProps = {
  styleProps,
  transformProps,
  directProps: directPropsList,
  dropProps: dropPropsList,
}

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

  // Check for Badge imports from both source and target (for re-running)
  const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  const targetImports = root.find(j.ImportDeclaration, { source: { value: targetImport } })

  const hasSourceBadge = sourceImports.length > 0 && hasNamedImport(sourceImports, 'Badge')
  const hasTargetBadge = targetImports.length > 0 && hasNamedImport(targetImports, 'Badge')

  if (!hasSourceBadge && !hasTargetBadge) {
    return fileInfo.source
  }

  const badgeElements = findJSXElements(root, 'Badge', j)

  if (badgeElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  const styles = createStyleContext()
  let migrated = 0

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
      usedTokenHelpers,
      droppedProps,
      invalidStyles,
      hasManualFailures,
    } = categorizeProps(attributes, badgeProps, j)

    // Skip if manual fixes needed (unless --unsafe mode)
    if (hasManualFailures) {
      const msg = options.unsafe
        ? `⚠️  Badge: unsafe mode - proceeding with partial migration (${fileInfo.path})`
        : `⚠️  Badge skipped - manual fixes required (${fileInfo.path})`
      console.warn(msg)
      if (!options.unsafe) {
        return
      }
    }

    styles.addHelpers(usedTokenHelpers)

    addElementComment(path, droppedProps, invalidStyles, j)
    migrated++

    const hasStyles = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    // If no text content and has style props -> indicator dot pattern, convert to View
    if (!textContent && hasStyles) {
      warnings.push(
        'Badge: No text content detected, converting to styled View (indicator dot pattern)',
      )

      // Convert to View with styles
      const styleName = `badge${index}`
      const tempStyles = []
      const style = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }

      // Create self-closing View with style
      const element = createSelfClosingElement(
        'View',
        [j.jsxAttribute(j.jsxIdentifier('style'), j.jsxExpressionContainer(style))],
        j,
      )

      // Replace Badge with View
      j(path).replaceWith(element)
      return
    }

    // If no text content and no style props -> warn about missing text
    if (!textContent) {
      warnings.push('Badge: No text content or style props, cannot migrate to Nordlys Badge')
      return
    }

    // Has text content -> migrate to Nordlys Badge
    const attrs = filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
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
    if (wrap && hasStyles) {
      const styleName = `badge${index}`
      const tempStyles = []
      const style = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }
      const wrapper = createViewWrapper(element, style, j)
      j(path).replaceWith(wrapper)
    } else {
      j(path).replaceWith(element)
    }
  })

  if (warnings.length > 0) {
    console.warn('⚠️  Badge migration warnings:')
    const uniqueWarnings = [...new Set(warnings)]
    for (const w of uniqueWarnings) {
      console.warn(`   ${w}`)
    }
  }

  // Only change imports if we migrated at least one element
  if (migrated === 0) {
    return fileInfo.source
  }

  // Remove Badge from source import (if it exists) and add to target
  if (hasSourceBadge) {
    removeNamedImport(sourceImports, 'Badge', j)
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
