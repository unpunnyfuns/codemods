/**
 * NativeBase-specific prop categorization and transformation utilities
 * Handles prop mapping, StyleSheet extraction, and NativeBase→Nordlys token remapping
 */

import { addNamedImport } from '../helpers/imports.js'
import { buildNestedMemberExpression } from '../helpers/token-helpers.js'
import { getNordlysColorPath } from './mappings/maps-color.js'

/**
 * Check if a value can be extracted to StyleSheet (literal or token helper reference)
 */
export function shouldExtractToStyleSheet(value, isTokenHelper = false) {
  if (!value) {
    return false
  }

  // Literals can be extracted
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
 * Transform token MemberExpression with numeric bracket notation to numeric literal
 * e.g., space['4'] → 4, radius['16'] → 16
 * Also transforms dimension string values: "full" → "100%"
 */
function transformNumericTokenAccess(value, j) {
  // Transform dimension string literals
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

  // Check for bracket notation with numeric string
  if (value.computed && value.property?.type === 'StringLiteral') {
    const propertyValue = value.property.value
    if (/^\d+$/.test(propertyValue)) {
      return j.numericLiteral(Number.parseInt(propertyValue, 10))
    }
  }

  return value
}

/**
 * Process a prop value with token helper transformation
 * NativeBase-specific: remaps color tokens from NativeBase to Nordlys
 */
export function processTokenHelper(value, tokenHelper, j, usedTokenHelpers) {
  if (!tokenHelper || (value.type !== 'StringLiteral' && value.type !== 'Literal')) {
    return { value, isTokenHelper: false }
  }

  let tokenPath = value.value

  // Ensure tokenPath is a string
  if (typeof tokenPath !== 'string') {
    return { value, isTokenHelper: false }
  }

  // If token path is a numeric string, convert to number literal
  if (/^\d+$/.test(tokenPath)) {
    const numericValue = Number.parseInt(tokenPath, 10)
    return { value: j.numericLiteral(numericValue), isTokenHelper: false }
  }

  // NativeBase→Nordlys color token remapping
  if (tokenHelper === 'color') {
    tokenPath = getNordlysColorPath(tokenPath)
  }

  const transformedValue = buildNestedMemberExpression(j, tokenHelper, tokenPath)
  usedTokenHelpers.add(tokenHelper)

  return { value: transformedValue, isTokenHelper: true }
}

/**
 * Apply value mapping to a prop value
 */
export function applyValueMapping(value, valueMap, j) {
  if (!valueMap) {
    return value
  }

  // For string literals
  if (value.type === 'StringLiteral' || value.type === 'Literal') {
    const mappedValue = valueMap[value.value]
    if (mappedValue !== undefined) {
      return typeof mappedValue === 'number'
        ? j.numericLiteral(mappedValue)
        : j.stringLiteral(mappedValue)
    }
  }
  // For numeric literals
  else if (value.type === 'NumericLiteral') {
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
 * Categorize props from JSX attributes into style/inline/transform/drop
 *
 * Returns:
 * - styleProps: Props to extract to StyleSheet
 * - inlineStyles: Props to keep as inline styles
 * - transformedProps: Props to rename/transform on element
 * - propsToRemove: Attributes to remove from element
 * - usedTokenHelpers: Set of token helpers used
 * - droppedProps: Array of prop names that were dropped
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
  const existingStyleReferences = [] // StyleSheet references like styles.foo

  attributes.forEach((attr) => {
    if (attr.type !== 'JSXAttribute') {
      return
    }
    if (!attr.name || attr.name.type !== 'JSXIdentifier') {
      return
    }

    const propName = attr.name.name

    // Handle existing style prop
    if (propName === 'style') {
      if (attr.value?.type === 'JSXExpressionContainer') {
        const expr = attr.value.expression

        // Handle array of styles: [styles.foo, { bar: 'baz' }]
        if (expr.type === 'ArrayExpression') {
          for (const element of expr.elements) {
            if (element.type === 'ObjectExpression') {
              // Extract object literal to styleProps or inlineStyles
              for (const prop of element.properties) {
                if (prop.type === 'Property' && prop.key.type === 'Identifier') {
                  // Transform numeric token access like space['4'] → 4
                  const transformedValue = transformNumericTokenAccess(prop.value, j)
                  // Decide whether to extract to StyleSheet or keep inline
                  const targetStyles = shouldExtractToStyleSheet(transformedValue, false)
                    ? styleProps
                    : inlineStyles
                  targetStyles[prop.key.name] = transformedValue
                }
              }
            } else if (element.type === 'MemberExpression') {
              // Keep StyleSheet reference (styles.foo)
              existingStyleReferences.push(element)
            }
          }
        }
        // Handle single object: { bar: 'baz' }
        else if (expr.type === 'ObjectExpression') {
          for (const prop of expr.properties) {
            if (prop.type === 'Property' && prop.key.type === 'Identifier') {
              // Transform numeric token access like space['4'] → 4
              const transformedValue = transformNumericTokenAccess(prop.value, j)
              // Decide whether to extract to StyleSheet or keep inline
              const targetStyles = shouldExtractToStyleSheet(transformedValue, false)
                ? styleProps
                : inlineStyles
              targetStyles[prop.key.name] = transformedValue
            }
          }
        }
        // Handle StyleSheet reference: styles.foo
        else if (expr.type === 'MemberExpression') {
          existingStyleReferences.push(expr)
        }
      }

      propsToRemove.push(attr)
    }
    // Check if it should be extracted to stylesheet
    else if (stylePropMappings[propName]) {
      const config = stylePropMappings[propName]
      let styleName, properties, valueMap, tokenHelper

      // Support both string (simple mapping) and object (with options)
      if (typeof config === 'string') {
        styleName = config
        properties = null
        valueMap = null
        tokenHelper = null
      } else {
        styleName = config.styleName
        properties = config.properties
        valueMap = config.valueMap
        tokenHelper = config.tokenHelper
      }

      let value = null
      if (attr.value?.type === 'JSXExpressionContainer') {
        value = attr.value.expression
      } else if (attr.value?.type === 'StringLiteral' || attr.value?.type === 'Literal') {
        value = attr.value
      }

      if (value) {
        let processedValue = value
        let isTokenHelperCall = false

        // Apply tokenHelper transformation for string literals
        if (tokenHelper && (value.type === 'StringLiteral' || value.type === 'Literal')) {
          const result = processTokenHelper(value, tokenHelper, j, usedTokenHelpers)
          processedValue = result.value
          isTokenHelperCall = result.isTokenHelper
        }
        // Apply value mapping if configured
        else if (valueMap) {
          processedValue = applyValueMapping(value, valueMap, j)
        }

        // Decide whether to extract to StyleSheet or keep inline
        const targetStyles = shouldExtractToStyleSheet(processedValue, isTokenHelperCall)
          ? styleProps
          : inlineStyles

        // Handle multi-property expansion or single property
        if (properties) {
          // Expand to multiple properties with same value
          for (const prop of properties) {
            targetStyles[prop] = processedValue
          }
        } else {
          targetStyles[styleName] = processedValue
        }

        propsToRemove.push(attr)
      }
    }
    // Check if it should be transformed on element
    else if (transformPropMappings[propName]) {
      const config = transformPropMappings[propName]
      let newPropName, valueMap, tokenHelper

      // Support both string (simple rename) and object (with options)
      if (typeof config === 'string') {
        newPropName = config
        valueMap = null
        tokenHelper = null
      } else {
        newPropName = config.propName
        valueMap = config.valueMap
        tokenHelper = config.tokenHelper
      }

      let value = attr.value

      // Extract actual value from JSXExpressionContainer or StringLiteral
      if (value?.type === 'JSXExpressionContainer') {
        value = value.expression
      }

      // Apply tokenHelper transformation for string literals
      if (tokenHelper && value?.type === 'StringLiteral') {
        const result = processTokenHelper(value, tokenHelper, j, usedTokenHelpers)
        value = j.jsxExpressionContainer(result.value)
      }
      // Apply value mapping if configured and value is a string literal
      else if (valueMap && value?.type === 'StringLiteral') {
        const mappedValue = valueMap[value.value]
        if (mappedValue !== undefined) {
          value = j.jsxExpressionContainer(j.stringLiteral(mappedValue))
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
    }
    // Check if it should be dropped
    else if (dropPropList.includes(propName)) {
      propsToRemove.push(attr)
      // Store prop name and value for reporting
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
 * Add JSX comment before element with dropped props and style issues
 */
export function addElementComment(path, droppedProps, styleIssues, j) {
  if (droppedProps.length === 0 && styleIssues.length === 0) {
    return
  }

  const lines = []

  if (droppedProps.length > 0) {
    for (const { name, attr } of droppedProps) {
      const value = formatPropValue(attr, j)
      lines.push(`${name}=${value}`)
    }
  }

  if (styleIssues.length > 0) {
    if (lines.length > 0) {
      lines.push('')
    }
    for (const { styleName, value } of styleIssues) {
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
      // Add newline before comment, comment, then newline before element
      children.splice(index, 0, j.jsxText('\n      '), jsxComment, j.jsxText('\n      '))
    }
  }
}

/**
 * Validate style values and detect problematic patterns
 * Returns array of issues: { styleName, value }
 */
export function validateElementStyles(styles, _j) {
  const issues = []

  const validSpaceTokens = ['zero', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']
  const validRadiusTokens = ['sm', 'md', 'lg', 'xl', '2xl']

  const dimensionProps = [
    'width',
    'height',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'top',
    'right',
    'bottom',
    'left',
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'marginHorizontal',
    'marginVertical',
    'padding',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'paddingHorizontal',
    'paddingVertical',
  ]

  for (const [styleName, value] of Object.entries(styles)) {
    // Check for invalid string numbers and px suffixes
    if (value.type === 'StringLiteral' || value.type === 'Literal') {
      const val = String(value.value)
      // Flag "0", "1", "2px", "230px", etc. (but allow percentages)
      if (/^\d+px$/.test(val) || (/^\d+$/.test(val) && !val.endsWith('%'))) {
        issues.push({
          styleName,
          value: `"${val}"`,
        })
      }
    }

    if (dimensionProps.includes(styleName)) {
      if (value.type === 'StringLiteral') {
        const val = value.value
        // Check for semantic tokens used where numbers expected
        if (validSpaceTokens.includes(val)) {
          issues.push({
            styleName,
            value: `"${val}"`,
          })
        }
      } else if (value.type === 'MemberExpression') {
        const tokenName = value.object?.name
        let property = value.property?.name

        // Handle bracket notation: space['4']
        if (!property && value.computed && value.property?.type === 'StringLiteral') {
          property = value.property.value
        }

        if (tokenName === 'space') {
          // Check if it's a numeric string in bracket notation
          if (/^\d+$/.test(property)) {
            issues.push({
              styleName,
              value: `${tokenName}['${property}']`,
            })
          } else if (!validSpaceTokens.includes(property)) {
            issues.push({
              styleName,
              value: value.computed ? `${tokenName}['${property}']` : `${tokenName}.${property}`,
            })
          }
        }
      }
    }

    if (styleName.includes('radius') || styleName.includes('Radius')) {
      if (value.type === 'MemberExpression') {
        const tokenName = value.object?.name
        let property = value.property?.name

        // Handle bracket notation: radius['16']
        if (!property && value.computed && value.property?.type === 'StringLiteral') {
          property = value.property.value
        }

        if (tokenName === 'radius') {
          // Check if it's a numeric string in bracket notation
          if (/^\d+$/.test(property)) {
            issues.push({
              styleName,
              value: `${tokenName}['${property}']`,
            })
          } else if (!validRadiusTokens.includes(property)) {
            issues.push({
              styleName,
              value: value.computed ? `${tokenName}['${property}']` : `${tokenName}.${property}`,
            })
          }
        }
      }
    }

    if (styleName === 'textAlign') {
      issues.push({
        styleName,
        value: value.type === 'StringLiteral' ? `"${value.value}"` : '{...}',
      })
    }

    // Check numeric props that shouldn't be strings
    const numericProps = ['flex', 'flexGrow', 'flexShrink', 'borderWidth', 'zIndex', 'opacity']
    if (numericProps.includes(styleName)) {
      if (value.type === 'StringLiteral' || value.type === 'Literal') {
        const val = String(value.value)
        if (/^\d+(\.\d+)?$/.test(val)) {
          issues.push({
            styleName,
            value: `"${val}"`,
          })
        }
      }
    }
  }

  return issues
}

/**
 * Create or extend StyleSheet.create() at the end of the file
 */
export function addOrExtendStyleSheet(root, elementStyles, j) {
  if (elementStyles.length === 0) {
    return
  }

  // Build the new style properties
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
    // Extend existing StyleSheet.create()
    existingStyleSheet.forEach((path) => {
      const createCallArgs = path.node.init.arguments
      if (createCallArgs.length > 0 && createCallArgs[0].type === 'ObjectExpression') {
        createCallArgs[0].properties.push(...newStyleProperties)
      }
    })
  } else {
    // Create new StyleSheet.create()
    const styleSheetCall = j.variableDeclaration('const', [
      j.variableDeclarator(
        j.identifier('styles'),
        j.callExpression(j.memberExpression(j.identifier('StyleSheet'), j.identifier('create')), [
          j.objectExpression(newStyleProperties),
        ]),
      ),
    ])

    // Add to the end of the file
    root.find(j.Program).forEach((path) => {
      path.node.body.push(styleSheetCall)
    })
  }

  // Add StyleSheet import from react-native
  addNamedImport(root, 'react-native', 'StyleSheet', j)
}
