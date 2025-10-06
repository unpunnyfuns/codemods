/**
 * Helpers for building AST nodes
 */

/**
 * Create nested object expression
 *
 * @example
 * createNestedObject({ image: { source: { uri: uriValue } } }, j)
 */
export function createNestedObject(obj, j) {
  if (typeof obj !== 'object' || obj === null || obj.type) {
    return obj
  }

  const properties = Object.entries(obj).map(([key, value]) => {
    let valueNode

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
