/**
 * NativeBase Typography to Nordlys Typography with wrapper View
 *
 * Typography element unchanged (same component name)
 * Text props (type, size, color, align, numberOfLines) stay on Typography
 * Font props (fontFamily, fontSize, fontWeight, lineHeight) DROPPED (managed internally)
 * External style props (spacing, colors, layout) wrapped in View
 *
 * API Mappings:
 * - type: heading→headline, body→content, label→supporting
 * - size: xs→sm, lg/xl/xxl/xxxl→md
 * - color: NativeBase ColorPath → Nordlys ColorPath
 *
 * Re-runnable on partially migrated files
 */

import {
  addTransformedProps,
  buildStyleValue,
  cloneElement,
  createViewWrapper,
  filterAttributes,
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
  transformElements,
} from '../infrastructure/steps/pipeline-steps.js'
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
import { omit } from './helpers/object-utils.js'
import { TYPOGRAPHY_RESTRICTED_PROPS } from './models/target-nordlys.js'
import { getNordlysColorPath } from './models/transforms-colors.js'
import { categorizeProps } from './props.js'

// Typography configuration
const typographyConfig = {
  sourceImport: '@hb-frontend/common/src/components',
  targetImport: '@hb-frontend/app/src/components/nordlys/Typography',
  targetName: 'Typography',
  tokenImport: '@hb-frontend/nordlys',
  wrap: true,
}

const TYPE_MAP = {
  heading: 'headline',
  body: 'content',
  label: 'supporting',
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
  transformProps: {},
  directProps: [
    'type',
    'size',
    'color',
    'align',
    'textAlign',
    'numberOfLines',
    'textDecorationLine',
    ...accessibility,
    ...eventHandlers,
  ],
  dropProps: [...allPseudoProps, ...TYPOGRAPHY_RESTRICTED_PROPS.managed],
}

/**
 * Transform a single Typography element to Nordlys Typography
 *
 * Returns { element, warnings, tokenHelpers, styles } instead of mutating context.
 */
function transformTypography(path, index, ctx) {
  const { j } = ctx
  const attributes = path.node.openingElement.attributes || []
  const warnings = []

  // Categorize props
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
      warnings.push(`Typography: Dropped ${name} prop (managed internally by Nordlys Typography)`)
    }
  }

  // Filter to keep only direct props
  const attrs = filterAttributes(attributes, {
    allow: typographyProps.directProps.filter((prop) => !propsToRemove.includes(prop)),
  })

  // Add any non-string transformed props
  addTransformedProps(attrs, transformedProps, j)

  // Map type/size/color values in place (keeps StringLiteral format)
  for (const attr of attrs) {
    if (attr.type !== 'JSXAttribute' || !attr.name || attr.value?.type !== 'StringLiteral') {
      continue
    }

    const propName = attr.name.name
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
      attr.value.value = getNordlysColorPath(value)
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

/**
 * Main transform - functional pipeline composition
 */
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
