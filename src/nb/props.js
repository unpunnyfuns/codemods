/**
 * NativeBase-specific prop categorization and transformation utilities
 * Handles prop mapping, StyleSheet extraction, and NativeBase->Nordlys token remapping
 *
 * Validation derives from three-model architecture:
 * - react-native-props.js: Platform model (what React Native components support)
 * - nordlys-props.js: Target model (what's valid in Nordlys output)
 * - nativebase-styled-props.js: Source model (NativeBase props documentation)
 */

import { buildTokenPath } from '@puns/shiftkit'
import { transformStringsInExpression } from '@puns/shiftkit/jsx'
import { shouldExtractToStyleSheet } from '@puns/shiftkit/rn'
import { getNordlysColorPath, isLiteralColor } from './mappings/maps-color.js'
import { convertRadiusToken, convertSpaceToken } from './mappings/maps-tokens.js'
import { DIMENSION_PROPS, RADIUS_TOKENS, SPACE_TOKENS } from './mappings/nordlys-props.js'
import { VIEW_STYLE_PROPS } from './mappings/react-native-props.js'

/**
 * Validation constants from Nordlys model
 * Re-exported for backward compatibility with existing tests/code
 */
export const validSpaceTokens = SPACE_TOKENS
export const validRadiusTokens = RADIUS_TOKENS
const dimensionProps = DIMENSION_PROPS

/**
 * Normalize value literals for StyleSheet extraction
 * - "full" → "100%"
 * - space['4'] → 4
 * - "4" → 4
 */
function normalizeValue(value, j) {
  // "full" dimension
  if ((value.type === 'StringLiteral' || value.type === 'Literal') && value.value === 'full') {
    return j.stringLiteral('100%')
  }

  // space['4'] → 4, radius['16'] → 16
  if (value.type === 'MemberExpression') {
    const tokenName = value.object?.name
    if (tokenName && ['space', 'radius'].includes(tokenName)) {
      if (value.computed && value.property?.type === 'StringLiteral') {
        const propertyValue = value.property.value
        if (/^\d+$/.test(propertyValue)) {
          return j.numericLiteral(Number.parseInt(propertyValue, 10))
        }
      }
    }
  }

  // "4" → 4, "1.5" → 1.5
  if (value.type === 'StringLiteral' || value.type === 'Literal') {
    const val = String(value.value)
    if (/^\d+(\.\d+)?$/.test(val)) {
      return j.numericLiteral(Number.parseFloat(val))
    }
  }

  return value
}

/**
 * Validate a value against a list of valid token names
 * Returns { isValid: boolean, reason?: string }
 */
export function validateToken(value, validTokens, allowNumeric = false) {
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

/**
 * Check if a style value is valid for the given style property
 * Returns { isValid: boolean, reason?: string, category?: string }
 */
function validateStyle(styleName, value) {
  // Check if prop is valid on React Native View
  if (!VIEW_STYLE_PROPS[styleName]) {
    const displayValue = value.type === 'StringLiteral' ? `"${value.value}"` : '{...}'
    return { isValid: false, reason: displayValue, category: 'manual' }
  }

  if (value.type === 'StringLiteral' || value.type === 'Literal') {
    // Literal with numeric value is valid (e.g., p={2} means 2dp directly)
    if (value.type === 'Literal' && typeof value.value === 'number') {
      return { isValid: true }
    }

    const val = String(value.value)

    // Flag values with units - these need manual intervention
    if (/^\d+px$/.test(val)) {
      return { isValid: false, reason: `"${val}"`, category: 'manual' }
    }

    // Semantic tokens like "sm" aren't valid for dimension props that expect numbers
    if (dimensionProps.includes(styleName) && validSpaceTokens.includes(val)) {
      return { isValid: false, reason: `"${val}"`, category: 'manual' }
    }
  }

  if (value.type === 'MemberExpression') {
    const tokenName = value.object?.name
    let property = value.property?.name

    if (!property && value.computed && value.property?.type === 'StringLiteral') {
      property = value.property.value
    }

    if (tokenName === 'space') {
      if (/^\d+$/.test(property)) {
        return { isValid: false, reason: `${tokenName}['${property}']`, category: 'manual' }
      }
      if (!validSpaceTokens.includes(property)) {
        const displayValue = value.computed
          ? `${tokenName}['${property}']`
          : `${tokenName}.${property}`
        return { isValid: false, reason: displayValue, category: 'manual' }
      }
    }

    if (tokenName === 'radius' && (styleName.includes('radius') || styleName.includes('Radius'))) {
      if (/^\d+$/.test(property)) {
        return { isValid: false, reason: `${tokenName}['${property}']`, category: 'manual' }
      }
      if (!validRadiusTokens.includes(property)) {
        const displayValue = value.computed
          ? `${tokenName}['${property}']`
          : `${tokenName}.${property}`
        return { isValid: false, reason: displayValue, category: 'manual' }
      }
    }
  }

  return { isValid: true }
}

/**
 * Apply value mapping to a prop value
 */
export function applyValueMap(value, valueMap, j) {
  if (!valueMap) {
    return value
  }

  if (value.type === 'StringLiteral' || value.type === 'Literal') {
    const mappedValue = valueMap[value.value]
    if (mappedValue !== undefined) {
      return typeof mappedValue === 'number'
        ? j.numericLiteral(mappedValue)
        : j.stringLiteral(mappedValue)
    }
  } else if (value.type === 'NumericLiteral') {
    const mappedValue = valueMap[value.value]
    if (mappedValue !== undefined) {
      return typeof mappedValue === 'number'
        ? j.numericLiteral(mappedValue)
        : j.stringLiteral(mappedValue)
    }
  }

  return value
}

/**
 * Transform a prop value using priority chain (Option B)
 *
 * Priority order:
 * 1. valueMap - explicit string -> value transformations (e.g., full -> 100%)
 * 2. tokenHelper - named token conversion with scale remapping (e.g., NB space.xl -> Nordlys space.2xl)
 * 3. pass-through - numbers, expressions, unknown strings
 *
 * @param {object} value - AST node for the value
 * @param {object} config - Mapping config { styleName, tokenHelper, valueMap, properties }
 * @param {object} j - jscodeshift API
 * @returns {object} { value, isTokenHelper, tokenHelper }
 */
export function transformProp(value, config, j) {
  if (!value) {
    return { value, isTokenHelper: false, tokenHelper: null }
  }

  const { tokenHelper, valueMap } = config
  let processedValue = value
  let isTokenHelper = false
  let usedHelper = null

  // Priority 1: valueMap (explicit transformations)
  if (valueMap) {
    processedValue = applyValueMap(processedValue, valueMap, j)
  }

  // Priority 2: tokenHelper (named token conversion)
  if (tokenHelper) {
    // Handle ConditionalExpression and LogicalExpression with string literals
    if (
      processedValue.type === 'ConditionalExpression' ||
      processedValue.type === 'LogicalExpression'
    ) {
      processedValue = transformStringsInExpression(
        processedValue,
        (str) => {
          // Convert numeric strings to numeric literals
          if (/^\d+$/.test(str)) {
            return j.numericLiteral(Number.parseInt(str, 10))
          }

          // Apply token-specific conversions
          let tokenPath = str
          if (tokenHelper === 'space') {
            tokenPath = convertSpaceToken(tokenPath)
          } else if (tokenHelper === 'radius') {
            tokenPath = convertRadiusToken(tokenPath)
          } else if (tokenHelper === 'color') {
            tokenPath = getNordlysColorPath(tokenPath)
          }

          // Build token helper expression (e.g., space.md, color.icon.brand)
          return buildTokenPath(j, tokenHelper, tokenPath)
        },
        j,
      )
      isTokenHelper = true
      usedHelper = tokenHelper
    }
    // Handle simple StringLiteral/Literal
    else if (processedValue.type === 'StringLiteral' || processedValue.type === 'Literal') {
      let tokenPath = processedValue.value

      if (typeof tokenPath === 'string') {
        // Convert numeric strings to numeric literals
        if (/^\d+$/.test(tokenPath)) {
          const numericValue = Number.parseInt(tokenPath, 10)
          return { value: j.numericLiteral(numericValue), isTokenHelper: false, tokenHelper: null }
        }

        // Special case: literal colors should remain as string literals
        if (tokenHelper === 'color' && isLiteralColor(tokenPath)) {
          return { value: j.stringLiteral(tokenPath), isTokenHelper: false, tokenHelper: null }
        }

        // Apply token-specific conversions
        if (tokenHelper === 'space') {
          tokenPath = convertSpaceToken(tokenPath)
        } else if (tokenHelper === 'radius') {
          tokenPath = convertRadiusToken(tokenPath)
        } else if (tokenHelper === 'color') {
          tokenPath = getNordlysColorPath(tokenPath)
        }

        // Build token helper expression (e.g., space.md, color.icon.brand)
        processedValue = buildTokenPath(j, tokenHelper, tokenPath)
        isTokenHelper = true
        usedHelper = tokenHelper
      }
    }
  }

  // Priority 3: pass-through (numbers, expressions, unknown strings)
  return { value: processedValue, isTokenHelper, tokenHelper: usedHelper }
}

/**
 * Process a single style property with validation
 * @returns {boolean} true if prop was added successfully
 */
function processStyleProp(
  styleName,
  value,
  shouldExtract,
  styleProps,
  inlineStyles,
  invalidStyles,
  manualFailures,
) {
  const validation = validateStyle(styleName, value)
  if (!validation.isValid) {
    invalidStyles.push({ styleName, value: validation.reason })
    if (validation.category === 'manual') {
      manualFailures.push({ styleName, value: validation.reason })
    }
    return false
  }

  const target = shouldExtract ? styleProps : inlineStyles
  target[styleName] = value
  return true
}

/**
 * Categorize props from JSX attributes into style/inline/transform/drop
 *
 * Returns:
 * - styleProps: Props to extract to StyleSheet (validated, invalid ones excluded)
 * - inlineStyles: Props to keep as inline styles
 * - transformedProps: Props to rename/transform on element
 * - propsToRemove: Attributes to remove from element
 * - usedTokenHelpers: Set of token helpers used
 * - droppedProps: Array of { name, attr } for dropped props
 * - invalidStyles: Array of { styleName, value } for invalid style values
 * - existingStyleReferences: Array of MemberExpression for existing StyleSheet refs
 * - hasManualFailures: Boolean indicating if any manual-category failures occurred
 */
export function categorizeProps(attributes, mappings, j) {
  const {
    styleProps: styleMappings = {},
    transformProps: transformMappings = {},
    dropProps: dropList = [],
  } = mappings
  const styleProps = {}
  const inlineStyles = {}
  const transformedProps = {}
  const propsToRemove = []
  const usedTokenHelpers = new Set()
  const droppedProps = []
  const invalidStyles = []
  const manualFailures = []
  // StyleSheet references like styles.foo
  const existingStyleReferences = []

  attributes.forEach((attr) => {
    // Skip non-attributes
    if (attr.type !== 'JSXAttribute') {
      return
    }
    if (!attr.name || attr.name.type !== 'JSXIdentifier') {
      return
    }

    const propName = attr.name.name

    // Handle style prop (inline StyleSheet or array of styles)
    if (propName === 'style') {
      if (attr.value?.type === 'JSXExpressionContainer') {
        const expr = attr.value.expression

        // [styles.foo, { bar: 'baz' }]
        if (expr.type === 'ArrayExpression') {
          for (const element of expr.elements) {
            if (element.type === 'ObjectExpression') {
              for (const prop of element.properties) {
                if (prop.type === 'Property' && prop.key.type === 'Identifier') {
                  const styleName = prop.key.name
                  const value = normalizeValue(prop.value, j)

                  const shouldExtract = shouldExtractToStyleSheet(value, false)
                  processStyleProp(
                    styleName,
                    value,
                    shouldExtract,
                    styleProps,
                    inlineStyles,
                    invalidStyles,
                    manualFailures,
                  )
                }
              }
            } else if (element.type === 'MemberExpression') {
              // styles.foo
              existingStyleReferences.push(element)
            }
          }
        }
        // { bar: 'baz' }
        else if (expr.type === 'ObjectExpression') {
          for (const prop of expr.properties) {
            if (prop.type === 'Property' && prop.key.type === 'Identifier') {
              const styleName = prop.key.name
              const value = normalizeValue(prop.value, j)

              const shouldExtract = shouldExtractToStyleSheet(value, false)
              processStyleProp(
                styleName,
                value,
                shouldExtract,
                styleProps,
                inlineStyles,
                invalidStyles,
                manualFailures,
              )
            }
          }
        }
        // styles.foo
        else if (expr.type === 'MemberExpression') {
          existingStyleReferences.push(expr)
        }
      }

      propsToRemove.push(attr)
    } else if (styleMappings[propName]) {
      const config = styleMappings[propName]
      let styleName, properties

      // Support both string (simple mapping) and object (with options)
      if (typeof config === 'string') {
        styleName = config
        properties = null
      } else {
        styleName = config.styleName
        properties = config.properties
      }

      let value = null
      if (attr.value?.type === 'JSXExpressionContainer') {
        value = attr.value.expression
      } else if (attr.value?.type === 'StringLiteral' || attr.value?.type === 'Literal') {
        value = attr.value
      }

      if (value) {
        // Use priority chain transformation (valueMap -> tokenHelper -> pass-through)
        const result = transformProp(value, config, j)
        const transformed = result.value
        const isHelper = result.isTokenHelper
        const helper = result.tokenHelper

        const shouldExtract = shouldExtractToStyleSheet(transformed, isHelper)

        let added = false

        if (properties) {
          for (const prop of properties) {
            if (
              processStyleProp(
                prop,
                transformed,
                shouldExtract,
                styleProps,
                inlineStyles,
                invalidStyles,
                manualFailures,
              )
            ) {
              added = true
            }
          }
        } else {
          added = processStyleProp(
            styleName,
            transformed,
            shouldExtract,
            styleProps,
            inlineStyles,
            invalidStyles,
            manualFailures,
          )
        }

        // Only add tokenHelper if at least one valid prop was added
        if (added && helper) {
          usedTokenHelpers.add(helper)
        }

        propsToRemove.push(attr)
      }
    } else if (transformMappings[propName]) {
      const config = transformMappings[propName]
      let newPropName

      // Support both string (simple rename) and object (with options)
      if (typeof config === 'string') {
        newPropName = config
      } else {
        newPropName = config.propName
      }

      let value = attr.value

      if (value?.type === 'JSXExpressionContainer') {
        value = value.expression
      }

      // Use priority chain transformation for transformed props too
      if (value && typeof config !== 'string') {
        const result = transformProp(value, config, j)
        value = j.jsxExpressionContainer(result.value)
        // Always add tokenHelper for transformed props (they go on element, not validated)
        if (result.tokenHelper) {
          usedTokenHelpers.add(result.tokenHelper)
        }
      }
      // Wrap other expression types back in JSXExpressionContainer
      else if (
        value &&
        value.type !== 'StringLiteral' &&
        attr.value?.type === 'JSXExpressionContainer'
      ) {
        value = j.jsxExpressionContainer(value)
      }

      transformedProps[newPropName] = value
      propsToRemove.push(attr)
    } else if (dropList.includes(propName)) {
      propsToRemove.push(attr)
      droppedProps.push({ name: propName, attr })
    }
    // Everything else (DIRECT_PROPS) stays on element as-is
  })

  return {
    styleProps,
    inlineStyles,
    transformedProps,
    propsToRemove,
    usedTokenHelpers,
    droppedProps,
    invalidStyles,
    existingStyleReferences,
    hasManualFailures: manualFailures.length > 0,
  }
}

/**
 * Format a JSX attribute value for display
 */
function formatProp(attr, _j) {
  if (!attr.value) {
    return '{true}'
  }

  if (attr.value.type === 'StringLiteral') {
    return `"${attr.value.value}"`
  }

  if (attr.value.type === 'JSXExpressionContainer') {
    const expr = attr.value.expression

    if (expr.type === 'BooleanLiteral') {
      return `{${expr.value}}`
    }
    if (expr.type === 'NumericLiteral') {
      return `{${expr.value}}`
    }
    if (expr.type === 'StringLiteral') {
      return `{"${expr.value}"}`
    }
    if (expr.type === 'Identifier') {
      return `{${expr.name}}`
    }
    if (expr.type === 'ObjectExpression') {
      return '{...}'
    }
    if (expr.type === 'ArrayExpression') {
      return '{[...]}'
    }
    if (expr.type === 'ArrowFunctionExpression' || expr.type === 'FunctionExpression') {
      return '{() => ...}'
    }
    if (expr.type === 'CallExpression') {
      return '{func(...)}'
    }

    return '{...}'
  }

  return '{...}'
}

/**
 * Add JSX comment before element with dropped props and invalid styles
 */
export function addElementComment(path, droppedProps, invalidStyles, j) {
  if (droppedProps.length === 0 && invalidStyles.length === 0) {
    return
  }

  const lines = []

  if (droppedProps.length > 0) {
    for (const { name, attr } of droppedProps) {
      const value = formatProp(attr, j)
      lines.push(`${name}=${value}`)
    }
  }

  if (invalidStyles.length > 0) {
    if (lines.length > 0) {
      lines.push('')
    }
    for (const { styleName, value } of invalidStyles) {
      lines.push(`${styleName}: ${value}`)
    }
  }

  const commentText = ` ${lines.join('\n  ')} `
  const comment = j.commentBlock(commentText, true, false)

  // Create JSX comment: {/* ... */}
  const jsxEmptyExpr = j.jsxEmptyExpression()
  jsxEmptyExpr.comments = [comment]
  const jsxComment = j.jsxExpressionContainer(jsxEmptyExpr)

  // Insert comment before the element with proper spacing
  const parent = path.parent.node
  if (parent.type === 'JSXElement' || parent.type === 'JSXFragment') {
    const children = parent.children
    const index = children.indexOf(path.node)
    if (index !== -1) {
      children.splice(index, 0, j.jsxText('\n      '), jsxComment, j.jsxText('\n      '))
    }
  }
}

/**
 * Add TODO comment before element that requires manual migration
 */
export function addTodoComment(path, componentName, invalidStyles, j) {
  const lines = [`TODO: ${componentName} requires manual migration`]

  if (invalidStyles.length > 0) {
    lines.push('Props that need manual handling:')
    for (const { styleName, value } of invalidStyles) {
      lines.push(`  ${styleName}: ${value}`)
    }
  }

  const commentText = ` ${lines.join('\n  ')} `
  const comment = j.commentBlock(commentText, true, false)

  // Create JSX comment: {/* ... */}
  const jsxEmptyExpr = j.jsxEmptyExpression()
  jsxEmptyExpr.comments = [comment]
  const jsxComment = j.jsxExpressionContainer(jsxEmptyExpr)

  // Insert comment before the element with proper spacing
  const parent = path.parent.node
  if (parent.type === 'JSXElement' || parent.type === 'JSXFragment') {
    const children = parent.children
    const index = children.indexOf(path.node)
    if (index !== -1) {
      children.splice(index, 0, j.jsxText('\n      '), jsxComment, j.jsxText('\n      '))
    }
  }
}
