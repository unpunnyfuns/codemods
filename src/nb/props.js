/**
 * NativeBase-specific prop categorization and transformation utilities
 * Handles prop mapping, StyleSheet extraction, and token remapping
 *
 * This is now a facade over the adapter architecture:
 * - PropProcessor: Generic builder for prop categorization (infrastructure/)
 * - ComposedTokenConverter: Token conversion (adapters/)
 * - ComposedValidator: Validation (adapters/)
 *
 * Architecture:
 * - infrastructure/: Generic pipeline and utilities
 * - adapters/: Migration-specific implementations
 * - models/: Source and target data models
 */

import { ComposedValidator } from './adapters/ComposedValidator.js'
import { RADIUS_TOKENS, SPACE_TOKENS } from './models/target.js'

/* ===========================================================================
   Exports
   =========================================================================== */

export { categorizeProps } from './adapters/categorizeProps.js'

/* ===========================================================================
   Validation
   =========================================================================== */

export const validSpaceTokens = SPACE_TOKENS
export const validRadiusTokens = RADIUS_TOKENS

/**
 * Validate a value against a list of valid token names
 * Returns { isValid: boolean, reason?: string }
 *
 * Facade over ComposedValidator.validateToken()
 */
export function validateToken(value, validTokens, allowNumeric = false) {
  const validator = new ComposedValidator()
  return validator.validateToken(value, validTokens, allowNumeric)
}

/* ===========================================================================
   Value Mapping
   =========================================================================== */

export function applyValueMap(value, valueMap, j) {
  if (!valueMap) {
    return value
  }

  if (value.type === 'StringLiteral' || value.type === 'Literal') {
    const mappedValue = valueMap[value.value]
    if (mappedValue !== undefined) {
      return typeof mappedValue === 'number'
        ? j.numericLiteral(mappedValue)
        : j.stringLiteral(mappedValue)
    }
  } else if (value.type === 'NumericLiteral') {
    const mappedValue = valueMap[value.value]
    if (mappedValue !== undefined) {
      return typeof mappedValue === 'number'
        ? j.numericLiteral(mappedValue)
        : j.stringLiteral(mappedValue)
    }
  }

  return value
}

/**
 * Transform a prop value using priority chain
 *
 * Facade over PropProcessor.transformValue() + TokenConverter
 * Kept for backward compatibility
 */
export function transformProp(value, config, j) {
  if (!value) {
    return { value, isTokenHelper: false, tokenHelper: null }
  }

  const processor = new PropProcessor(j, { styleProps: {} })
  const result = processor.transformValue(value, config)

  return {
    value: result.value,
    isTokenHelper: result.isTokenHelper,
    tokenHelper: result.helperUsed,
  }
}

/* ===========================================================================
   Formatting
   =========================================================================== */

function formatProp(attr, _j) {
  if (!attr.value) {
    return '{true}'
  }

  if (attr.value.type === 'StringLiteral') {
    return `"${attr.value.value}"`
  }

  if (attr.value.type === 'JSXExpressionContainer') {
    const expr = attr.value.expression

    if (expr.type === 'BooleanLiteral') {
      return `{${expr.value}}`
    }
    if (expr.type === 'NumericLiteral') {
      return `{${expr.value}}`
    }
    if (expr.type === 'StringLiteral') {
      return `{"${expr.value}"}`
    }
    if (expr.type === 'Identifier') {
      return `{${expr.name}}`
    }
    if (expr.type === 'ObjectExpression') {
      return '{...}'
    }
    if (expr.type === 'ArrayExpression') {
      return '{[...]}'
    }
    if (expr.type === 'ArrowFunctionExpression' || expr.type === 'FunctionExpression') {
      return '{() => ...}'
    }
    if (expr.type === 'CallExpression') {
      return '{func(...)}'
    }

    return '{...}'
  }

  return '{...}'
}

/* ===========================================================================
   Comments
   =========================================================================== */

export function addElementComment(path, droppedProps, invalidStyles, j) {
  if (droppedProps.length === 0 && invalidStyles.length === 0) {
    return
  }

  const lines = []

  if (droppedProps.length > 0) {
    lines.push('Dropped during migration (not supported in React Native):')
    for (const { name, attr } of droppedProps) {
      const value = formatProp(attr, j)
      lines.push(`  ${name}=${value}`)
    }
  }

  if (invalidStyles.length > 0) {
    if (lines.length > 0) {
      lines.push('')
    }
    lines.push('Invalid styles (passed through but may cause runtime errors):')
    for (const { styleName, value } of invalidStyles) {
      lines.push(`  ${styleName}=${value}`)
    }
  }

  const commentText = ` ${lines.join('\n')} `
  const comment = j.commentBlock(commentText, true, false)

  // Create JSX comment: {/* ... */}
  const jsxEmptyExpr = j.jsxEmptyExpression()
  jsxEmptyExpr.comments = [comment]
  const jsxComment = j.jsxExpressionContainer(jsxEmptyExpr)

  // Insert comment before the element with proper spacing
  const parent = path.parent.node
  if (parent.type === 'JSXElement' || parent.type === 'JSXFragment') {
    const children = parent.children
    const index = children.indexOf(path.node)
    if (index !== -1) {
      children.splice(index, 0, j.jsxText('\n      '), jsxComment, j.jsxText('\n      '))
    }
  }
}

/**
 * Get human-readable explanation for why a style prop is invalid
 */
function getStyleInvalidReason(styleName, value) {
  // Text-only props
  if (
    [
      'textAlign',
      'textAlignVertical',
      'color',
      'fontFamily',
      'fontSize',
      'fontStyle',
      'fontWeight',
      'letterSpacing',
      'lineHeight',
      'textDecorationLine',
      'textTransform',
      'fontVariant',
      'textShadowOffset',
      'textShadowRadius',
      'textShadowColor',
      'writingDirection',
      'includeFontPadding',
      'textBreakStrategy',
    ].includes(styleName)
  ) {
    return 'Text-only prop (move to child Text component or keep as NativeBase component)'
  }

  // Check for invalid token values
  if (validSpaceTokens.includes(value.replace(/"/g, ''))) {
    return 'Semantic token not valid for dimension prop (use numeric value)'
  }

  return 'Not supported on React Native View'
}

/**
 * Add TODO comment before element that requires manual migration
 * This documents elements that were skipped and need manual fixing
 */
export function addTodoComment(path, componentName, invalidStyles, j) {
  const lines = [
    `TODO: ${componentName} - manual migration required`,
    '',
    'This element could not be automatically migrated. Reasons:',
  ]

  if (invalidStyles.length > 0) {
    for (const item of invalidStyles) {
      // Handle both plain strings and { styleName, value } objects
      if (typeof item === 'string') {
        lines.push(`  - ${item}`)
      } else {
        const { styleName, value } = item
        const reason = getStyleInvalidReason(styleName, value)
        lines.push(`  ${styleName}=${value}`)
        lines.push(`    Reason: ${reason}`)
      }
    }
  }

  lines.push('')
  lines.push('Action required: Fix the issues above or migrate this element manually.')

  const commentText = ` ${lines.join('\n')} `
  const comment = j.commentBlock(commentText, true, false)

  // Create JSX comment: {/* ... */}
  const jsxEmptyExpr = j.jsxEmptyExpression()
  jsxEmptyExpr.comments = [comment]
  const jsxComment = j.jsxExpressionContainer(jsxEmptyExpr)

  // Insert comment before the element with proper spacing
  const parent = path.parent.node
  if (parent.type === 'JSXElement' || parent.type === 'JSXFragment') {
    const children = parent.children
    const index = children.indexOf(path.node)
    if (index !== -1) {
      children.splice(index, 0, j.jsxText('\n      '), jsxComment, j.jsxText('\n      '))
    }
  }
}
