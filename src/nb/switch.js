/**
 * NativeBase/Common Switch to Nordlys Switch with compound components
 *
 * Children become <Switch.Label>
 * label prop becomes <Switch.Description>
 * isChecked -> value, onToggle/onChange -> onValueChange, isDisabled -> disabled
 * Style props wrapped in View
 * Re-runnable on partially migrated files
 */

import {
  addTransformedProps,
  buildStyleValue,
  cloneElement,
  createMemberElement,
  createViewWrapper,
  filterAttributes,
  findAttribute,
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

// Switch configuration
const switchConfig = {
  sourceImport: '@hb-frontend/common/src/components',
  targetImport: '@hb-frontend/app/src/components/nordlys/Switch',
  targetName: 'Switch',
  tokenImport: '@hb-frontend/nordlys',
  wrap: true,
}

const directPropsList = [...accessibility, 'value', 'onValueChange', 'disabled']

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
  directProps: directPropsList,
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

/**
 * Transform a single Switch element to Nordlys Switch with compound components
 *
 * Returns { element, warnings, tokenHelpers, styles } instead of mutating context.
 */
function transformSwitch(path, index, ctx) {
  const { j, parsedOptions } = ctx
  const attributes = path.node.openingElement.attributes || []
  const children = path.node.children || []
  const warnings = []

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

  // Check if we should skip this element (manual failures)
  if (hasManualFailures && !parsedOptions.unsafe) {
    warnings.push('Switch skipped - manual fixes required')
    addTodoComment(path, 'Switch', invalidStyles, j)
    return { element: null, warnings }
  }

  // Filter to keep only direct props
  const attrs = filterAttributes(attributes, {
    allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
  })

  // Add transformed props
  addTransformedProps(attrs, transformedProps, j)

  // Update element attributes
  path.node.openingElement.attributes = attrs

  // Add migration comment for dropped props and invalid styles
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

    // Return wrapped element
    return {
      element: wrapper,
      warnings,
      tokenHelpers: usedTokenHelpers,
      styles: tempStyles,
    }
  }

  // Return unwrapped element
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
