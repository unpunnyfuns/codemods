/**
 * Migrate NativeBase/Common Button → Nordlys Button
 *
 * Handles ~80% of common cases:
 * - Extracts icon name from <Icon name="..." /> in leftIcon
 * - Extracts simple text children (string literals, variables, call expressions)
 * - Maps props: size, variant, onPress, isDisabled→disabled, isLoading
 * - Adds required type="solid" (default, may need manual adjustment)
 * - Drops: rightIcon, style props, _text, etc
 *
 * Before:
 * <Button
 *   leftIcon={<Icon name="Plus" />}
 *   variant="secondary"
 *   size="md"
 *   onPress={fn}
 * >
 *   {t('text')}
 * </Button>
 *
 * After:
 * <Button
 *   icon="Plus"
 *   text={t('text')}
 *   variant="secondary"
 *   size="md"
 *   type="solid"
 *   onPress={fn}
 * />
 *
 * Warns when:
 * - Children are complex JSX (multiple elements, conditionals)
 * - rightIcon is used (not supported)
 * - Both icon and children are missing (icon-only not supported in migration)
 */

import { dropProps } from './mappings/drop-props.js'
import {
  border,
  color,
  extra,
  flexbox,
  layout,
  position,
  sizing,
  spacing,
} from './mappings/style-props.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from './utils/imports.js'
import { extractPropFromJSXElement, extractSimpleChild } from './utils/jsx-extraction.js'
import { createViewWrapper } from './utils/jsx-transforms.js'
import { addOrExtendStyleSheet, categorizeProps } from './utils/props.js'

// Button prop mappings
const styleProps = {
  ...spacing,
  ...sizing,
  ...color,
  ...border,
  ...layout,
  ...flexbox,
  ...position,
  ...extra,
}

// Remove size from STYLE_PROPS - it's a semantic Button prop, not a style prop
delete styleProps.size

const transformProps = {
  isDisabled: 'disabled',
}

const directPropsList = ['size', 'variant', 'onPress', 'testID', 'isLoading', 'type']

const dropPropsList = [...dropProps, 'leftIcon', 'rightIcon', '_text', '_loading']

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Button'
  const targetName = options.targetName ?? 'Button'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  const defaultType = options.defaultType ?? 'solid'
  const wrap = options.wrap ?? true // Default: true (wrap in View when style props exist)

  // Find imports
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Button')) {
    return fileInfo.source
  }

  // Find all Button elements
  const buttonElements = root.find(j.JSXElement, {
    openingElement: {
      name: {
        type: 'JSXIdentifier',
        name: 'Button',
      },
    },
  })

  if (buttonElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  let migrated = 0
  let skipped = 0
  const elementStyles = []
  const usedTokenHelpers = new Set()
  const buttonProps = {
    styleProps,
    transformProps,
    directProps: directPropsList,
    dropProps: dropPropsList,
  }

  // Transform each Button element
  buttonElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    let iconValue = null
    let textValue = null

    // Extract leftIcon
    const leftIconAttr = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'leftIcon',
    )

    if (leftIconAttr?.value && leftIconAttr.value.type === 'JSXExpressionContainer') {
      const iconName = extractPropFromJSXElement(leftIconAttr.value.expression, 'Icon', 'name')
      if (iconName) {
        iconValue = typeof iconName === 'string' ? j.stringLiteral(iconName) : iconName
      }
    }

    // Extract text from children
    const { value: extractedText, isComplex } = extractSimpleChild(children, j)
    if (isComplex) {
      warnings.push(
        'Button with complex children cannot be automatically migrated - requires manual conversion',
      )
      skipped++
      return
    }
    textValue = extractedText

    // Check if we have neither icon nor text (icon-only buttons)
    if (!iconValue && !textValue) {
      warnings.push(
        'Button without text or icon cannot be migrated (icon-only requires manual setup)',
      )
      skipped++
      return
    }

    // Categorize props (handles style/transform/direct/drop)
    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
    } = categorizeProps(attributes, buttonProps, j)

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    // Check for rightIcon warning
    if (
      attributes.some((attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'rightIcon')
    ) {
      warnings.push('Button rightIcon not supported in Nordlys - dropped')
    }

    // Build Button props - start with direct props that pass through
    const buttonAttributes = attributes.filter((attr) => {
      if (attr.type !== 'JSXAttribute' || !attr.name) {
        return false
      }
      const propName = attr.name.name
      // Keep direct props that weren't removed
      return directPropsList.includes(propName) && !propsToRemove.includes(propName)
    })

    // Add transformed props
    for (const [name, value] of Object.entries(transformedProps)) {
      buttonAttributes.push(j.jsxAttribute(j.jsxIdentifier(name), value))
    }

    // Add icon prop if extracted
    if (iconValue) {
      buttonAttributes.push(
        j.jsxAttribute(j.jsxIdentifier('icon'), j.jsxExpressionContainer(iconValue)),
      )
    }

    // Add text prop if extracted
    if (textValue) {
      buttonAttributes.push(
        j.jsxAttribute(j.jsxIdentifier('text'), j.jsxExpressionContainer(textValue)),
      )
    }

    // Add required type prop if not present
    const hasType = buttonAttributes.some(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'type',
    )
    if (!hasType) {
      buttonAttributes.push(j.jsxAttribute(j.jsxIdentifier('type'), j.stringLiteral(defaultType)))
    }

    // Create Button element
    const buttonElement = j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier(targetName), buttonAttributes, true),
      null,
      [],
    )

    // Check if we need to wrap in View
    const hasStyleProps = Object.keys(styleProps).length > 0 || inlineStyles.length > 0

    if (wrap && hasStyleProps) {
      const styleName = `button${index}`

      // Build style object
      const styleObj = {}
      for (const key of Object.keys(styleProps)) {
        styleObj[key] = styleProps[key]
      }

      elementStyles.push({ name: styleName, styles: styleObj })

      // TODO: handle inline styles
      if (inlineStyles.length > 0) {
        // Not yet supported
      }

      const viewElement = createViewWrapper(buttonElement, styleName, j)
      path.replace(viewElement)
    } else {
      // No wrapping needed or disabled
      path.replace(buttonElement)
    }

    migrated++
  })

  // Print warnings
  if (warnings.length > 0) {
    console.warn(`⚠️  Button migration: ${migrated} migrated, ${skipped} skipped`)
    const uniqueWarnings = [...new Set(warnings)]
    for (const w of uniqueWarnings) {
      console.warn(`   ${w}`)
    }
  }

  // Update imports
  removeNamedImport(imports, 'Button', j)
  addNamedImport(root, targetImport, targetName, j)

  // Add View and StyleSheet imports if we have wrapped elements
  if (wrap && elementStyles.length > 0) {
    addNamedImport(root, 'react-native', 'View', j)
    addNamedImport(root, 'react-native', 'StyleSheet', j)
    for (const h of usedTokenHelpers) {
      addNamedImport(root, tokenImport, h, j)
    }
  }

  // Add StyleSheet
  if (wrap && elementStyles.length > 0) {
    addOrExtendStyleSheet(root, elementStyles, j)
  }

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
