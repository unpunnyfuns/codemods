/**
 * NativeBase-specific prop categorization and transformation utilities
 * Handles prop mapping, StyleSheet extraction, and NativeBase→Nordlys token remapping
 */

import { addNamedImport } from '../helpers/imports.js'
import { buildNestedMemberExpression } from '../helpers/token-helpers.js'
import { getNordlysColorPath } from './mappings/color-mappings.js'

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

  attributes.forEach((attr) => {
    if (attr.type !== 'JSXAttribute') {
      return
    }
    if (!attr.name || attr.name.type !== 'JSXIdentifier') {
      return
    }

    const propName = attr.name.name

    // Check if it should be extracted to stylesheet
    if (stylePropMappings[propName]) {
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
function formatPropValue(attr, j) {
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
 * Add a comment at the end of the file listing dropped props
 * droppedPropsMap: Map of element index -> array of {name, attr}
 */
export function addDroppedPropsComment(root, droppedPropsMap, componentName, j) {
  if (droppedPropsMap.size === 0) {
    return
  }

  // Build comment lines
  const lines = ['\nDropped props during migration:']

  for (const [elementIndex, props] of droppedPropsMap.entries()) {
    if (props.length > 0) {
      const elementName = `${componentName.toLowerCase()}${elementIndex}`
      lines.push(`  ${elementName}:`)

      for (const { name, attr } of props) {
        const value = formatPropValue(attr, j)
        lines.push(`    ${name}=${value}`)
      }
    }
  }

  const commentText = lines.join('\n') + '\n'

  // Add comment block to the end of the program body
  root.find(j.Program).forEach((path) => {
    const comment = j.commentBlock(commentText, true, false)
    // Add blank expression statement with the comment
    const emptyStatement = j.emptyStatement()
    emptyStatement.comments = [comment]
    path.node.body.push(emptyStatement)
  })
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
