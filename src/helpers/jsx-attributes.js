/**
 * jQuery-style helpers for JSX attribute manipulation
 */

/**
 * Find an attribute by name
 * @param {Array} attributes - JSX element attributes
 * @param {string} name - Attribute name to find
 * @returns {Object|null} - Attribute node or null
 */
export function findAttribute(attributes, name) {
  return (
    attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === name,
    ) || null
  )
}

/**
 * Check if element has an attribute
 * @param {Array} attributes - JSX element attributes
 * @param {string} name - Attribute name to check
 * @returns {boolean}
 */
export function hasAttribute(attributes, name) {
  return findAttribute(attributes, name) !== null
}

/**
 * Get attribute value AST node
 * @param {Array} attributes - JSX element attributes
 * @param {string} name - Attribute name
 * @returns {Object|null} - Value node or null
 */
export function getAttribute(attributes, name) {
  const attr = findAttribute(attributes, name)
  return attr ? attr.value : null
}

/**
 * Extract actual value from JSXAttribute value (unwraps JSXExpressionContainer)
 * @param {Object} attrValue - JSXAttribute value node
 * @returns {Object|null} - Unwrapped expression or literal
 */
export function extractAttributeValue(attrValue) {
  if (!attrValue) {
    return null
  }
  if (attrValue.type === 'JSXExpressionContainer') {
    return attrValue.expression
  }
  return attrValue
}

/**
 * Get attribute value with automatic unwrapping
 * @param {Array} attributes - JSX element attributes
 * @param {string} name - Attribute name
 * @returns {Object|null} - Unwrapped value or null
 */
export function getAttributeValue(attributes, name) {
  const attrValue = getAttribute(attributes, name)
  return extractAttributeValue(attrValue)
}

/**
 * Wrap value in JSXExpressionContainer if needed
 * @param {Object} value - Value to wrap
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSXExpressionContainer or StringLiteral
 */
export function toExpressionContainer(value, j) {
  if (!value) {
    return null
  }

  // If it's already wrapped, return as-is
  if (value.type === 'JSXExpressionContainer') {
    return value
  }

  // Wrap in expression container
  return j.jsxExpressionContainer(value)
}

/**
 * Filter attributes by allow/deny lists
 * @param {Array} attributes - JSX element attributes
 * @param {Object} options - Filter options
 * @param {Array} options.allow - Allow list (if provided, only these are kept)
 * @param {Array} options.deny - Deny list (these are removed)
 * @returns {Array} - Filtered attributes
 */
export function filterAttributes(attributes, { allow = null, deny = [] }) {
  return attributes.filter((attr) => {
    if (attr.type !== 'JSXAttribute' || !attr.name) {
      return false
    }

    const propName = attr.name.name

    // If allow list exists, prop must be in it
    if (allow !== null && !allow.includes(propName)) {
      return false
    }

    // Prop must not be in deny list
    if (deny.includes(propName)) {
      return false
    }

    return true
  })
}

/**
 * Check if any attribute matches name
 * @param {Array} attributes - JSX element attributes
 * @param {string} name - Attribute name
 * @returns {boolean}
 */
export function hasProp(attributes, name) {
  return hasAttribute(attributes, name)
}

/**
 * Create JSX attribute with automatic value wrapping
 * @param {string} name - Attribute name
 * @param {Object|string} value - Value (auto-wrapped in container if needed)
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSXAttribute node
 */
export function createAttribute(name, value, j) {
  if (typeof value === 'string') {
    return j.jsxAttribute(j.jsxIdentifier(name), j.stringLiteral(value))
  }

  const wrappedValue = toExpressionContainer(value, j)
  return j.jsxAttribute(j.jsxIdentifier(name), wrappedValue)
}

/**
 * Create JSX attribute with string literal value
 * @param {string} name - Attribute name
 * @param {string} value - String value
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSXAttribute node
 */
export function createStringAttribute(name, value, j) {
  return j.jsxAttribute(j.jsxIdentifier(name), j.stringLiteral(value))
}

/**
 * Create JSX attribute with object expression value
 * @param {string} name - Attribute name
 * @param {Object} properties - Object properties { key: value }
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSXAttribute node
 */
export function createObjectAttribute(name, properties, j) {
  const props = Object.entries(properties).map(([key, value]) => {
    const valueNode = typeof value === 'string' ? j.stringLiteral(value) : value
    return j.property('init', j.identifier(key), valueNode)
  })

  const objectExpr = j.objectExpression(props)
  return j.jsxAttribute(j.jsxIdentifier(name), j.jsxExpressionContainer(objectExpr))
}

/**
 * Set element attributes (replaces all)
 * @param {Object} element - JSX element or opening element
 * @param {Array} attrs - New attributes array
 */
export function setAttributes(element, attrs) {
  const openingElement = element.openingElement || element
  openingElement.attributes = attrs
}

/**
 * Add attributes to element
 * @param {Object} element - JSX element or opening element
 * @param {Array} attrs - Attributes to add
 */
export function addAttributes(element, attrs) {
  const openingElement = element.openingElement || element
  openingElement.attributes.push(...attrs)
}

/**
 * Remove attributes by name
 * @param {Array} attributes - Attributes array
 * @param {Array<string>} names - Attribute names to remove
 */
export function removeAttributes(attributes, names) {
  const nameSet = new Set(names)

  for (let i = attributes.length - 1; i >= 0; i--) {
    const attr = attributes[i]
    if (attr.type === 'JSXAttribute' && attr.name && nameSet.has(attr.name.name)) {
      attributes.splice(i, 1)
    }
  }
}

/**
 * Add transformed props from object to attributes array
 * @param {Array} attributes - Attributes array to add to
 * @param {Object} transformedProps - Map of prop name to value
 * @param {Object} j - jscodeshift API
 */
export function addTransformedProps(attributes, transformedProps, j) {
  for (const [name, value] of Object.entries(transformedProps)) {
    attributes.push(j.jsxAttribute(j.jsxIdentifier(name), value))
  }
}
