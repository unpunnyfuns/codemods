/**
 * Generic engine for migrating NativeBase components with configurable prop mappings
 * This is a programmatic API - use component-specific wrappers (migrate-stack, etc.) for CLI
 *
 * Accepts prop mappings with 4 categories:
 * - STYLE_PROPS: Extracted to StyleSheet (e.g., m → margin, space → gap)
 * - TRANSFORM_PROPS: Renamed on element (e.g., align → alignItems)
 * - DIRECT_PROPS: Passed through unchanged (e.g., testID, onPress)
 * - DROP_PROPS: Removed entirely (e.g., divider, _text)
 *
 * Options:
 * - sourceImport: The import path to look for (default: 'react-native')
 * - components: Array of component configs or strings (default: derived from sourceName for backward compat)
 * - targetImport: The import path to use (default: 'aurora')
 * - targetName: The new component name (default: 'Stack')
 * - mappings: Object with STYLE_PROPS, TRANSFORM_PROPS, DIRECT_PROPS, DROP_PROPS (default: basic style props)
 * - staticProps: Object of props to add (backward compat, or per-component via components array)
 *
 * Component configs can be:
 * - String: 'HStack' (uses default staticProps)
 * - Object: { name: 'HStack', staticProps: { direction: 'row' } }
 */

import { toFormattedSource } from './utils/formatting.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from './utils/imports.js'
import { extractOptions, normalizeComponents } from './utils/options.js'
import { buildNestedMemberExpression } from './utils/token-helpers.js'
import { getNordlysColorPath } from './mappings/color-mappings.js'

// Default mappings for backward compatibility (basic style props only)
const DEFAULT_MAPPINGS = {
  STYLE_PROPS: {
    m: 'margin',
    mt: 'marginTop',
    mb: 'marginBottom',
    ml: 'marginLeft',
    mr: 'marginRight',
    mx: 'marginHorizontal',
    my: 'marginVertical',
    p: 'padding',
    pt: 'paddingTop',
    pb: 'paddingBottom',
    pl: 'paddingLeft',
    pr: 'paddingRight',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    space: 'gap',
  },
  TRANSFORM_PROPS: {},
  DIRECT_PROPS: [],
  DROP_PROPS: [],
}

// Check if a value can be extracted to StyleSheet (literal or token helper reference)
function canExtractToStyleSheet(value, isTokenHelper = false) {
  if (!value) return false

  // Literals can be extracted
  if (value.type === 'StringLiteral' || value.type === 'NumericLiteral' || value.type === 'BooleanLiteral') {
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

// Extract and categorize props from JSX element
function extractProps(attributes, mappings, j) {
  const { STYLE_PROPS, TRANSFORM_PROPS, DROP_PROPS } = mappings
  const styleProps = {}
  const inlineStyles = {}
  const transformedProps = {}
  const propsToRemove = []
  const usedTokenHelpers = new Set()

  attributes.forEach((attr) => {
    if (attr.type !== 'JSXAttribute') return
    if (!attr.name || attr.name.type !== 'JSXIdentifier') return

    const propName = attr.name.name

    // Check if it should be extracted to stylesheet
    if (STYLE_PROPS[propName]) {
      const config = STYLE_PROPS[propName]
      let styleName
      let properties
      let valueMap
      let tokenHelper

      // Support both string (backward compat) and object with styleName/properties/valueMap/tokenHelper
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
      } else if (attr.value?.type === 'StringLiteral') {
        value = attr.value
      }

      if (value) {
        let processedValue = value
        let isTokenHelperCall = false

        // Apply tokenHelper transformation for string literals
        if (tokenHelper && value.type === 'StringLiteral') {
          // Transform to: tokenHelper.value (e.g., radius.md)
          // Supports nested paths: "background.secondary" → color.background.secondary
          let tokenPath = value.value

          // Apply color remapping if this is a color token
          if (tokenHelper === 'color') {
            tokenPath = getNordlysColorPath(tokenPath)
          }

          processedValue = buildNestedMemberExpression(j, tokenHelper, tokenPath)
          usedTokenHelpers.add(tokenHelper)
          isTokenHelperCall = true
        }
        // Apply value mapping if configured
        else if (valueMap) {
          // For string literals
          if (value.type === 'StringLiteral') {
            const mappedValue = valueMap[value.value]
            if (mappedValue !== undefined) {
              // Determine if mapped value should be numeric or string
              processedValue =
                typeof mappedValue === 'number'
                  ? j.numericLiteral(mappedValue)
                  : j.stringLiteral(mappedValue)
            }
          }
          // For numeric literals
          else if (value.type === 'NumericLiteral') {
            const mappedValue = valueMap[value.value]
            if (mappedValue !== undefined) {
              processedValue =
                typeof mappedValue === 'number'
                  ? j.numericLiteral(mappedValue)
                  : j.stringLiteral(mappedValue)
            }
          }
          // If no mapping found or not a literal, keep original value
        }

        // Decide whether to extract to StyleSheet or keep inline
        const targetStyles = canExtractToStyleSheet(processedValue, isTokenHelperCall)
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
    // Check if it should be transformed
    else if (TRANSFORM_PROPS[propName]) {
      const config = TRANSFORM_PROPS[propName]
      let newPropName
      let valueMap
      let tokenHelper

      // Support both string (backward compat) and object with valueMap/tokenHelper
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
        // Transform to: tokenHelper.value (e.g., space.md)
        // Supports nested paths: "background.secondary" → color.background.secondary
        let tokenPath = value.value

        // Apply color remapping if this is a color token
        if (tokenHelper === 'color') {
          tokenPath = getNordlysColorPath(tokenPath)
        }

        value = j.jsxExpressionContainer(buildNestedMemberExpression(j, tokenHelper, tokenPath))
        usedTokenHelpers.add(tokenHelper)
      }
      // Apply value mapping if configured and value is a string literal
      else if (valueMap && value?.type === 'StringLiteral') {
        const mappedValue = valueMap[value.value]
        if (mappedValue !== undefined) {
          value = j.jsxExpressionContainer(j.stringLiteral(mappedValue))
        }
        // If no mapping found, keep original value
      }
      // Wrap other expression types back in JSXExpressionContainer
      else if (value && value.type !== 'StringLiteral' && attr.value?.type === 'JSXExpressionContainer') {
        value = j.jsxExpressionContainer(value)
      }
      // Keep StringLiteral as-is for JSX attributes
      else if (value?.type === 'StringLiteral') {
        // Already correct format
      }

      transformedProps[newPropName] = value
      propsToRemove.push(attr)
    }
    // Check if it should be dropped
    else if (DROP_PROPS.includes(propName)) {
      propsToRemove.push(attr)
    }
    // DIRECT_PROPS stay on the element as-is
  })

  return { styleProps, inlineStyles, transformedProps, propsToRemove, usedTokenHelpers }
}

// Transform JSX elements to use target component with prop mappings
function transformElements(jsxElements, targetName, sourceComponentName, staticProps, mappings, j) {
  const elementStyles = []
  const allUsedTokenHelpers = new Set()

  jsxElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    // Extract and categorize props
    const { styleProps, inlineStyles, transformedProps, propsToRemove, usedTokenHelpers } = extractProps(
      attributes,
      mappings,
      j,
    )

    // Track token helpers used across all elements
    for (const helper of usedTokenHelpers) {
      allUsedTokenHelpers.add(helper)
    }

    // Remove the mapped props from the element
    propsToRemove.forEach((attr) => {
      const attrIndex = attributes.indexOf(attr)
      if (attrIndex > -1) {
        attributes.splice(attrIndex, 1)
      }
    })

    // Update element name
    path.node.openingElement.name.name = targetName
    if (path.node.closingElement) {
      path.node.closingElement.name.name = targetName
    }

    // Add transformed props
    Object.entries(transformedProps).forEach(([key, value]) => {
      const propAttr = j.jsxAttribute(j.jsxIdentifier(key), value)
      attributes.push(propAttr)
    })

    // Add static props
    Object.entries(staticProps).forEach(([key, value]) => {
      const propAttr = j.jsxAttribute(j.jsxIdentifier(key), j.stringLiteral(value))
      attributes.push(propAttr)
    })

    // Build style prop value
    let styleValue = null

    // If we have StyleSheet styles, reference styles.name
    if (Object.keys(styleProps).length > 0) {
      const styleName = `${sourceComponentName.toLowerCase()}${index}`
      styleValue = j.memberExpression(j.identifier('styles'), j.identifier(styleName))
      elementStyles.push({ name: styleName, styles: styleProps })
    }

    // If we have inline styles, create inline object
    if (Object.keys(inlineStyles).length > 0) {
      const inlineProperties = Object.entries(inlineStyles).map(([key, value]) => {
        return j.property('init', j.identifier(key), value)
      })
      const inlineObject = j.objectExpression(inlineProperties)

      // If we also have StyleSheet styles, combine them in an array
      if (styleValue) {
        styleValue = j.arrayExpression([styleValue, inlineObject])
      } else {
        styleValue = inlineObject
      }
    }

    // Add style prop if we have any styles
    if (styleValue) {
      const styleAttr = j.jsxAttribute(
        j.jsxIdentifier('style'),
        j.jsxExpressionContainer(styleValue),
      )
      attributes.push(styleAttr)
    }
  })

  return { elementStyles, usedTokenHelpers: allUsedTokenHelpers }
}

// Create or extend StyleSheet.create() at the end of the file
function addStyleSheet(root, elementStyles, j) {
  if (elementStyles.length === 0) return

  // Build the new style properties
  const newStyleProperties = elementStyles.map(({ name, styles }) => {
    const properties = Object.entries(styles).map(([key, value]) => {
      return j.property('init', j.identifier(key), value)
    })
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
        // Add new properties to existing object
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

function main(fileInfo, api, options = {}) {
  // Extract standard options with defaults
  const { sourceImport, targetImport, targetName, tokenImport, mappings } = extractOptions(options, {
    tokenImport: '@hb-frontend/nordlys',
    mappings: DEFAULT_MAPPINGS,
  })

  // Normalize components array (handles backward compat)
  const components = normalizeComponents(options, { name: 'HStack', staticProps: { direction: 'row' } })

  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Find imports from the source module
  const imports = root.find(j.ImportDeclaration, {
    source: {
      value: sourceImport,
    },
  })

  // Bail early if no imports from source module
  if (!imports.length) {
    return fileInfo.source
  }

  let transformed = false
  const allElementStyles = []
  const usedTargetNames = new Set()
  const allUsedTokenHelpers = new Set()

  // Process each component
  components.forEach((component) => {
    const { name: componentName, staticProps, targetName: compTargetName } = component

    // Use per-component targetName if provided, otherwise use global
    const effectiveTargetName = compTargetName || targetName

    // Check if this component is imported
    if (!hasNamedImport(imports, componentName)) {
      return
    }

    // Find all JSX elements using this component
    const jsxElements = root.find(j.JSXElement, {
      openingElement: {
        name: {
          name: componentName,
        },
      },
    })

    if (jsxElements.length) {
      const { elementStyles, usedTokenHelpers } = transformElements(
        jsxElements,
        effectiveTargetName,
        componentName,
        staticProps,
        mappings,
        j,
      )
      allElementStyles.push(...elementStyles)
      for (const helper of usedTokenHelpers) {
        allUsedTokenHelpers.add(helper)
      }
      removeNamedImport(imports, componentName, j)
      usedTargetNames.add(effectiveTargetName)
      transformed = true
    }
  })

  // Bail if nothing was transformed
  if (!transformed) {
    return fileInfo.source
  }

  // Add imports for all used target components
  usedTargetNames.forEach((name) => {
    addNamedImport(root, targetImport, name, j)
  })

  // Add token helper imports
  allUsedTokenHelpers.forEach((helper) => {
    addNamedImport(root, tokenImport, helper, j)
  })

  // Add StyleSheet if we have styles
  addStyleSheet(root, allElementStyles, j)

  // Return formatted source
  return toFormattedSource(root)
}

export default main
