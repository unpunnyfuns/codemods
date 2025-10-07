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

// Extract and categorize props from JSX element
function extractProps(attributes, mappings, j) {
  const { STYLE_PROPS, TRANSFORM_PROPS, DROP_PROPS } = mappings
  const styleProps = {}
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
        // Apply tokenHelper transformation for string literals
        if (tokenHelper && value.type === 'StringLiteral') {
          // Transform to: tokenHelper('value')
          value = j.callExpression(j.identifier(tokenHelper), [j.stringLiteral(value.value)])
          usedTokenHelpers.add(tokenHelper)
        }
        // Apply value mapping if configured
        else if (valueMap) {
          // For string literals
          if (value.type === 'StringLiteral') {
            const mappedValue = valueMap[value.value]
            if (mappedValue !== undefined) {
              // Determine if mapped value should be numeric or string
              value =
                typeof mappedValue === 'number'
                  ? j.numericLiteral(mappedValue)
                  : j.stringLiteral(mappedValue)
            }
          }
          // For numeric literals
          else if (value.type === 'NumericLiteral') {
            const mappedValue = valueMap[value.value]
            if (mappedValue !== undefined) {
              value =
                typeof mappedValue === 'number'
                  ? j.numericLiteral(mappedValue)
                  : j.stringLiteral(mappedValue)
            }
          }
          // If no mapping found or not a literal, keep original value
        }

        // Handle multi-property expansion or single property
        if (properties) {
          // Expand to multiple properties with same value
          for (const prop of properties) {
            styleProps[prop] = value
          }
        } else {
          styleProps[styleName] = value
        }
        propsToRemove.push(attr)
      }
    }
    // Check if it should be transformed
    else if (TRANSFORM_PROPS[propName]) {
      const config = TRANSFORM_PROPS[propName]
      let newPropName
      let valueMap

      // Support both string (backward compat) and object with valueMap
      if (typeof config === 'string') {
        newPropName = config
        valueMap = null
      } else {
        newPropName = config.propName
        valueMap = config.valueMap
      }

      let value = attr.value

      // Apply value mapping if configured and value is a string literal
      if (valueMap && value?.type === 'StringLiteral') {
        const mappedValue = valueMap[value.value]
        if (mappedValue !== undefined) {
          value = j.stringLiteral(mappedValue)
        }
        // If no mapping found, keep original value
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

  return { styleProps, transformedProps, propsToRemove, usedTokenHelpers }
}

// Transform JSX elements to use target component with prop mappings
function transformElements(jsxElements, targetName, sourceComponentName, staticProps, mappings, j) {
  const elementStyles = []
  const allUsedTokenHelpers = new Set()

  jsxElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    // Extract and categorize props
    const { styleProps, transformedProps, propsToRemove, usedTokenHelpers } = extractProps(
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

    // If we extracted style props, add style prop and save for stylesheet
    if (Object.keys(styleProps).length > 0) {
      const styleName = `${sourceComponentName.toLowerCase()}${index}`
      const styleAttr = j.jsxAttribute(
        j.jsxIdentifier('style'),
        j.jsxExpressionContainer(
          j.memberExpression(j.identifier('styles'), j.identifier(styleName)),
        ),
      )
      attributes.push(styleAttr)

      elementStyles.push({ name: styleName, styles: styleProps })
    }
  })

  return { elementStyles, usedTokenHelpers: allUsedTokenHelpers }
}

// Create StyleSheet.create() at the end of the file
function addStyleSheet(root, elementStyles, j) {
  if (elementStyles.length === 0) return

  // Build the styles object
  const styleProperties = elementStyles.map(({ name, styles }) => {
    const properties = Object.entries(styles).map(([key, value]) => {
      return j.property('init', j.identifier(key), value)
    })
    return j.property('init', j.identifier(name), j.objectExpression(properties))
  })

  // Create: const styles = StyleSheet.create({ ... })
  const styleSheetCall = j.variableDeclaration('const', [
    j.variableDeclarator(
      j.identifier('styles'),
      j.callExpression(j.memberExpression(j.identifier('StyleSheet'), j.identifier('create')), [
        j.objectExpression(styleProperties),
      ]),
    ),
  ])

  // Add to the end of the file
  root.find(j.Program).forEach((path) => {
    path.node.body.push(styleSheetCall)
  })

  // Add StyleSheet import from react-native
  addNamedImport(root, 'react-native', 'StyleSheet', j)
}

function main(fileInfo, api, options = {}) {
  const {
    sourceImport = 'react-native',
    targetImport = 'aurora',
    targetName = 'Stack',
    mappings = DEFAULT_MAPPINGS,
  } = options

  // Backward compatibility: if sourceName is provided, convert to components array
  let components = options.components
  if (!components && options.sourceName) {
    components = [
      {
        name: options.sourceName,
        staticProps: options.staticProps || { direction: 'row' },
      },
    ]
  }
  if (!components) {
    components = [{ name: 'HStack', staticProps: { direction: 'row' } }]
  }

  // Normalize components array (strings to objects)
  components = components.map((comp) => {
    if (typeof comp === 'string') {
      return { name: comp, staticProps: options.staticProps || {} }
    }
    return comp
  })

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
    addNamedImport(root, '@org/aurora', helper, j)
  })

  // Add StyleSheet if we have styles
  addStyleSheet(root, allElementStyles, j)

  // Return formatted source
  return toFormattedSource(root)
}

export default main
