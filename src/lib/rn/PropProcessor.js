/**
 * PropProcessor - Generic builder pattern for prop categorization
 *
 * Eliminates the gordian knot of 7-parameter functions by using instance state.
 * Provides clear, linear flow: process → processAttribute → addStyleProp
 *
 * This is a generic implementation that accepts validator and converter as dependencies.
 * Subclasses or factory functions provide migration-specific implementations.
 */

import { shouldExtractToStyleSheet } from './rn.js'

export class PropProcessor {
  constructor(j, mappings, options = {}) {
    // Dependencies
    this.j = j
    this.mappings = mappings
    this.tokenConverter = options.converter || null
    this.validator = options.validator || null
    this.logger = options.logger || null

    // Output buckets (internal state - no more passing 7 parameters!)
    this.styleProps = {}
    this.inlineStyles = {}
    this.transformedProps = {}
    this.propsToRemove = []
    this.usedTokenHelpers = new Set()
    this.droppedProps = []
    this.invalidStyles = []
    this.manualFailures = []
    this.existingStyleReferences = []
  }

  /**
   * Main entry point - process all attributes
   * Returns the categorized props object
   */
  process(attributes) {
    for (const attr of attributes) {
      this.processAttribute(attr)
    }
    return this.getResult()
  }

  /**
   * Process a single attribute - route to appropriate handler
   */
  processAttribute(attr) {
    // Skip non-attributes
    if (attr.type !== 'JSXAttribute' || !attr.name || attr.name.type !== 'JSXIdentifier') {
      return
    }

    const propName = attr.name.name

    // Route based on prop type
    if (propName === 'style') {
      this.processStyleAttribute(attr)
    } else if (this.isStyleProp(propName)) {
      this.processStyleProp(attr)
    } else if (this.isTransformProp(propName)) {
      this.processTransformProp(attr)
    } else if (this.isDropProp(propName)) {
      this.processDropProp(attr)
    }
    // else: direct prop, leave it on the element as-is
  }

  /**
   * Process style={{...}} or style={[...]} attribute
   */
  processStyleAttribute(attr) {
    if (attr.value?.type !== 'JSXExpressionContainer') {
      this.propsToRemove.push(attr)
      return
    }

    const expr = attr.value.expression

    // style={[styles.foo, { bar: 'baz' }]}
    if (expr.type === 'ArrayExpression') {
      for (const element of expr.elements) {
        if (element.type === 'ObjectExpression') {
          this.processStyleObject(element)
        } else if (element.type === 'MemberExpression') {
          this.existingStyleReferences.push(element)
        }
      }
    }
    // style={{ bar: 'baz' }}
    else if (expr.type === 'ObjectExpression') {
      this.processStyleObject(expr)
    }
    // style={styles.foo}
    else if (expr.type === 'MemberExpression') {
      this.existingStyleReferences.push(expr)
    }

    this.propsToRemove.push(attr)
  }

  /**
   * Process an ObjectExpression within a style prop
   */
  processStyleObject(obj) {
    for (const prop of obj.properties) {
      if (prop.type === 'Property' && prop.key.type === 'Identifier') {
        const styleName = prop.key.name
        const value = this.normalizeValue(prop.value)
        const shouldExtract = shouldExtractToStyleSheet(value, false)

        this.addStyleProp(styleName, value, shouldExtract)
      }
    }
  }

  /**
   * Process a style prop like p="4" or bg="blue"
   */
  processStyleProp(attr) {
    const propName = attr.name.name
    const config = this.mappings.styleProps[propName]
    const value = this.extractValue(attr)

    if (!value) {
      return
    }

    // Transform the value (valueMap, tokens, etc.)
    const transformed = this.transformValue(value, config)

    // Determine if it should be extracted to StyleSheet
    const shouldExtract = shouldExtractToStyleSheet(transformed.value, transformed.isTokenHelper)

    // Get the target style name(s) - some props expand to multiple styles
    const styleNames = this.getStyleNames(config)

    this.logger?.categorization(propName, 'style', `→ ${styleNames.join(', ')}`)

    let addedAny = false
    for (const styleName of styleNames) {
      if (this.addStyleProp(styleName, transformed.value, shouldExtract)) {
        addedAny = true
      }
    }

    if (addedAny && transformed.helperUsed) {
      this.usedTokenHelpers.add(transformed.helperUsed)
    }

    this.propsToRemove.push(attr)
  }

  /**
   * Process a transform prop like disabled="true" → isDisabled={true}
   */
  processTransformProp(attr) {
    const propName = attr.name.name
    const config = this.mappings.transformProps[propName]

    // Config must be an object with targetName
    if (!config.targetName) {
      throw new Error(
        `transformProps[${propName}]: missing targetName. Use { targetName: '...', valueMap?: {...}, valueTransform?: (v, j) => ... }`,
      )
    }

    // Validate mutually exclusive valueMap and valueTransform
    if (config.valueMap && config.valueTransform) {
      throw new Error(
        `transformProps[${propName}]: valueMap and valueTransform are mutually exclusive`,
      )
    }

    const newPropName = config.targetName

    this.logger?.categorization(propName, 'transform', `→ ${newPropName}`)

    let value = attr.value

    if (value?.type === 'JSXExpressionContainer') {
      value = value.expression
    }

    if (value && (config.valueMap || config.valueTransform || config.tokenHelper)) {
      const transformed = this.transformValue(value, config)
      value = this.j.jsxExpressionContainer(transformed.value)
      // Always add tokenHelper for transformed props (they go on element, not validated)
      if (transformed.helperUsed) {
        this.usedTokenHelpers.add(transformed.helperUsed)
      }
    }
    // Wrap other expression types back in JSXExpressionContainer
    else if (
      value &&
      value.type !== 'StringLiteral' &&
      attr.value?.type === 'JSXExpressionContainer'
    ) {
      value = this.j.jsxExpressionContainer(value)
    }

    this.transformedProps[newPropName] = value
    this.propsToRemove.push(attr)
  }

  /**
   * Process a drop prop like _hover or _pressed
   */
  processDropProp(attr) {
    this.logger?.categorization(attr.name.name, 'drop', '')
    this.propsToRemove.push(attr)
    this.droppedProps.push({ name: attr.name.name, attr })
  }

  /**
   * Transform a value using priority chain:
   * 1. Normalize (full → 100%, numeric strings → numbers)
   * 2. valueMap (explicit transformations) OR valueTransform (custom function)
   * 3. tokenHelper (token conversion)
   * Returns { value: AST, isTokenHelper: boolean, helperUsed: string|null }
   */
  transformValue(value, config) {
    if (!value) {
      return { value, isTokenHelper: false, helperUsed: null }
    }

    const { tokenHelper, valueMap, valueTransform } = config
    let processedValue = value
    const helperUsed = null

    // Step 1: Normalize - convert numeric strings to numeric literals FIRST
    if (processedValue.type === 'StringLiteral' || processedValue.type === 'Literal') {
      const val = processedValue.value
      if (typeof val === 'string' && /^\d+(\.\d+)?$/.test(val)) {
        return { value: this.j.numericLiteral(Number(val)), isTokenHelper: false, helperUsed: null }
      }
    }

    // Step 2a: Apply valueMap (explicit transformations like xs → sm)
    if (valueMap) {
      processedValue = this.applyValueMap(processedValue, valueMap)
    }
    // Step 2b: Apply valueTransform (custom function)
    else if (valueTransform) {
      processedValue = valueTransform(processedValue, this.j)
    }

    // Step 3: Apply token conversion (space.md, color.brand, etc.)
    if (tokenHelper) {
      const result = this.tokenConverter.convert(processedValue, tokenHelper, this.j)
      if (result.converted) {
        return { value: result.value, isTokenHelper: true, helperUsed: result.helperUsed }
      }
      processedValue = result.value
    }

    // Pass through
    return { value: processedValue, isTokenHelper: false, helperUsed }
  }

  /**
   * Apply valueMap transformations
   */
  applyValueMap(value, valueMap) {
    if (value.type === 'StringLiteral' || value.type === 'Literal') {
      const mappedValue = valueMap[value.value]
      if (mappedValue !== undefined) {
        return typeof mappedValue === 'number'
          ? this.j.numericLiteral(mappedValue)
          : this.j.stringLiteral(mappedValue)
      }
    } else if (value.type === 'NumericLiteral') {
      const mappedValue = valueMap[value.value]
      if (mappedValue !== undefined) {
        return typeof mappedValue === 'number'
          ? this.j.numericLiteral(mappedValue)
          : this.j.stringLiteral(mappedValue)
      }
    }

    return value
  }

  /**
   * Normalize value literals for StyleSheet extraction
   * - "full" → "100%"
   * - space['4'] → 4
   * - "4" → 4
   */
  normalizeValue(value) {
    // "full" dimension
    if ((value.type === 'StringLiteral' || value.type === 'Literal') && value.value === 'full') {
      return this.j.stringLiteral('100%')
    }

    // space['4'] → 4, radius['16'] → 16
    if (value.type === 'MemberExpression') {
      const tokenName = value.object?.name
      if (tokenName && ['space', 'radius'].includes(tokenName)) {
        if (value.computed && value.property?.type === 'StringLiteral') {
          const propertyValue = value.property.value
          if (/^\d+$/.test(propertyValue)) {
            return this.j.numericLiteral(Number.parseInt(propertyValue, 10))
          }
        }
      }
    }

    // "4" → 4, "1.5" → 1.5
    if (value.type === 'StringLiteral' || value.type === 'Literal') {
      const val = String(value.value)
      if (/^\d+(\.\d+)?$/.test(val)) {
        return this.j.numericLiteral(Number.parseFloat(val))
      }
      // "10px" → 10 (RN uses density-independent pixels, no units)
      if (/^\d+(\.\d+)?px$/.test(val)) {
        return this.j.numericLiteral(Number.parseFloat(val.replace('px', '')))
      }
    }

    return value
  }

  /**
   * Add a style prop to the appropriate bucket with validation
   * Returns true if added successfully, false if validation failed
   */
  addStyleProp(styleName, value, shouldExtract) {
    const validation = this.validator.validate(styleName, value)

    if (!validation.isValid) {
      this.invalidStyles.push({ styleName, value: validation.reason })
      if (validation.category === 'manual') {
        this.manualFailures.push({ styleName, value: validation.reason })
      }
      return false
    }

    const target = shouldExtract ? this.styleProps : this.inlineStyles
    target[styleName] = value
    return true
  }

  /**
   * Extract value from JSX attribute
   */
  extractValue(attr) {
    if (attr.value?.type === 'JSXExpressionContainer') {
      return attr.value.expression
    }
    if (attr.value?.type === 'StringLiteral' || attr.value?.type === 'Literal') {
      return attr.value
    }
    return null
  }

  /**
   * Get target style name(s) from config
   * Some props expand to multiple styles (e.g., size → [width, height])
   */
  getStyleNames(config) {
    if (typeof config === 'string') {
      return [config]
    }

    if (config.properties) {
      return config.properties
    }

    if (config.styleName) {
      return [config.styleName]
    }

    return []
  }

  /**
   * Check if prop is a style prop
   */
  isStyleProp(propName) {
    return propName in (this.mappings.styleProps || {})
  }

  /**
   * Check if prop is a transform prop
   */
  isTransformProp(propName) {
    return propName in (this.mappings.transformProps || {})
  }

  /**
   * Check if prop is a drop prop
   */
  isDropProp(propName) {
    const dropList = this.mappings.dropProps || []
    return dropList.includes(propName)
  }

  /**
   * Get the categorized result
   */
  getResult() {
    return {
      styleProps: this.styleProps,
      inlineStyles: this.inlineStyles,
      transformedProps: this.transformedProps,
      propsToRemove: this.propsToRemove,
      usedTokenHelpers: this.usedTokenHelpers,
      droppedProps: this.droppedProps,
      invalidStyles: this.invalidStyles,
      existingStyleReferences: this.existingStyleReferences,
      hasManualFailures: this.manualFailures.length > 0,
    }
  }
}
