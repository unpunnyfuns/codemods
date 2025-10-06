/**
 * TokenConverter - Generic token conversion infrastructure
 *
 * Provides pluggable token conversion across different AST node types.
 * Subclasses register conversion handlers for specific token types.
 *
 * Example:
 *   class MyTokenConverter extends TokenConverter {
 *     constructor() {
 *       super()
 *       this.registerHandler('space', mySpaceConverter)
 *       this.registerHandler('color', myColorConverter)
 *     }
 *   }
 */

import { transformStringsInExpression } from '../jsx.js'
import { buildTokenPath } from './token-helpers.js'

export class TokenConverter {
  constructor(logger = null) {
    // Map of token types to their conversion functions
    // Subclasses populate this via registerHandler()
    this.converters = {}
    this.logger = logger
  }

  /**
   * Register a conversion handler for a token type
   * @param {string} tokenType - Type of token (e.g., 'space', 'color', 'radius')
   * @param {Function} converterFn - Function that converts token path: (tokenPath: string) => string
   */
  registerHandler(tokenType, converterFn) {
    this.converters[tokenType] = converterFn
  }

  /**
   * Convert a value to use the appropriate token helper
   * Returns { converted: boolean, value: AST, helperUsed: string|null }
   */
  convert(value, helperType, j) {
    if (!value) {
      return { converted: false, value, helperUsed: null }
    }

    // Route to appropriate handler based on value type
    if (value.type === 'StringLiteral' || value.type === 'Literal') {
      return this.convertLiteral(value, helperType, j)
    }

    if (value.type === 'MemberExpression' && helperType === 'color') {
      return this.convertColorMemberExpression(value, helperType, j)
    }

    if (value.type === 'ConditionalExpression' || value.type === 'LogicalExpression') {
      return this.convertExpression(value, helperType, j)
    }

    // Pass through other types unchanged
    return { converted: false, value, helperUsed: null }
  }

  /**
   * Check if a string is a literal color (e.g., "transparent", "red")
   * Subclasses can override this for custom logic
   */
  isLiteralColor(_tokenPath) {
    return false
  }

  /**
   * Convert a string literal value
   */
  convertLiteral(value, helperType, j) {
    const tokenPath = value.value

    if (typeof tokenPath !== 'string') {
      return { converted: false, value, helperUsed: null }
    }

    // Numeric strings become numeric literals, not tokens
    if (/^\d+$/.test(tokenPath)) {
      const numericValue = Number.parseInt(tokenPath, 10)
      return { converted: false, value: j.numericLiteral(numericValue), helperUsed: null }
    }

    // CSS "auto" value for margins remains as string literal
    if (helperType === 'space' && tokenPath === 'auto') {
      return { converted: false, value: j.stringLiteral('auto'), helperUsed: null }
    }

    // Literal colors (like "transparent") remain as string literals
    if (helperType === 'color' && this.isLiteralColor(tokenPath)) {
      return { converted: false, value: j.stringLiteral(tokenPath), helperUsed: null }
    }

    const converter = this.converters[helperType]
    if (!converter) {
      return { converted: false, value, helperUsed: null }
    }

    const convertedPath = converter(tokenPath)
    this.logger?.tokenConversion(helperType, tokenPath, convertedPath)
    const ast = buildTokenPath(j, helperType, convertedPath)

    return { converted: true, value: ast, helperUsed: helperType }
  }

  /**
   * Convert a MemberExpression like color.gray['100']
   * Can be overridden for custom member expression handling
   */
  convertColorMemberExpression(value, helperType, j) {
    // Walk the MemberExpression tree to extract the full path
    const parts = []
    let node = value

    while (node && node.type === 'MemberExpression') {
      if (node.computed && node.property?.type === 'StringLiteral') {
        parts.unshift(node.property.value)
      } else if (!node.computed && node.property?.type === 'Identifier') {
        parts.unshift(node.property.name)
      }
      node = node.object
    }

    // Skip if root is not 'color'
    if (node?.type === 'Identifier' && node.name === 'color') {
      const colorPath = parts.join('.')
      const converter = this.converters[helperType]
      if (!converter) {
        return { converted: false, value, helperUsed: null }
      }

      const mappedPath = converter(colorPath)
      const ast = buildTokenPath(j, helperType, mappedPath)

      return { converted: true, value: ast, helperUsed: helperType }
    }

    return { converted: false, value, helperUsed: null }
  }

  /**
   * Convert conditional/logical expressions by transforming string literals within them
   */
  convertExpression(value, helperType, j) {
    const transformedValue = transformStringsInExpression(
      value,
      (str) => this.convertString(str, helperType, j),
      j,
    )

    return { converted: true, value: transformedValue, helperUsed: helperType }
  }

  /**
   * Convert a string value within an expression
   * Used as callback for transformStringsInExpression
   */
  convertString(str, helperType, j) {
    // Numeric strings become numeric literals
    if (/^\d+$/.test(str)) {
      return j.numericLiteral(Number.parseInt(str, 10))
    }

    // CSS "auto" value for margins remains as string literal
    if (helperType === 'space' && str === 'auto') {
      return j.stringLiteral('auto')
    }

    const converter = this.converters[helperType]
    if (!converter) {
      return j.stringLiteral(str)
    }

    const tokenPath = converter(str)
    return buildTokenPath(j, helperType, tokenPath)
  }
}
