/**
 * NativeBase-specific prop categorization and transformation utilities
 * Handles prop mapping, StyleSheet extraction, and NativeBase→Nordlys token remapping
 *
 * Validation derives from:
 * - nordlys-props.js: Target model (what's valid in Nordlys output)
 * - nativebase-styled-props.js: Source model (NativeBase props documentation)
 */

import { addNamedImport } from '../helpers/imports.js'
import { buildNestedMemberExpression } from '../helpers/token-helpers.js'
import { getNordlysColorPath } from './mappings/maps-color.js'
import { convertRadiusToken, convertSpaceToken } from './mappings/maps-tokens.js'
import {
  DIMENSION_PROPS,
  NUMERIC_ONLY_PROPS,
  RADIUS_TOKENS,
  SPACE_TOKENS,
} from './mappings/nordlys-props.js'

/**
 * Check if a value can be extracted to StyleSheet (literal or token helper reference)
 */
export function shouldExtractToStyleSheet(value, isTokenHelper = false) {
  if (!value) {
    return false
  }

  if (
    value.type === 'Literal' ||
    value.type === 'StringLiteral' ||
    value.type === 'NumericLiteral' ||
    value.type === 'BooleanLiteral'
  ) {
    return true
  }

  // Token helper member expressions can be extracted (e.g., radius.md)
  // User member expressions like props.spacing should stay inline
  if (value.type === 'MemberExpression' && isTokenHelper) {
    return true
  }

  // Everything else (variables, function calls, user member expressions) stays inline
  return false
}

/**
 * Validation constants from Nordlys model
 * Re-exported for backward compatibility with existing tests/code
 */
export const validSpaceTokens = SPACE_TOKENS
export const validRadiusTokens = RADIUS_TOKENS
const dimensionProps = DIMENSION_PROPS
const numericProps = NUMERIC_ONLY_PROPS

/**
 * Validate a value against a list of valid token names
 * Returns { isValid: boolean, reason?: string }
 */
export function validateTokenValue(value, validTokens, allowNumeric = false) {
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
 * Returns { isValid: boolean, reason?: string }
 */
function validateStyleValue(styleName, value) {
  // textAlign is never valid (React Native doesn't support it on View)
  if (styleName === 'textAlign') {
    const displayValue = value.type === 'StringLiteral' ? `"${value.value}"` : '{...}'
    return { isValid: false, reason: displayValue }
  }

  if (value.type === 'StringLiteral' || value.type === 'Literal') {
    // Literal with numeric value is valid (e.g., p={2} means 2dp directly)
    if (value.type === 'Literal' && typeof value.value === 'number') {
      return { isValid: true }
    }

    const val = String(value.value)

    // Flag "0", "1", "2px", "230px" but allow percentages
    if (/^\d+px$/.test(val) || (/^\d+$/.test(val) && !val.endsWith('%'))) {
      return { isValid: false, reason: `"${val}"` }
    }

    // Semantic tokens like "sm" aren't valid for dimension props that expect numbers
    if (dimensionProps.includes(styleName) && validSpaceTokens.includes(val)) {
      return { isValid: false, reason: `"${val}"` }
    }

    // Numeric props shouldn't be strings
    if (numericProps.includes(styleName) && /^\d+(\.\d+)?$/.test(val)) {
      return { isValid: false, reason: `"${val}"` }
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
        return { isValid: false, reason: `${tokenName}['${property}']` }
      }
      if (!validSpaceTokens.includes(property)) {
        const displayValue = value.computed
          ? `${tokenName}['${property}']`
          : `${tokenName}.${property}`
        return { isValid: false, reason: displayValue }
      }
    }

    if (tokenName === 'radius' && (styleName.includes('radius') || styleName.includes('Radius'))) {
      if (/^\d+$/.test(property)) {
        return { isValid: false, reason: `${tokenName}['${property}']` }
      }
      if (!validRadiusTokens.includes(property)) {
        const displayValue = value.computed
          ? `${tokenName}['${property}']`
          : `${tokenName}.${property}`
        return { isValid: false, reason: displayValue }
      }
    }
  }

  return { isValid: true }
}

/**
 * Transform token MemberExpression with numeric bracket notation to numeric literal
 * e.g., space['4'] → 4, radius['16'] → 16
 * Also transforms dimension string values: "full" → "100%"
 */
function transformNumericTokenAccess(value, j) {
  if ((value.type === 'StringLiteral' || value.type === 'Literal') && value.value === 'full') {
    return j.stringLiteral('100%')
  }

  if (value.type !== 'MemberExpression') {
    return value
  }

  const tokenName = value.object?.name
  if (!tokenName || !['space', 'radius'].includes(tokenName)) {
    return value
  }

  if (value.computed && value.property?.type === 'StringLiteral') {
    const propertyValue = value.property.value
    if (/^\d+$/.test(propertyValue)) {
      return j.numericLiteral(Number.parseInt(propertyValue, 10))
    }
  }

  return value
}

/**
 * Apply value mapping to a prop value
 */
export function applyValueMapping(value, valueMap, j) {
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
 * 1. valueMap - explicit string → value transformations (e.g., full → 100%)
 * 2. tokenHelper - named token conversion with scale remapping (e.g., NB space.xl → Nordlys space.2xl)
 * 3. pass-through - numbers, expressions, unknown strings
 *
 * @param {object} value - AST node for the value
 * @param {object} config - Mapping config { styleName, tokenHelper, valueMap, properties }
 * @param {object} j - jscodeshift API
 * @param {Set} usedTokenHelpers - Set to track which token helpers are used
 * @returns {object} { value, isTokenHelper }
 */
export function transformPropValue(value, config, j, usedTokenHelpers) {
  if (!value) {
    return { value, isTokenHelper: false }
  }

  const { tokenHelper, valueMap } = config
  let processedValue = value
  let isTokenHelper = false

  // Priority 1: valueMap (explicit transformations)
  if (valueMap) {
    processedValue = applyValueMapping(processedValue, valueMap, j)
  }

  // Priority 2: tokenHelper (named token conversion)
  if (
    tokenHelper &&
    (processedValue.type === 'StringLiteral' || processedValue.type === 'Literal')
  ) {
    let tokenPath = processedValue.value

    if (typeof tokenPath === 'string') {
      // Convert numeric strings to numeric literals
      if (/^\d+$/.test(tokenPath)) {
        const numericValue = Number.parseInt(tokenPath, 10)
        return { value: j.numericLiteral(numericValue), isTokenHelper: false }
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
      processedValue = buildNestedMemberExpression(j, tokenHelper, tokenPath)
      isTokenHelper = true
      usedTokenHelpers.add(tokenHelper)
    }
  }

  // Priority 3: pass-through (numbers, expressions, unknown strings)
  return { value: processedValue, isTokenHelper }
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
 */
export function categorizeProps(attributes, mappings, j) {
  const {
    styleProps: stylePropMappings = {},
    transformProps: transformPropMappings = {},
    dropProps: dropPropList = [],
  } = mappings
  const styleProps = {}
  const inlineStyles = {}
  const transformedProps = {}
  const propsToRemove = []
  const usedTokenHelpers = new Set()
  const droppedProps = []
  const invalidStyles = []
  // StyleSheet references like styles.foo
  const existingStyleReferences = []

  attributes.forEach((attr) => {
    if (attr.type !== 'JSXAttribute') {
      return
    }
    if (!attr.name || attr.name.type !== 'JSXIdentifier') {
      return
    }

    const propName = attr.name.name

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
                  // space['4'] → 4
                  const transformedValue = transformNumericTokenAccess(prop.value, j)

                  const validation = validateStyleValue(styleName, transformedValue)
                  if (!validation.isValid) {
                    invalidStyles.push({ styleName, value: validation.reason })
                    continue
                  }

                  const targetStyles = shouldExtractToStyleSheet(transformedValue, false)
                    ? styleProps
                    : inlineStyles
                  targetStyles[styleName] = transformedValue
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
              // space['4'] → 4
              const transformedValue = transformNumericTokenAccess(prop.value, j)

              const validation = validateStyleValue(styleName, transformedValue)
              if (!validation.isValid) {
                invalidStyles.push({ styleName, value: validation.reason })
                continue
              }

              const targetStyles = shouldExtractToStyleSheet(transformedValue, false)
                ? styleProps
                : inlineStyles
              targetStyles[styleName] = transformedValue
            }
          }
        }
        // styles.foo
        else if (expr.type === 'MemberExpression') {
          existingStyleReferences.push(expr)
        }
      }

      propsToRemove.push(attr)
    } else if (stylePropMappings[propName]) {
      const config = stylePropMappings[propName]
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
        // Use priority chain transformation (valueMap → tokenHelper → pass-through)
        const result = transformPropValue(value, config, j, usedTokenHelpers)
        const processedValue = result.value
        const isTokenHelperCall = result.isTokenHelper

        const shouldExtract = shouldExtractToStyleSheet(processedValue, isTokenHelperCall)

        if (properties) {
          for (const prop of properties) {
            const validation = validateStyleValue(prop, processedValue)
            if (!validation.isValid) {
              invalidStyles.push({ styleName: prop, value: validation.reason })
              continue
            }

            const targetStyles = shouldExtract ? styleProps : inlineStyles
            targetStyles[prop] = processedValue
          }
        } else {
          const validation = validateStyleValue(styleName, processedValue)
          if (validation.isValid) {
            const targetStyles = shouldExtract ? styleProps : inlineStyles
            targetStyles[styleName] = processedValue
          } else {
            invalidStyles.push({ styleName, value: validation.reason })
          }
        }

        propsToRemove.push(attr)
      }
    } else if (transformPropMappings[propName]) {
      const config = transformPropMappings[propName]
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
        const result = transformPropValue(value, config, j, usedTokenHelpers)
        value = j.jsxExpressionContainer(result.value)
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
    } else if (dropPropList.includes(propName)) {
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
  }
}

/**
 * Convert style props object to AST properties for StyleSheet
 */
export function buildStyleSheetProperties(styleProps, j) {
  return Object.entries(styleProps).map(([key, value]) => {
    return j.property('init', j.identifier(key), value)
  })
}

/**
 * Format a JSX attribute value for display
 */
function formatPropValue(attr, _j) {
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
      const value = formatPropValue(attr, j)
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
 * Create or extend StyleSheet.create() at the end of the file
 */
export function addOrExtendStyleSheet(root, elementStyles, j) {
  if (elementStyles.length === 0) {
    return
  }

  const newStyleProperties = elementStyles.map(({ name, styles }) => {
    const properties = buildStyleSheetProperties(styles, j)
    return j.property('init', j.identifier(name), j.objectExpression(properties))
  })

  // Check if there's already a StyleSheet.create() call assigned to 'styles'
  const existingStyleSheet = root.find(j.VariableDeclarator, {
    id: { name: 'styles' },
    init: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: { name: 'StyleSheet' },
        property: { name: 'create' },
      },
    },
  })

  if (existingStyleSheet.length > 0) {
    existingStyleSheet.forEach((path) => {
      const createCallArgs = path.node.init.arguments
      if (createCallArgs.length > 0 && createCallArgs[0].type === 'ObjectExpression') {
        createCallArgs[0].properties.push(...newStyleProperties)
      }
    })
  } else {
    const styleSheetCall = j.variableDeclaration('const', [
      j.variableDeclarator(
        j.identifier('styles'),
        j.callExpression(j.memberExpression(j.identifier('StyleSheet'), j.identifier('create')), [
          j.objectExpression(newStyleProperties),
        ]),
      ),
    ])

    root.find(j.Program).forEach((path) => {
      path.node.body.push(styleSheetCall)
    })
  }

  addNamedImport(root, 'react-native', 'StyleSheet', j)
}
