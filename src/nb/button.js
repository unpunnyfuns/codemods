/**
 * NativeBase/Common Button to target Button with extracted icon and text props
 *
 * Children extracted to text prop
 * leftIcon={<Icon name="..." />} extracted to icon="..." prop
 * rightIcon not supported (dropped with warning)
 * Variant mapping: solid/outline/ghost/link to target variant+type combinations
 * disabled becomes isDisabled, size xs becomes sm
 * onPress required (skipped if missing - buttons need handlers)
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
import { removeNamedImport } from '../lib/imports.js'
import {
  addTransformedProps,
  buildStyleValue,
  createAttribute,
  createSelfClosingElement,
  createStringAttribute,
  createViewWrapper,
  extractPropFromJSXElement,
  extractSimpleChild,
  filterAttributes,
  getAttributeValue,
  hasAttribute,
} from '../lib/jsx.js'
import { directProps } from './configs/props-direct.js'
import { platformPseudoProps, themePseudoProps, unsupportedProps } from './configs/props-drop.js'
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

const buttonConfig = {
  sourceImport: '@source/components',
  targetImport: '@target/components/Button',
  targetName: 'Button',
  tokenImport: '@design-tokens',
  wrap: true,
}

const STYLE_PROPS = {
  ...spacing,
  ...sizing,
  ...color,
  ...border,
  ...layout,
  ...flexbox,
  ...position,
  ...text,
  ...extra,
}
delete STYLE_PROPS.size
delete STYLE_PROPS.color

const DIRECT_PROPS = [...directProps, 'isLoading', 'isDisabled']

const buttonProps = {
  styleProps: STYLE_PROPS,
  transformProps: {
    disabled: { targetName: 'isDisabled' },
    size: { targetName: 'size', valueMap: { xs: 'sm' } },
  },
  directProps: DIRECT_PROPS,
  dropProps: [
    ...platformPseudoProps,
    ...themePseudoProps,
    ...unsupportedProps,
    'colorScheme',
    'leftIcon',
    'rightIcon',
    '_text',
    '_loading',
  ],
}

/* ===========================================================================
   Transform
   =========================================================================== */

function transformButton(path, index, ctx) {
  const { j, parsedOptions } = ctx
  const attributes = path.node.openingElement.attributes || []
  const children = path.node.children || []
  const warnings = []

  // Extract icon from leftIcon prop
  let icon = null
  const leftIcon = getAttributeValue(attributes, 'leftIcon')
  if (leftIcon) {
    const iconName = extractPropFromJSXElement(leftIcon, 'Icon', 'name')
    if (iconName) {
      icon = typeof iconName === 'string' ? j.stringLiteral(iconName) : iconName
    }
  }

  // Extract text from children
  const { value: extractedText, isComplex } = extractSimpleChild(children, j, {
    allowedExpressionTypes: [
      'Identifier',
      'CallExpression',
      'MemberExpression',
      'StringLiteral',
      'ConditionalExpression',
      'TemplateLiteral',
      'LogicalExpression',
      'BinaryExpression',
      'NumericLiteral',
      'BooleanLiteral',
    ],
  })

  if (isComplex) {
    warnings.push('Button with complex children cannot be automatically migrated')
    return { element: null, warnings }
  }

  const text = extractedText

  if (!icon && !text) {
    warnings.push('Button without text or icon cannot be migrated - empty button')
    return { element: null, warnings }
  }

  const categorized = categorizeProps(attributes, buttonProps, j)
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
    warnings.push('Button skipped - manual fixes required')
    addTodoComment(path, 'Button', invalidStyles, j)
    return { element: null, warnings }
  }

  if (hasAttribute(attributes, 'rightIcon')) {
    warnings.push('Button rightIcon not supported in target - dropped')
  }

  const attrs = filterAttributes(attributes, {
    allow: DIRECT_PROPS.filter((prop) => !propsToRemove.includes(prop)),
  })

  addTransformedProps(attrs, transformedProps, j)

  // Always set icon (undefined if no icon)
  attrs.push(createAttribute('icon', icon || j.identifier('undefined'), j))

  // Add text if present
  if (text) {
    attrs.push(createAttribute('text', text, j))
  }

  // Fail if onPress is missing - buttons without handlers are broken
  if (!hasAttribute(attributes, 'onPress')) {
    warnings.push('Button missing onPress - manual fix required')
    addTodoComment(path, 'Button', ['Missing onPress handler'], j)
    return { element: null, warnings }
  }

  if (!hasAttribute(attributes, 'size') && !transformedProps.size) {
    attrs.push(createStringAttribute('size', 'md', j))
    warnings.push('Button: Missing size - defaulted to "md"')
  }

  // Map NativeBase variant to target variant + type
  const variant = getAttributeValue(attributes, 'variant')
  const variantValue =
    variant?.type === 'StringLiteral' ? variant.value : variant?.value || 'primary'

  let targetVariant = 'primary'
  let targetType = 'solid'

  if (variantValue === 'primary' || variantValue === 'secondary') {
    targetVariant = variantValue
    targetType = 'solid'
  } else {
    switch (variantValue) {
      case 'solid':
        targetVariant = 'primary'
        targetType = 'solid'
        break
      case 'outline':
        targetVariant = 'secondary'
        targetType = 'solid'
        break
      case 'ghost':
      case 'link':
      case 'unstyled':
        targetVariant = 'primary'
        targetType = 'ghost'
        break
      default:
        targetVariant = 'primary'
        targetType = 'solid'
    }
  }

  attrs.push(createStringAttribute('variant', targetVariant, j))
  attrs.push(createStringAttribute('type', targetType, j))

  // Add migration comment
  addElementComment(path, droppedProps, invalidStyles, j)

  // Create self-closing element
  const element = createSelfClosingElement(parsedOptions.targetName, attrs, j)

  // Build and add style prop if needed
  const tempStyles = []
  const hasStyles = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

  if (parsedOptions.wrap && hasStyles) {
    const styleName = `button${index}`
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
    element,
    warnings,
    tokenHelpers: usedTokenHelpers,
    styles: tempStyles,
  }
}

/* ===========================================================================
   Import Cleanup
   =========================================================================== */

function cleanupIconImports(ctx) {
  const { root, j } = ctx

  // Check for Icon imports and remove if no longer used
  const iconImports = root.find(j.ImportDeclaration).filter((path) => {
    return (path.node.specifiers || []).some(
      (spec) => spec.type === 'ImportSpecifier' && spec.imported.name === 'Icon',
    )
  })

  if (iconImports.length > 0) {
    const iconJSXUsages = root.find(j.JSXElement, {
      openingElement: { name: { name: 'Icon' } },
    })

    const iconIdentifierUsages = root.find(j.Identifier, { name: 'Icon' })

    let nonImportUsages = 0
    iconIdentifierUsages.forEach((path) => {
      if (path.parent.node.type === 'ImportSpecifier') {
        return
      }
      nonImportUsages++
    })

    if (iconJSXUsages.length === 0 && nonImportUsages === 0) {
      removeNamedImport(iconImports, 'Icon', j)
    }
  }

  return { ctx }
}

/* ===========================================================================
   Pipeline
   =========================================================================== */

export default function transform(fileInfo, api, options) {
  return pipeline(fileInfo, api, options, [
    parseOptions(buttonConfig),
    checkImports('Button'),
    findElements('Button'),
    initStyleContext(),
    transformElements(transformButton),
    applyCollectedStyles(),
    manageImports('Button'),
    cleanupIconImports,
    applyStyleSheet(),
  ])
}
