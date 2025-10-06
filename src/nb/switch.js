/**
 * NativeBase/Common Switch to target Switch with compound components
 *
 * Children become <Switch.Label>
 * label prop becomes <Switch.Description>
 * isChecked -> value, onToggle/onChange -> onValueChange, isDisabled -> disabled
 * Style props wrapped in View
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
  transformElements,
} from '../lib/pipeline-steps.js'
import {
  addTransformedProps,
  buildStyleValue,
  cloneElement,
  createMemberElement,
  createViewWrapper,
  filterAttributes,
  findAttribute,
} from '../lib/jsx.js'
import { accessibility } from './configs/props-direct.js'
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
  text,
} from './configs/props-style.js'
import { addElementComment, addTodoComment, categorizeProps } from './props.js'

/* ===========================================================================
   Configuration
   =========================================================================== */

const switchConfig = {
  sourceImport: '@source/components',
  targetImport: '@target/components/Switch',
  targetName: 'Switch',
  tokenImport: '@design-tokens',
  wrap: true,
}

const DIRECT_PROPS = [...accessibility, 'value', 'onValueChange', 'disabled']

const switchProps = {
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
  transformProps: {
    isChecked: { targetName: 'value' },
    onToggle: { targetName: 'onValueChange' },
    onChange: { targetName: 'onValueChange' },
    isDisabled: { targetName: 'disabled' },
  },
  directProps: DIRECT_PROPS,
  dropProps: [
    ...allPseudoProps,
    'label',
    'switchPosition',
    'hStackProps',
    'childrenProps',
    'labelProps',
    'LeftElement',
  ],
}

/* ===========================================================================
   Transform
   =========================================================================== */

function transformSwitch(path, index, ctx) {
  const { j, parsedOptions } = ctx
  const attributes = path.node.openingElement.attributes || []
  const children = path.node.children || []
  const warnings = []

  // Detect conflicting handlers - both map to onValueChange, can't auto-resolve
  const hasOnToggle = attributes.some((a) => a.name?.name === 'onToggle')
  const hasOnChange = attributes.some((a) => a.name?.name === 'onChange')
  if (hasOnToggle && hasOnChange) {
    warnings.push('Switch has both onToggle and onChange - manual fix required')
    addTodoComment(path, 'Switch', ['Has both onToggle and onChange - pick one'], j)
    return { element: null, warnings }
  }

  // Extract label prop to transform into <Switch.Description>
  const label = findAttribute(attributes, 'label')?.value ?? null

  const categorized = categorizeProps(attributes, switchProps, j)
  const {
    styleProps,
    inlineStyles,
    transformedProps,
    propsToRemove,
    usedTokenHelpers,
    droppedProps,
    invalidStyles,
    hasManualFailures,
  } = categorized

  if (hasManualFailures && !parsedOptions.unsafe) {
    warnings.push('Switch skipped - manual fixes required')
    addTodoComment(path, 'Switch', invalidStyles, j)
    return { element: null, warnings }
  }

  const attrs = filterAttributes(attributes, {
    allow: DIRECT_PROPS.filter((prop) => !propsToRemove.includes(prop)),
  })

  addTransformedProps(attrs, transformedProps, j)

  path.node.openingElement.attributes = attrs

  addElementComment(path, droppedProps, invalidStyles, j)

  // Create <Switch.Label> from children
  const labelElement = createMemberElement('Switch', 'Label', [], children, j)
  const newChildren = [j.jsxText('\n  '), labelElement]

  // Add <Switch.Description> if label prop exists
  if (label) {
    const descriptionChildren =
      label.type === 'JSXExpressionContainer'
        ? [j.jsxExpressionContainer(label.expression)]
        : [j.jsxText(label.value)]

    const descriptionElement = createMemberElement(
      'Switch',
      'Description',
      [],
      descriptionChildren,
      j,
    )
    newChildren.push(j.jsxText('\n  '), descriptionElement)
  }

  newChildren.push(j.jsxText('\n'))
  path.node.children = newChildren

  // Build and add style prop if needed
  const tempStyles = []
  const hasStyles = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

  if (parsedOptions.wrap && hasStyles) {
    const styleName = `switch${index}`
    const element = cloneElement(path.node, j)
    const style = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
    const wrapper = createViewWrapper(element, style, j)

    return {
      element: wrapper,
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
    parseOptions(switchConfig),
    checkImports('Switch'),
    findElements('Switch'),
    initStyleContext(),
    transformElements(transformSwitch),
    applyCollectedStyles(),
    manageImports('Switch'),
    applyStyleSheet(),
  ])
}
