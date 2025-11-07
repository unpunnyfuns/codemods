/**
 * NativeBase/Common Button to Nordlys Button with extracted icon and text props
 *
 * Children extracted to text prop
 * leftIcon={<Icon name="..." />} extracted to icon="..." prop
 * rightIcon not supported (dropped with warning)
 * Variant mapping: solid/outline/ghost/link to Nordlys variant+type combinations
 * disabled becomes isDisabled, size xs becomes sm
 * onPress required (no-op added if missing)
 * Re-runnable on partially migrated files
 */

import { removeNamedImport } from '@puns/shiftkit'
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

// Button configuration
const buttonConfig = {
  sourceImport: '@hb-frontend/common/src/components',
  targetImport: '@hb-frontend/app/src/components/nordlys/Button',
  targetName: 'Button',
  tokenImport: '@hb-frontend/nordlys',
  wrap: true,
}

const stylePropsConfig = {
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
delete stylePropsConfig.size
delete stylePropsConfig.color

const directPropsList = ['onPress', 'testID', 'isLoading', 'isDisabled']

const buttonProps = {
  styleProps: stylePropsConfig,
  transformProps: {
    disabled: { targetName: 'isDisabled' },
    size: { targetName: 'size', valueMap: { xs: 'sm' } },
  },
  directProps: directPropsList,
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

/**
 * Transform a single Button element to Nordlys Button
 *
 * Returns { element, warnings, tokenHelpers, styles } instead of mutating context.
 */
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

  // Categorize props
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

  // Check if we should skip this element (manual failures)
  if (hasManualFailures && !parsedOptions.unsafe) {
    warnings.push('Button skipped - manual fixes required')
    addTodoComment(path, 'Button', invalidStyles, j)
    return { element: null, warnings }
  }

  if (hasAttribute(attributes, 'rightIcon')) {
    warnings.push('Button rightIcon not supported in Nordlys - dropped')
  }

  // Filter to keep only direct props
  const attrs = filterAttributes(attributes, {
    allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
  })

  // Add transformed props
  addTransformedProps(attrs, transformedProps, j)

  // Always set icon (undefined if no icon)
  attrs.push(createAttribute('icon', icon || j.identifier('undefined'), j))

  // Add text if present
  if (text) {
    attrs.push(createAttribute('text', text, j))
  }

  // Add defaults for required props
  if (!hasAttribute(attributes, 'onPress')) {
    attrs.push(createAttribute('onPress', j.arrowFunctionExpression([], j.blockStatement([])), j))
    warnings.push('Button: Missing onPress - added no-op handler (TODO: wire up actual handler)')
  }

  if (!hasAttribute(attributes, 'size') && !transformedProps.size) {
    attrs.push(createStringAttribute('size', 'md', j))
    warnings.push('Button: Missing size - defaulted to "md"')
  }

  // Map NativeBase variant to Nordlys variant + type
  const variant = getAttributeValue(attributes, 'variant')
  const variantValue =
    variant?.type === 'StringLiteral' ? variant.value : variant?.value || 'primary'

  let nordlysVariant = 'primary'
  let nordlysType = 'solid'

  if (variantValue === 'primary' || variantValue === 'secondary') {
    nordlysVariant = variantValue
    nordlysType = 'solid'
  } else {
    switch (variantValue) {
      case 'solid':
        nordlysVariant = 'primary'
        nordlysType = 'solid'
        break
      case 'outline':
        nordlysVariant = 'secondary'
        nordlysType = 'solid'
        break
      case 'ghost':
      case 'link':
      case 'unstyled':
        nordlysVariant = 'primary'
        nordlysType = 'ghost'
        break
      default:
        nordlysVariant = 'primary'
        nordlysType = 'solid'
    }
  }

  attrs.push(createStringAttribute('variant', nordlysVariant, j))
  attrs.push(createStringAttribute('type', nordlysType, j))

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
    element,
    warnings,
    tokenHelpers: usedTokenHelpers,
    styles: tempStyles,
  }
}

/**
 * Custom pipeline step to remove Icon if no longer used
 */
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

/**
 * Main transform - functional pipeline composition
 */
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
