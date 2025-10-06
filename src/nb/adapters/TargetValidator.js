/**
 * TargetValidator - Validates against target design system constraints
 *
 * Checks if token values and prop usage are valid according to target rules.
 * This is target-level validation, specific to the target design system.
 *
 * Validates:
 * - Are space/radius tokens valid target tokens?
 * - Are semantic tokens used where numeric values are required?
 * - Are dimension props using numeric values (not semantic tokens)?
 */

import {
  isValidRadiusToken,
  isValidSpaceToken,
  RADIUS_TOKENS,
  SPACE_TOKENS,
} from '../models/target.js'

export class TargetValidator {
  constructor() {
    this.spaceTokens = SPACE_TOKENS
    this.radiusTokens = RADIUS_TOKENS
  }

  /**
   * Validate a literal value against target constraints
   * @param {string} styleName - Style property name
   * @param {object} value - AST node (StringLiteral or Literal)
   * @param {boolean} isDimensionProp - Is this a dimension prop?
   * @returns {{ isValid: boolean, reason?: string, category?: string }}
   */
  validateLiteral(_styleName, value, isDimensionProp) {
    // Literal with numeric value is valid (e.g., p={2} means 2dp directly)
    if (value.type === 'Literal' && typeof value.value === 'number') {
      return { isValid: true }
    }

    const val = String(value.value)

    // CSS "auto" is valid for margins (not a semantic token, but a CSS literal)
    if (val === 'auto') {
      return { isValid: true }
    }

    // Semantic tokens like "sm" aren't valid for dimension props that expect numbers
    if (isDimensionProp && this.spaceTokens.includes(val)) {
      return { isValid: false, reason: `"${val}"`, category: 'manual' }
    }

    return { isValid: true }
  }

  /**
   * Validate token member expression (space.md, radius.lg)
   * @param {string} styleName - Style property name
   * @param {object} value - AST MemberExpression node
   * @returns {{ isValid: boolean, reason?: string, category?: string }}
   */
  validateTokenExpression(styleName, value) {
    const tokenName = value.object?.name
    let property = value.property?.name

    if (!property && value.computed && value.property?.type === 'StringLiteral') {
      property = value.property.value
    }

    if (tokenName === 'space') {
      return this.validateSpaceToken(property, value.computed)
    }

    if (tokenName === 'radius' && (styleName.includes('radius') || styleName.includes('Radius'))) {
      return this.validateRadiusToken(property, value.computed)
    }

    return { isValid: true }
  }

  /**
   * Validate space token property
   */
  validateSpaceToken(property, isComputed) {
    // Numeric properties like space['4'] are invalid
    if (/^\d+$/.test(property)) {
      return { isValid: false, reason: `space['${property}']`, category: 'manual' }
    }

    // Check if it's a valid token name
    if (!isValidSpaceToken(property)) {
      const displayValue = isComputed ? `space['${property}']` : `space.${property}`
      return { isValid: false, reason: displayValue, category: 'manual' }
    }

    return { isValid: true }
  }

  /**
   * Validate radius token property
   */
  validateRadiusToken(property, isComputed) {
    // Numeric properties like radius['16'] are invalid
    if (/^\d+$/.test(property)) {
      return { isValid: false, reason: `radius['${property}']`, category: 'manual' }
    }

    // Check if it's a valid token name
    if (!isValidRadiusToken(property)) {
      const displayValue = isComputed ? `radius['${property}']` : `radius.${property}`
      return { isValid: false, reason: displayValue, category: 'manual' }
    }

    return { isValid: true }
  }

  /**
   * Validate a token value against a list of valid tokens
   * Used for standalone token validation (not part of style validation)
   * @returns {{ isValid: boolean, reason?: string }}
   */
  validateToken(value, validTokens, allowNumeric = false) {
    if (value.type === 'StringLiteral' || value.type === 'Literal') {
      const val = String(value.value)
      if (!validTokens.includes(val)) {
        return { isValid: false, reason: `"${val}"` }
      }
    } else if (value.type === 'NumericLiteral') {
      if (!allowNumeric) {
        return { isValid: false, reason: `{${value.value}}` }
      }
    } else if (value.type === 'JSXExpressionContainer') {
      const expr = value.expression
      if (expr.type === 'NumericLiteral') {
        if (!allowNumeric) {
          return { isValid: false, reason: `{${expr.value}}` }
        }
      } else if (expr.type === 'StringLiteral' || expr.type === 'Literal') {
        const val = String(expr.value)
        if (!validTokens.includes(val)) {
          return { isValid: false, reason: `{"${val}"}` }
        }
      }
    }

    return { isValid: true }
  }
}
