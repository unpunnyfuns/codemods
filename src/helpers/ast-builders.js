/**
 * jQuery-style helpers for building AST nodes
 */

/**
 * Create object expression from plain object
 * @param {Object} props - Plain object { key: value }
 * @param {Object} j - jscodeshift API
 * @returns {Object} - ObjectExpression node
 *
 * @example
 * createObjectExpression({ name: nameValue, fill: 'blue' }, j)
 * // Returns: { name: nameValue, fill: 'blue' }
 */
export function createObjectExpression(props, j) {
  const properties = Object.entries(props).map(([key, value]) => {
    // Convert string values to string literals
    const valueNode = typeof value === 'string' ? j.stringLiteral(value) : value
    return j.property('init', j.identifier(key), valueNode)
  })

  return j.objectExpression(properties)
}

/**
 * Create member expression (e.g., styles.button or obj.prop.nested)
 * @param {string|Array} path - Object path as string or array ['styles', 'button']
 * @param {Object} j - jscodeshift API
 * @returns {Object} - MemberExpression node
 *
 * @example
 * createMemberExpression('styles.button', j)
 * createMemberExpression(['styles', 'button'], j)
 * // Both return: styles.button
 */
export function createMemberExpression(path, j) {
  const parts = Array.isArray(path) ? path : path.split('.')

  if (parts.length === 0) {
    throw new Error('createMemberExpression requires at least one part')
  }

  if (parts.length === 1) {
    return j.identifier(parts[0])
  }

  let expr = j.identifier(parts[0])
  for (let i = 1; i < parts.length; i++) {
    expr = j.memberExpression(expr, j.identifier(parts[i]))
  }

  return expr
}

/**
 * Create array expression from array of values
 * @param {Array} items - Array of values or AST nodes
 * @param {Object} j - jscodeshift API
 * @returns {Object} - ArrayExpression node
 */
export function createArrayExpression(items, j) {
  const elements = items.map((item) => {
    switch (typeof item) {
      case 'string':
        return j.stringLiteral(item)
      case 'number':
        return j.numericLiteral(item)
      case 'boolean':
        return j.booleanLiteral(item)
      default:
        return item
    }
  })

  return j.arrayExpression(elements)
}

/**
 * Create property for object expression
 * @param {string} key - Property key
 * @param {*} value - Property value (auto-converted if primitive)
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Property node
 */
export function createProperty(key, value, j) {
  let valueNode

  switch (typeof value) {
    case 'string':
      valueNode = j.stringLiteral(value)
      break
    case 'number':
      valueNode = j.numericLiteral(value)
      break
    case 'boolean':
      valueNode = j.booleanLiteral(value)
      break
    default:
      valueNode = value
  }

  return j.property('init', j.identifier(key), valueNode)
}

/**
 * Create nested object expression
 * @param {Object} obj - Nested plain object
 * @param {Object} j - jscodeshift API
 * @returns {Object} - ObjectExpression node
 *
 * @example
 * createNestedObject({ image: { source: { uri: uriValue } } }, j)
 */
export function createNestedObject(obj, j) {
  if (typeof obj !== 'object' || obj === null || obj.type) {
    // If it's a primitive or already an AST node, return as-is
    return obj
  }

  const properties = Object.entries(obj).map(([key, value]) => {
    let valueNode

    // Recursively handle nested objects
    if (typeof value === 'object' && value !== null && !value.type) {
      valueNode = createNestedObject(value, j)
    } else {
      switch (typeof value) {
        case 'string':
          valueNode = j.stringLiteral(value)
          break
        case 'number':
          valueNode = j.numericLiteral(value)
          break
        case 'boolean':
          valueNode = j.booleanLiteral(value)
          break
        default:
          valueNode = value
      }
    }

    return j.property('init', j.identifier(key), valueNode)
  })

  return j.objectExpression(properties)
}

/**
 * Create template literal
 * @param {Array} parts - Template parts (strings and expressions)
 * @param {Object} j - jscodeshift API
 * @returns {Object} - TemplateLiteral node
 *
 * @example
 * createTemplateLiteral(['Hello ', nameExpr, '!'], j)
 * // Returns: `Hello ${name}!`
 */
export function createTemplateLiteral(parts, j) {
  const quasis = []
  const expressions = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    if (typeof part === 'string') {
      const isLast = i === parts.length - 1
      quasis.push(j.templateElement({ raw: part, cooked: part }, isLast))
    } else {
      expressions.push(part)
      if (i < parts.length - 1 && typeof parts[i + 1] !== 'string') {
        quasis.push(j.templateElement({ raw: '', cooked: '' }, false))
      }
    }
  }

  return j.templateLiteral(quasis, expressions)
}
