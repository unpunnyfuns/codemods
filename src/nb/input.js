/**
 * NativeBase Input to target Input (simple cases only)
 *
 * placeholder -> label, onChangeText -> onChange, isDisabled -> disabled
 * Style props wrapped in View
 * Complex props (InputLeftElement, InputRightElement, multiline, secureTextEntry) generate warnings
 * label and onChange required (warnings if missing)
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
  createSelfClosingElement,
  createViewWrapper,
  filterAttributes,
  hasAttribute,
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
import { categorizeProps } from './props.js'

/* ===========================================================================
   Configuration
   =========================================================================== */

const inputConfig = {
  sourceImport: 'native-base',
  targetImport: '@target/components/Input',
  targetName: 'Input',
  tokenImport: '@design-tokens',
  wrap: true,
}

const COMPLEX_PROPS = [
  'InputLeftElement',
  'InputRightElement',
  'multiline',
  'numberOfLines',
  'secureTextEntry',
  'variant',
  'size',
]

const DIRECT_PROPS = ['value', 'keyboardType', 'onBlur', 'error', ...accessibility]

const inputProps = {
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
    placeholder: { targetName: 'label' },
    onChangeText: { targetName: 'onChange' },
    isDisabled: { targetName: 'disabled' },
  },
  directProps: DIRECT_PROPS,
  dropProps: [...allPseudoProps, 'variant', 'size', '_focus', '_input'],
}

/* ===========================================================================
   Transform
   =========================================================================== */

function transformInput(path, index, ctx) {
  const { j } = ctx
  const attributes = path.node.openingElement.attributes || []
  const warnings = []

  const categorized = categorizeProps(attributes, inputProps, j)
  const { styleProps, inlineStyles, transformedProps, propsToRemove, usedTokenHelpers } =
    categorized

  // Check for complex props and warn
  for (const attr of attributes) {
    if (attr.type === 'JSXAttribute' && attr.name && COMPLEX_PROPS.includes(attr.name.name)) {
      warnings.push(`Input: Complex prop "${attr.name.name}" may need manual migration`)
    }
  }

  // Build attributes (include complex props in allow list)
  const allowList = [...DIRECT_PROPS, ...COMPLEX_PROPS].filter(
    (prop) => !propsToRemove.includes(prop),
  )
  const attrs = filterAttributes(attributes, { allow: allowList })

  addTransformedProps(attrs, transformedProps, j)

  // Check required props
  if (!hasAttribute(attrs, 'label')) {
    warnings.push('Input: Missing required "label" prop (transformed from "placeholder")')
  }
  if (!hasAttribute(attrs, 'onChange')) {
    warnings.push('Input: Missing required "onChange" prop (transformed from "onChangeText")')
  }

  const inputElement = createSelfClosingElement('Input', attrs, j)

  // Wrap in View if style props exist
  const hasStyles = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0
  const tempStyles = []

  if (inputConfig.wrap && hasStyles) {
    const styleName = `input${index}`
    const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
    const wrappedElement = createViewWrapper(inputElement, styleValue, j)

    return {
      element: wrappedElement,
      warnings,
      tokenHelpers: usedTokenHelpers,
      styles: tempStyles,
    }
  }

  return {
    element: inputElement,
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
    parseOptions(inputConfig),
    checkImports('Input'),
    findElements('Input'),
    initStyleContext(),
    transformElements(transformInput),
    applyCollectedStyles(),
    manageImports('Input'),
    applyStyleSheet(),
  ])
}
