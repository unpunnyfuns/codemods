/**
 * NativeBase HStack/VStack to target Stack
 *
 * target uses single Stack component with direction prop
 * HStack becomes <Stack direction="horizontal">
 * VStack becomes <Stack direction="vertical">
 *
 * space prop becomes gap (must be valid space token)
 * align/justify get value mapping (start becomes flex-start, etc)
 * Re-runnable on partially migrated files
 */

import { omit } from '../lib/object-utils.js'
import { pipeline } from '../lib/pipeline.js'
import {
  applyCollectedStyles,
  applyStyleSheet,
  checkImports,
  findElements,
  initStyleContext,
  manageImports,
  parseOptions,
  transformElements,
} from '../lib/pipeline-steps.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from '../lib/imports.js'
import {
  addTransformedProps,
  buildStyleValue,
  createStringAttribute,
  filterAttributes,
  findJSXElements,
} from '../lib/jsx.js'
import { alignValues, justifyValues } from './configs/maps-values.js'
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
import { categorizeProps, validateToken, validSpaceTokens } from './props.js'

/* ===========================================================================
   Configuration
   =========================================================================== */

const stackConfig = {
  sourceImport: 'native-base',
  targetImport: '@target/components/Stack',
  targetName: 'Stack',
  tokenImport: '@design-tokens',
  wrap: false,
}

const STACK_COMPONENTS = [
  { name: 'HStack', direction: 'horizontal' },
  { name: 'VStack', direction: 'vertical' },
]

const DIRECT_PROPS = directProps

const stackProps = {
  styleProps: {
    ...omit(
      {
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
      ['space'],
    ),
    align: {
      styleName: 'alignItems',
      valueMap: alignValues,
    },
    justify: {
      styleName: 'justifyContent',
      valueMap: justifyValues,
    },
  },
  transformProps: {
    space: { targetName: 'gap' },
  },
  directProps: DIRECT_PROPS,
  dropProps: [
    ...allPseudoProps,
    ...platformPseudoProps,
    ...themePseudoProps,
    ...unsupportedProps,
    'colorScheme',
    'variant',
    'divider',
    'reversed',
    '_text',
    '_stack',
  ],
}

/* ===========================================================================
   Element Finding
   =========================================================================== */

function findStackElements(ctx) {
  const { root, j, parsedOptions } = ctx
  const { sourceImport } = parsedOptions

  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (imports.length === 0) {
    return []
  }

  const allElements = []
  const componentInfo = new Map() // Track component info by element

  for (const component of STACK_COMPONENTS) {
    if (hasNamedImport(imports, component.name)) {
      const elements = findJSXElements(root, component.name, j).paths()

      // Store component info for each element
      for (const path of elements) {
        componentInfo.set(path.node, component)
      }

      allElements.push(...elements)
    }
  }

  // Store componentInfo map on ctx for later use
  ctx.stackComponentInfo = componentInfo

  return allElements // Return array directly, findElements() will wrap it
}

/* ===========================================================================
   Transform
   =========================================================================== */

function transformStack(path, index, ctx) {
  const { j, stackComponentInfo } = ctx
  const attributes = path.node.openingElement.attributes || []
  const warnings = []

  const componentInfo = stackComponentInfo.get(path.node)
  if (!componentInfo) {
    warnings.push('Stack: Unknown component type, skipping')
    return { element: null, warnings }
  }

  const categorized = categorizeProps(attributes, stackProps, j)
  const {
    styleProps,
    inlineStyles,
    transformedProps,
    propsToRemove,
    existingStyleReferences,
    usedTokenHelpers,
  } = categorized

  // Validate gap prop if present (only validate semantic token strings, allow numbers)
  if (transformedProps.gap) {
    const gapNode = transformedProps.gap

    // Extract actual value from AST node for validation
    let gapValue = null
    let isNumeric = false

    if (gapNode.type === 'StringLiteral' || gapNode.type === 'Literal') {
      gapValue = gapNode.value
    } else if (gapNode.type === 'JSXExpressionContainer') {
      const expr = gapNode.expression
      if (expr.type === 'StringLiteral' || expr.type === 'Literal') {
        gapValue = expr.value
      } else if (expr.type === 'NumericLiteral') {
        isNumeric = true // Numeric literals are valid, don't validate
      }
    } else if (gapNode.type === 'NumericLiteral') {
      isNumeric = true // Numeric literals are valid, don't validate
    }

    // Only validate semantic token strings (not numbers, not complex expressions)
    if (gapValue !== null && !isNumeric) {
      // Check if it's a numeric string like "1", "2", etc. - these should pass through
      if (typeof gapValue === 'string' && /^\d+(\.\d+)?$/.test(gapValue)) {
        // Numeric string - pass through, don't validate as token
        // PropProcessor will convert "1" → {1} automatically
      } else {
        // Semantic token string - validate it
        const validation = validateToken(gapValue, validSpaceTokens, false)
        if (!validation.isValid) {
          warnings.push(
            `Stack: Invalid gap token "${gapValue}" (must be valid space token like xs, sm, md, etc.)`,
          )
          delete transformedProps.gap
        }
      }
    }
    // Else: numeric literal or complex expression - pass through without validation
  }

  const attrs = filterAttributes(attributes, {
    allow: DIRECT_PROPS.filter((prop) => !propsToRemove.includes(prop)),
  })

  const direction = componentInfo.direction
  attrs.push(createStringAttribute('direction', direction, j))

  addTransformedProps(attrs, transformedProps, j)

  const tempStyles = []
  const styleValue = buildStyleValue(
    styleProps,
    inlineStyles,
    `${componentInfo.name.toLowerCase()}${index}`,
    tempStyles,
    j,
    existingStyleReferences,
  )

  if (styleValue) {
    attrs.push(j.jsxAttribute(j.jsxIdentifier('style'), j.jsxExpressionContainer(styleValue)))
  }

  path.node.openingElement.name = j.jsxIdentifier('Stack')
  if (path.node.closingElement) {
    path.node.closingElement.name = j.jsxIdentifier('Stack')
  }
  path.node.openingElement.attributes = attrs

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

function manageStackImports(ctx) {
  const { root, j, parsedOptions } = ctx
  const { sourceImport, targetImport, targetName } = parsedOptions

  const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })

  for (const { name: componentName } of STACK_COMPONENTS) {
    // Replace identifier references like withAnimated(HStack) → withAnimated(Stack)
    root.find(j.Identifier, { name: componentName }).forEach((path) => {
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

    if (sourceImports.length > 0 && hasNamedImport(sourceImports, componentName)) {
      removeNamedImport(sourceImports, componentName, j)
    }
  }

  // Warn about type references that need manual migration
  const typeNames = ['HStackProps', 'VStackProps', 'IStackProps']
  for (const typeName of typeNames) {
    root.find(j.Identifier, { name: typeName }).forEach((path) => {
      const parent = path.parent.node
      // Skip import specifiers (they're being removed anyway)
      if (parent.type === 'ImportSpecifier') {
        return
      }
      ctx.warnings.push(
        `${typeName} type reference found - manual migration required (use ViewProps from 'react-native' or create custom StackProps type with direction prop)`,
      )
    })
  }

  addNamedImport(root, targetImport, targetName, j)
}

/* ===========================================================================
   Pipeline
   =========================================================================== */

export default function transform(fileInfo, api, options) {
  return pipeline(fileInfo, api, options, [
    parseOptions(stackConfig),
    checkImports(['HStack', 'VStack']),
    findElements('Stack', findStackElements),
    initStyleContext(),
    transformElements(transformStack),
    applyCollectedStyles(),
    manageImports('Stack', manageStackImports),
    applyStyleSheet(),
  ])
}
