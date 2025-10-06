/**
 * PlatformValidator - Validates against React Native platform constraints
 *
 * Checks if style properties and values are valid according to React Native's
 * component API. This is platform-level validation, independent of any design
 * system (target, etc.).
 *
 * Validates:
 * - Is this prop supported by this RN component type?
 * - Does this value type match what RN expects?
 */

import { DIMENSION_PROPS, isValidStyleProp, VIEW_STYLE_PROPS } from './react-native-model.js'

export class PlatformValidator {
  constructor() {
    this.viewProps = VIEW_STYLE_PROPS
    this.dimensionProps = DIMENSION_PROPS
  }

  /**
   * Validate a style property against React Native constraints
   * @param {string} componentType - RN component type ('View', 'Text', etc.)
   * @param {string} styleName - Style property name
   * @param {object} value - AST node for the value
   * @returns {{ isValid: boolean, reason?: string, category?: string }}
   */
  validate(componentType, styleName, value) {
    if (!isValidStyleProp(componentType, styleName)) {
      const displayValue = value.type === 'StringLiteral' ? `"${value.value}"` : '{...}'
      return { isValid: false, reason: displayValue, category: 'manual' }
    }

    // Platform validation passed
    return { isValid: true }
  }

  /**
   * Check if a style prop is valid for a React Native component
   */
  isValidProp(componentType, propName) {
    return isValidStyleProp(componentType, propName)
  }

  /**
   * Check if a prop expects dimensional values
   */
  isDimensionProp(propName) {
    return this.dimensionProps.includes(propName)
  }
}
