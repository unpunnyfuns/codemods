/**
 * Utilities for extracting values from JSX elements and children
 */

/**
 * Extract a prop value from a nested JSX element
 *
 * Example: extractPropFromJSXElement(iconElement, 'Icon', 'name', j)
 * From: leftIcon={<Icon name="Plus" color="red" />}
 * Returns: "Plus" (string) or AST expression node
 *
 * @param {object} element - The JSX element to extract from
 * @param {string} expectedElementName - Expected element name (e.g., 'Icon')
 * @param {string} propName - Prop name to extract (e.g., 'name')
 * @param {object} j - jscodeshift API
 * @returns {string|object|null} - String literal value, AST expression, or null if not found
 */
export function extractPropFromJSXElement(element, expectedElementName, propName, j) {
  if (!element || element.type !== 'JSXElement') return null

  const openingElement = element.openingElement
  if (!openingElement || !openingElement.name || openingElement.name.name !== expectedElementName) {
    return null
  }

  const attr = openingElement.attributes.find(
    (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === propName,
  )

  if (!attr) return null

  // Handle string literals (Literal in JSX) and StringLiteral
  if (attr.value.type === 'Literal' || attr.value.type === 'StringLiteral') {
    return attr.value.value
  }
  // Handle expression containers
  else if (attr.value.type === 'JSXExpressionContainer') {
    return attr.value.expression
  }

  return null
}

/**
 * Extract a simple child from children array with complexity detection
 *
 * Filters whitespace-only text nodes, detects multiple significant children or JSX elements,
 * validates expression types against allowlist.
 *
 * Example: extractSimpleChild(children, j, {
 *   allowedExpressionTypes: ['Identifier', 'CallExpression', 'MemberExpression']
 * })
 *
 * @param {array} children - Array of JSX children nodes
 * @param {object} j - jscodeshift API
 * @param {object} options - Configuration options
 * @param {string[]} options.allowedExpressionTypes - Allowed expression node types (default: common safe types)
 * @returns {object} - { value: ASTNode|null, isComplex: boolean }
 */
export function extractSimpleChild(children, j, options = {}) {
  const {
    allowedExpressionTypes = ['Identifier', 'CallExpression', 'MemberExpression', 'StringLiteral'],
  } = options

  // Filter out whitespace-only text nodes
  const significantChildren = children.filter((child) => {
    if (child.type === 'JSXText') {
      return child.value.trim().length > 0
    }
    return true
  })

  // No children
  if (significantChildren.length === 0) {
    return { value: null, isComplex: false }
  }

  // Multiple children = complex
  if (significantChildren.length > 1) {
    return { value: null, isComplex: true }
  }

  const child = significantChildren[0]

  // Simple string literal
  if (child.type === 'JSXText') {
    return { value: j.stringLiteral(child.value.trim()), isComplex: false }
  }

  // Expression container with simple expression
  if (child.type === 'JSXExpressionContainer') {
    const expr = child.expression

    // Check if expression type is allowed
    if (allowedExpressionTypes.includes(expr.type)) {
      return { value: expr, isComplex: false }
    }

    // Disallowed expression type = complex
    return { value: null, isComplex: true }
  }

  // JSX elements are complex
  if (child.type === 'JSXElement') {
    return { value: null, isComplex: true }
  }

  // Unknown child type
  return { value: null, isComplex: false }
}
