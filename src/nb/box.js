/**
 * NativeBase/Common Box to React Native View with StyleSheet
 *
 * Box becomes View with extracted StyleSheet
 * variant prop: explicit borderRadius values (container=12, content=8)
 * disableTopRounding/disableBottomRounding: borderRadius=0 for specific corners
 * Preprocessing converts variant/disable* to explicit borderRadius before categorization
 * Re-runnable on partially migrated files
 */

import { pipeline } from '../lib/pipeline.js'
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
} from '../lib/pipeline-steps.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from '../lib/imports.js'
import {
  addTransformedProps,
  buildStyleValue,
  filterAttributes,
  findJSXElements,
} from '../lib/jsx.js'
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
import { getTokenValue } from './models/target.js'
import { addElementComment, addTodoComment, categorizeProps } from './props.js'

/* ===========================================================================
   Configuration
   =========================================================================== */

const boxConfig = {
  sourceImport: 'native-base',
  targetImport: 'react-native',
  targetName: 'View',
  tokenImport: '@design-tokens',
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

/* ===========================================================================
   Preprocessing
   =========================================================================== */

function preprocessBoxVariant(ctx) {
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
}

/* ===========================================================================
   Element Finding
   =========================================================================== */

function findBoxElements(ctx) {
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

  return allElements
}

/* ===========================================================================
   Transform
   =========================================================================== */

function transformBox(path, index, ctx) {
  const { j, parsedOptions } = ctx
  const attributes = path.node.openingElement.attributes || []
  const elementName = path.node.openingElement.name.name
  const warnings = []

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

  if (hasManualFailures && !parsedOptions.unsafe) {
    // Add specific warnings for each invalid style
    for (const { styleName, value, category } of invalidStyles) {
      warnings.push(`Invalid value ${value} for ${styleName}${category ? ` (${category})` : ''}`)
    }
    warnings.push('Box skipped - manual fixes required')
    addTodoComment(path, 'Box', invalidStyles, j)
    return { element: null, warnings } // Return, don't mutate!
  }

  const attrs = filterAttributes(attributes, {
    allow: DIRECT_PROPS.filter((prop) => !propsToRemove.includes(prop)),
  })

  addTransformedProps(attrs, transformedProps, j)

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

  // Keep derived names unchanged (withAnimated(Box) stays as AnimatedBox)
  if (elementName === 'Box') {
    path.node.openingElement.name = j.jsxIdentifier('View')
    if (path.node.closingElement) {
      path.node.closingElement.name = j.jsxIdentifier('View')
    }
  }
  path.node.openingElement.attributes = attrs

  addElementComment(path, droppedProps, invalidStyles, j)

  return {
    element: path.node,
    warnings,
    tokenHelpers: usedTokenHelpers,
    styles: tempStyles,
  }
}

/* ===========================================================================
   Import Management
   =========================================================================== */

function manageBoxImports(ctx) {
  const { root, j, parsedOptions, skipped } = ctx
  const { sourceImport, targetImport, targetName } = parsedOptions

  const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (sourceImports.length > 0 && hasNamedImport(sourceImports, 'Box')) {
    if (skipped === 0) {
      removeNamedImport(sourceImports, 'Box', j)
    } else {
      ctx.warnings.push(`Box import kept - ${skipped} element(s) skipped and still reference Box`)
    }
  }

  // Replace Box identifier references like withAnimated(Box) → withAnimated(View)
  root.find(j.Identifier, { name: 'Box' }).forEach((path) => {
    const parent = path.parent.node
    // Skip import specifiers and JSX element names (already handled)
    if (parent.type === 'ImportSpecifier') {
      return
    }
    if (parent.type === 'JSXOpeningElement' || parent.type === 'JSXClosingElement') {
      return
    }
    path.node.name = targetName
  })

  root.find(j.Identifier, { name: 'BoxProps' }).forEach((path) => {
    const parent = path.parent.node
    if (parent.type === 'ImportSpecifier') {
      return
    }
    ctx.warnings.push(
      `BoxProps type reference found - manual migration required (use ViewProps from 'react-native')`,
    )
  })

  addNamedImport(root, targetImport, targetName, j)
}

/* ===========================================================================
   Pipeline
   =========================================================================== */

export default function transform(fileInfo, api, options) {
  return pipeline(fileInfo, api, options, [
    parseOptions(boxConfig),
    checkImports('Box'),
    findElements('Box', findBoxElements),
    preprocess(preprocessBoxVariant),
    initStyleContext(),
    transformElements(transformBox),
    applyCollectedStyles(),
    manageImports('Box', manageBoxImports),
    applyStyleSheet(),
  ])
}
