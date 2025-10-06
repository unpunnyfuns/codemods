/**
 * NativeBase Typography to target Typography with wrapper View
 *
 * Typography element unchanged (same component name)
 * Text props (type, size, color, align, numberOfLines) stay on Typography
 * Font props (fontFamily, fontSize, fontWeight, lineHeight) DROPPED (managed internally)
 * External style props (spacing, colors, layout) wrapped in View
 *
 * API Mappings:
 * - type: heading→headline, body→content, label→supporting, action→interactive
 * - size: preserved (xs→xs, sm→sm, md→md, lg→lg, xl→xl, xxl→2xl, xxxl→3xl)
 * - color: NativeBase ColorPath → target ColorPath (e.g., text.brand→brand.primary)
 * - textAlign → align
 *
 * Missing props get sensible defaults:
 * - Missing type → 'content' (target equivalent of NativeBase Text/body)
 * - Missing size → 'md' (14px, standard body text)
 *
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
import {
  addTransformedProps,
  buildStyleValue,
  cloneElement,
  createViewWrapper,
  filterAttributes,
} from '../lib/jsx.js'
import { accessibility, eventHandlers } from './configs/props-direct.js'
import { allPseudoProps } from './configs/props-drop.js'
import {
  border,
  color,
  extra,
  flexbox,
  layout,
  position,
  sizing,
  spacing,
} from './configs/props-style.js'
import { TYPOGRAPHY_RESTRICTED_PROPS } from './models/target.js'
import { getTargetColorPath } from './models/transforms-colors.js'
import { categorizeProps } from './props.js'

/* ===========================================================================
   Configuration
   =========================================================================== */

const typographyConfig = {
  sourceImport: '@source/components',
  targetImport: '@target/components/Typography',
  targetName: 'Typography',
  tokenImport: '@design-tokens',
  wrap: true,
}

const TYPE_MAP = {
  heading: 'headline',
  body: 'content',
  label: 'supporting',
  action: 'interactive',
  headline: 'headline',
  content: 'content',
  supporting: 'supporting',
  interactive: 'interactive',
}

const SIZE_MAP = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  xxl: '2xl',
  xxxl: '3xl',
}

const typographyProps = {
  styleProps: omit(
    {
      ...spacing,
      ...sizing,
      ...color,
      ...border,
      ...layout,
      ...flexbox,
      ...position,
      ...extra,
    },
    ['textAlign', 'size', 'boxSize'],
  ),
  transformProps: {
    textAlign: { targetName: 'align' },
  },
  directProps: [
    'type',
    'size',
    'color',
    'align',
    'numberOfLines',
    'textDecorationLine',
    ...accessibility,
    ...eventHandlers,
  ],
  dropProps: [...allPseudoProps, ...TYPOGRAPHY_RESTRICTED_PROPS.managed],
}

/* ===========================================================================
   Transform
   =========================================================================== */

function transformTypography(path, index, ctx) {
  const { j } = ctx
  const attributes = path.node.openingElement.attributes || []
  const warnings = []

  const categorized = categorizeProps(attributes, typographyProps, j)
  const {
    styleProps,
    inlineStyles,
    transformedProps,
    propsToRemove,
    droppedProps,
    existingStyleReferences,
    usedTokenHelpers,
  } = categorized

  // Warn about dropped font props
  for (const { name } of droppedProps) {
    if (TYPOGRAPHY_RESTRICTED_PROPS.managed.includes(name)) {
      warnings.push(`Typography: Dropped ${name} prop (managed internally by target Typography)`)
    }
  }

  const attrs = filterAttributes(attributes, {
    allow: typographyProps.directProps.filter((prop) => !propsToRemove.includes(prop)),
  })

  // Add any non-string transformed props
  addTransformedProps(attrs, transformedProps, j)

  // Add defaults for missing required props
  const hasType = attrs.some((attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'type')
  const hasSize = attrs.some((attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'size')

  if (!hasType) {
    attrs.push(j.jsxAttribute(j.jsxIdentifier('type'), j.stringLiteral('content')))
    warnings.push('Typography: Missing type prop - defaulted to "content"')
  }

  if (!hasSize) {
    attrs.push(j.jsxAttribute(j.jsxIdentifier('size'), j.stringLiteral('md')))
    warnings.push('Typography: Missing size prop - defaulted to "md"')
  }

  // Helper to transform color strings within AST nodes
  const transformColorString = (node) => {
    if (node.type === 'StringLiteral' && typeof node.value === 'string') {
      node.value = getTargetColorPath(node.value)
    }
  }

  // Map type/size/color values in place
  for (const attr of attrs) {
    if (attr.type !== 'JSXAttribute' || !attr.name) {
      continue
    }

    const propName = attr.name.name

    // Handle string literal values
    if (attr.value?.type === 'StringLiteral') {
      const value = attr.value.value

      // Map type value
      if (propName === 'type' && TYPE_MAP[value]) {
        attr.value.value = TYPE_MAP[value]
      }
      // Map size value
      else if (propName === 'size' && SIZE_MAP[value]) {
        attr.value.value = SIZE_MAP[value]
      }
      // Map color path
      else if (propName === 'color') {
        attr.value.value = getTargetColorPath(value)
      }
    }
    // Handle expression containers (e.g., conditionals, template literals)
    else if (propName === 'color' && attr.value?.type === 'JSXExpressionContainer') {
      const expr = attr.value.expression

      // Handle conditional expressions: {condition ? 'color1' : 'color2'}
      if (expr.type === 'ConditionalExpression') {
        transformColorString(expr.consequent)
        transformColorString(expr.alternate)
      }
      // Handle template literals: {`text.${variant}`} - transform literal parts
      else if (expr.type === 'TemplateLiteral') {
        for (const quasi of expr.quasis) {
          if (quasi.value?.cooked) {
            const transformed = getTargetColorPath(quasi.value.cooked)
            if (transformed !== quasi.value.cooked) {
              quasi.value.cooked = transformed
              quasi.value.raw = transformed
            }
          }
        }
      }
      // Handle plain string literals in expressions: {'text.brand'}
      else if (expr.type === 'StringLiteral') {
        transformColorString(expr)
      }
    }
  }

  path.node.openingElement.attributes = attrs

  // Wrap in View if style props exist
  const hasStyles = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0
  const tempStyles = []

  if (typographyConfig.wrap && hasStyles) {
    const typographyElement = cloneElement(path.node, j)
    const styleValue = buildStyleValue(
      styleProps,
      inlineStyles,
      `typography${index}`,
      tempStyles,
      j,
      existingStyleReferences,
    )
    const wrappedElement = createViewWrapper(typographyElement, styleValue, j)

    return {
      element: wrappedElement,
      warnings,
      tokenHelpers: usedTokenHelpers,
      styles: tempStyles,
    }
  }

  return {
    element: path.node,
    warnings,
    tokenHelpers: usedTokenHelpers,
    styles: tempStyles,
  }
}

/* ===========================================================================
   Pipeline
   =========================================================================== */

export default function transform(fileInfo, api, options) {
  return pipeline(fileInfo, api, options, [
    parseOptions(typographyConfig),
    checkImports('Typography'),
    findElements('Typography'),
    initStyleContext(),
    transformElements(transformTypography),
    applyCollectedStyles(),
    manageImports('Typography'),
    applyStyleSheet(),
  ])
}
