/**
 * jQuery-style helpers for JSX value conversions
 */

/**
 * Convert string to JSX expression container
 * @param {string} value - String value
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSXExpressionContainer with identifier
 */
export function stringToExpression(value, j) {
  return j.jsxExpressionContainer(j.identifier(value))
}

/**
 * Convert JSX expression container to string if possible
 * @param {Object} value - JSXExpressionContainer or literal
 * @returns {string|null} - String value or null
 */
export function expressionToString(value) {
  if (value.type === 'StringLiteral' || value.type === 'Literal') {
    return String(value.value)
  }

  if (value.type === 'JSXExpressionContainer') {
    const expr = value.expression
    if (expr.type === 'StringLiteral' || expr.type === 'Literal') {
      return String(expr.value)
    }
  }

  return null
}

/**
 * Ensure value is a proper literal node
 * @param {*} value - Value to convert
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Literal AST node
 */
export function ensureLiteral(value, j) {
  // Already a literal node
  if (value && typeof value === 'object' && value.type) {
    switch (value.type) {
      case 'StringLiteral':
      case 'NumericLiteral':
      case 'BooleanLiteral':
      case 'Literal':
        return value
      case 'JSXExpressionContainer':
        return ensureLiteral(value.expression, j)
      default:
        return value
    }
  }

  // Convert primitive to literal
  switch (typeof value) {
    case 'string':
      return j.stringLiteral(value)
    case 'number':
      return j.numericLiteral(value)
    case 'boolean':
      return j.booleanLiteral(value)
    default:
      return value
  }
}

/**
 * Ensure value is wrapped in JSXExpressionContainer if needed
 * @param {*} value - Value to wrap
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Wrapped value for JSX attribute
 */
export function ensureExpression(value, j) {
  // Already wrapped
  if (value && value.type === 'JSXExpressionContainer') {
    return value
  }

  // String literals can stay as-is in JSX
  if (value && (value.type === 'StringLiteral' || value.type === 'Literal')) {
    if (typeof value.value === 'string') {
      return value
    }
  }

  // Wrap everything else
  const literal = ensureLiteral(value, j)
  return j.jsxExpressionContainer(literal)
}

/**
 * Convert any value to JSX attribute value format
 * @param {*} value - Value to convert
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSX attribute value
 */
export function toAttributeValue(value, j) {
  if (typeof value === 'string') {
    return j.stringLiteral(value)
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return ensureExpression(value, j)
  }

  // Already an AST node
  if (value && typeof value === 'object' && value.type) {
    if (value.type === 'StringLiteral' || value.type === 'Literal') {
      return value
    }
    return j.jsxExpressionContainer(value)
  }

  return value
}

/**
 * Extract raw value from JSX attribute value
 * @param {Object} attrValue - JSX attribute value
 * @returns {*} - Raw value (string, number, boolean, or AST node)
 */
export function fromAttributeValue(attrValue) {
  if (!attrValue) {
    return null
  }

  if (attrValue.type === 'StringLiteral' || attrValue.type === 'Literal') {
    return attrValue.value
  }

  if (attrValue.type === 'JSXExpressionContainer') {
    const expr = attrValue.expression
    switch (expr.type) {
      case 'StringLiteral':
      case 'NumericLiteral':
      case 'BooleanLiteral':
      case 'Literal':
        return expr.value
      default:
        return expr
    }
  }

  return attrValue
}

/**
 * Check if value is a literal
 * @param {Object} value - Value to check
 * @returns {boolean}
 */
export function isLiteral(value) {
  if (!value || !value.type) {
    return false
  }

  return (
    value.type === 'StringLiteral' ||
    value.type === 'NumericLiteral' ||
    value.type === 'BooleanLiteral' ||
    value.type === 'Literal'
  )
}

/**
 * Check if value is an expression (not a literal)
 * @param {Object} value - Value to check
 * @returns {boolean}
 */
export function isExpression(value) {
  if (!value || !value.type) {
    return false
  }

  return !isLiteral(value) && value.type !== 'JSXExpressionContainer'
}

/**
 * Convert boolean to JSX boolean attribute format
 * @param {boolean|Object} value - Boolean value or AST node
 * @param {Object} j - jscodeshift API
 * @returns {Object|null} - JSXExpressionContainer or null for true
 */
export function toBooleanAttribute(value, j) {
  // For `prop={true}` or `prop`
  if (value === true || (value && value.type === 'BooleanLiteral' && value.value === true)) {
    return null // JSX uses prop without value for true
  }

  // For `prop={false}`
  if (value === false) {
    return j.jsxExpressionContainer(j.booleanLiteral(false))
  }

  if (value && value.type === 'BooleanLiteral') {
    return j.jsxExpressionContainer(value)
  }

  return value
}

/**
 * Convert object to JSX style object
 * @param {Object} styles - Plain object with styles
 * @param {Object} j - jscodeshift API
 * @returns {Object} - ObjectExpression for style prop
 */
export function toStyleObject(styles, j) {
  const properties = Object.entries(styles).map(([key, value]) => {
    const valueNode = ensureLiteral(value, j)
    return j.property('init', j.identifier(key), valueNode)
  })

  return j.objectExpression(properties)
}

/**
 * Parse string as number if possible
 * @param {string} value - String value
 * @returns {number|null} - Parsed number or null
 */
export function parseNumeric(value) {
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

/**
 * Convert numeric string to NumericLiteral
 * @param {string} value - String value
 * @param {Object} j - jscodeshift API
 * @returns {Object|null} - NumericLiteral or null
 */
export function stringToNumeric(value, j) {
  const num = parseNumeric(value)
  return num !== null ? j.numericLiteral(num) : null
}
