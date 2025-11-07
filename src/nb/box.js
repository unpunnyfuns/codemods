/**
 * NativeBase/Common Box to React Native View with StyleSheet
 *
 * Box becomes View with extracted StyleSheet
 * variant prop: explicit borderRadius values (container=12, content=8)
 * disableTopRounding/disableBottomRounding: borderRadius=0 for specific corners
 * Preprocessing converts variant/disable* to explicit borderRadius before categorization
 * Re-runnable on partially migrated files
 */

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import {
  addTransformedProps,
  buildStyleValue,
  filterAttributes,
  findJSXElements,
} from '@puns/shiftkit/jsx'
import { pipeline } from '../infrastructure/core/pipeline.js'
import {
  applyCollectedStyles,
  applyStyleSheet,
  checkImports,
  findElements,
  initStyleContext,
  manageImports,
  parseOptions,
  preprocess,
  transformElements,
} from '../infrastructure/steps/pipeline-steps.js'
import { directProps } from './configs/props-direct.js'
import {
  allPseudoProps,
  platformPseudoProps,
  themePseudoProps,
  unsupportedProps,
} from './configs/props-drop.js'
import {
  border,
  color,
  extra,
  flexbox,
  layout,
  position,
  sizing,
  spacing,
  text,
} from './configs/props-style.js'
import { getTokenValue } from './models/target-nordlys.js'
import { addElementComment, addTodoComment, categorizeProps } from './props.js'

// Box configuration
const boxConfig = {
  sourceImport: 'native-base',
  targetImport: 'react-native',
  targetName: 'View',
  tokenImport: '@hb-frontend/nordlys',
  wrap: false,
}

// Variant to borderRadius token mapping
const VARIANT_BORDER_RADIUS = {
  container: 'lg',
  content: 'md',
}

const DIRECT_PROPS = [...directProps]

const boxProps = {
  styleProps: {
    ...spacing,
    ...sizing,
    ...color,
    ...border,
    ...layout,
    ...flexbox,
    ...position,
    ...text,
    ...extra,
  },
  transformProps: {},
  directProps: DIRECT_PROPS,
  dropProps: [
    ...allPseudoProps,
    ...platformPseudoProps,
    ...themePseudoProps,
    ...unsupportedProps,
    'colorScheme',
    'variant',
    'disableTopRounding',
    'disableBottomRounding',
    'safeAreaBottom',
    'safeAreaTop',
  ],
}

/**
 * Preprocess Box attributes: convert variant and disable* props to explicit borderRadius
 *
 * This function is wrapped by preprocess() factory, so it just mutates elements in place.
 */
function preprocessBoxVariantImpl(ctx) {
  const { elements, j } = ctx

  // Process each element's attributes
  for (const path of elements) {
    const attributes = path.node.openingElement.attributes || []

    // Find variant prop to determine default borderRadius
    const variantAttr = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'variant',
    )

    let defaultBorderRadius = null
    if (variantAttr?.value?.type === 'StringLiteral') {
      const variantValue = variantAttr.value.value
      const radiusToken = VARIANT_BORDER_RADIUS[variantValue]
      if (radiusToken) {
        defaultBorderRadius = getTokenValue('radius', radiusToken)
      }
    }

    // Check if borderRadius is already explicitly set
    const borderRadius = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'borderRadius',
    )
    const borderTopRadius = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'borderTopRadius',
    )
    const borderBottomRadius = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'borderBottomRadius',
    )

    // Find disable* props
    const disableTopRounding = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'disableTopRounding',
    )
    const disableBottomRounding = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'disableBottomRounding',
    )

    // Helper to determine if a boolean prop is truthy
    const isTruthy = (attr) => {
      if (!attr || !attr.value) {
        return true // <Box disableTopRounding> means {true}
      }
      if (attr.value.type === 'JSXExpressionContainer') {
        const expr = attr.value.expression
        if (expr.type === 'BooleanLiteral' || expr.type === 'Literal') {
          return expr.value === true
        }
        return null // Conditional
      }
      return false
    }

    const addRadiusAttribute = (propName, disableAttr, explicitAttr) => {
      if (disableAttr) {
        const truthyCheck = isTruthy(disableAttr)
        if (truthyCheck === true) {
          newAttributes.push(
            j.jsxAttribute(
              j.jsxIdentifier(propName),
              j.jsxExpressionContainer(j.numericLiteral(0)),
            ),
          )
        } else if (truthyCheck === null) {
          const condition = disableAttr.value.expression
          const fallback =
            defaultBorderRadius !== null
              ? j.numericLiteral(defaultBorderRadius)
              : j.identifier('undefined')
          newAttributes.push(
            j.jsxAttribute(
              j.jsxIdentifier(propName),
              j.jsxExpressionContainer(
                j.conditionalExpression(condition, j.numericLiteral(0), fallback),
              ),
            ),
          )
        }
      } else if (defaultBorderRadius !== null && !explicitAttr && !borderRadius) {
        newAttributes.push(
          j.jsxAttribute(
            j.jsxIdentifier(propName),
            j.jsxExpressionContainer(j.numericLiteral(defaultBorderRadius)),
          ),
        )
      }
    }

    const newAttributes = []
    addRadiusAttribute('borderTopRadius', disableTopRounding, borderTopRadius)
    addRadiusAttribute('borderBottomRadius', disableBottomRounding, borderBottomRadius)

    const filteredAttributes = attributes.filter(
      (attr) =>
        !(
          attr.type === 'JSXAttribute' &&
          (attr.name?.name === 'disableTopRounding' || attr.name?.name === 'disableBottomRounding')
        ),
    )

    path.node.openingElement.attributes = [...filteredAttributes, ...newAttributes]
  }
  // No return needed - wrapped by preprocess() factory
}

/**
 * Custom element finder: Find Box elements + derived names (withAnimated(Box))
 *
 * This is used as the customFinder parameter to findElements()
 */
function findBoxElementsImpl(ctx) {
  const { root, j } = ctx

  // Find direct Box elements
  const boxElements = findJSXElements(root, 'Box', j)

  // Find derived names: const AnimatedBox = withAnimated(Box)
  const derivedNames = new Set()
  root
    .find(j.VariableDeclarator)
    .filter((path) => {
      const init = path.node.init
      if (!init) {
        return false
      }

      // Only match HOC patterns like withAnimated(Box)
      if (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression') {
        return false
      }

      if (init.type === 'CallExpression') {
        const hasBoxArg = init.arguments.some(
          (arg) => arg.type === 'Identifier' && arg.name === 'Box',
        )
        if (hasBoxArg && path.node.id && path.node.id.type === 'Identifier') {
          derivedNames.add(path.node.id.name)
          return true
        }
      }

      return false
    })
    .forEach(() => {})

  // Collect all elements
  const allElements = [...boxElements.paths()]
  for (const name of derivedNames) {
    const derivedElements = findJSXElements(root, name, j)
    allElements.push(...derivedElements.paths())
  }

  // Store derivedNames on ctx for later use
  ctx.derivedNames = derivedNames

  return allElements // Return array directly, findElements() will wrap it
}

/**
 * Transform a single Box element to View
 *
 * Returns { element, warnings, tokenHelpers, styles } instead of mutating context.
 */
function transformBox(path, index, ctx) {
  const { j, parsedOptions } = ctx
  const attributes = path.node.openingElement.attributes || []
  const elementName = path.node.openingElement.name.name
  const warnings = []

  // Categorize props
  const {
    styleProps,
    inlineStyles,
    transformedProps,
    propsToRemove,
    existingStyleReferences,
    usedTokenHelpers,
    droppedProps,
    invalidStyles,
    hasManualFailures,
  } = categorizeProps(attributes, boxProps, j)

  // Check if we should skip this element (manual failures)
  if (hasManualFailures && !parsedOptions.unsafe) {
    warnings.push('Box skipped - manual fixes required')
    addTodoComment(path, 'Box', invalidStyles, j)
    return { element: null, warnings } // Return, don't mutate!
  }

  // Filter to keep only direct props
  const attrs = filterAttributes(attributes, {
    allow: DIRECT_PROPS.filter((prop) => !propsToRemove.includes(prop)),
  })

  // Add transformed props
  addTransformedProps(attrs, transformedProps, j)

  // Build and add style prop
  const tempStyles = []
  const style = buildStyleValue(
    styleProps,
    inlineStyles,
    `box${index}`,
    tempStyles,
    j,
    existingStyleReferences,
  )

  if (style) {
    attrs.push(j.jsxAttribute(j.jsxIdentifier('style'), j.jsxExpressionContainer(style)))
  }

  // Update element name (Box → View, but keep derived names unchanged)
  if (elementName === 'Box') {
    path.node.openingElement.name = j.jsxIdentifier('View')
    if (path.node.closingElement) {
      path.node.closingElement.name = j.jsxIdentifier('View')
    }
  }
  path.node.openingElement.attributes = attrs

  // Add migration comment for dropped props and invalid styles
  addElementComment(path, droppedProps, invalidStyles, j)

  // Return results immutably
  return {
    element: path.node,
    warnings,
    tokenHelpers: usedTokenHelpers,
    styles: tempStyles,
  }
}

/**
 * Custom import management: Replace Box identifier references with View
 *
 * This is used as the customManager parameter to manageImports()
 */
function manageBoxImportsImpl(ctx) {
  const { root, j, parsedOptions, skipped } = ctx
  const { sourceImport, targetImport, targetName } = parsedOptions

  // Remove Box from source import
  const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (sourceImports.length > 0 && hasNamedImport(sourceImports, 'Box')) {
    // Only remove if no elements were skipped
    if (skipped === 0) {
      removeNamedImport(sourceImports, 'Box', j)
    } else {
      ctx.warnings.push(`Box import kept - ${skipped} element(s) skipped and still reference Box`)
    }
  }

  // Replace Box identifier references: withAnimated(Box) → withAnimated(View)
  root.find(j.Identifier, { name: 'Box' }).forEach((path) => {
    const parent = path.parent.node
    // Skip import specifiers and JSX element names (already handled)
    if (parent.type === 'ImportSpecifier') {
      return
    }
    if (parent.type === 'JSXOpeningElement' || parent.type === 'JSXClosingElement') {
      return
    }
    // Replace identifier
    path.node.name = targetName
  })

  // Check for BoxProps type references
  root.find(j.Identifier, { name: 'BoxProps' }).forEach((path) => {
    const parent = path.parent.node
    if (parent.type === 'ImportSpecifier') {
      return
    }
    ctx.warnings.push('BoxProps type reference found - manual migration required')
  })

  // Add View import
  addNamedImport(root, targetImport, targetName, j)
  // No return needed - wrapped by manageImports() factory
}

/**
 * Main transform - functional pipeline composition
 *
 * The pipeline array is self-documenting: read top-to-bottom to understand flow
 * ALL steps are factory functions (consistent pattern)
 * Transform functions return results (immutable pattern)
 */
export default function transform(fileInfo, api, options) {
  return pipeline(fileInfo, api, options, [
    parseOptions(boxConfig),
    checkImports('Box'),
    findElements('Box', findBoxElementsImpl), // Custom finder for derived names
    preprocess(preprocessBoxVariantImpl), // Preprocess variant → borderRadius
    initStyleContext(),
    transformElements(transformBox), // Returns { element, warnings, metadata }
    applyCollectedStyles(), // Applies collected metadata to styles
    manageImports('Box', manageBoxImportsImpl), // Custom manager for Box→View identifiers
    applyStyleSheet(),
  ])
}
