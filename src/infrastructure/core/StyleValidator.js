/**
 * StyleValidator - Generic composition of platform and target validation
 *
 * Validates style properties and values by composing:
 * - Platform validator: Platform constraints (e.g., React Native, React DOM)
 * - Target validator: Target design system constraints (e.g., design tokens, allowed values)
 *
 * This provides a unified validation interface while keeping concerns separated.
 */

export class StyleValidator {
  constructor(platformValidator, targetValidator, componentType = 'View') {
    this.componentType = componentType
    this.platform = platformValidator
    this.target = targetValidator
  }

  /**
   * Validate a style property and its value
   * Composes platform and target validation
   * Returns { isValid: boolean, reason?: string, category?: string }
   */
  validate(styleName, value) {
    // Platform validation: Is prop valid on this platform component?
    const platformResult = this.platform.validate(this.componentType, styleName, value)
    if (!platformResult.isValid) {
      return platformResult
    }

    // Target validation: Depends on value type
    if (value.type === 'StringLiteral' || value.type === 'Literal') {
      const isDimensionProp = this.platform.isDimensionProp(styleName)
      return this.target.validateLiteral(styleName, value, isDimensionProp)
    }

    if (value.type === 'MemberExpression') {
      return this.target.validateTokenExpression(styleName, value)
    }

    // Other types (expressions, numbers, etc.) pass through
    return { isValid: true }
  }

  /**
   * Validate a token value against a list of valid tokens
   * Used for standalone token validation (not part of style validation)
   * Delegates to target validator
   * Returns { isValid: boolean, reason?: string }
   */
  validateToken(value, validTokens, allowNumeric = false) {
    return this.target.validateToken(value, validTokens, allowNumeric)
  }
}
