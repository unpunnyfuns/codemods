// Migrate NativeBase/Common Button → Nordlys Button with extracted icon and text props
// See button.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import { extractPropFromJSXElement, extractSimpleChild } from '../helpers/jsx-extraction.js'
import { buildStyleValue, createViewWrapper } from '../helpers/jsx-transforms.js'
import {
  allPseudoProps,
  componentAgnostic,
  platformOverrides,
  themeOverrides,
} from './mappings/props-drop.js'
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
} from './mappings/props-style.js'
import { addElementComment, addOrExtendStyleSheet, categorizeProps } from './props.js'

// Button prop mappings
const styleProps = {
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

// Remove size from STYLE_PROPS - it's a semantic Button prop, not a style prop
delete styleProps.size

const transformProps = {
  isDisabled: 'disabled',
}

// Direct props: 'size' and 'variant' pass through to Nordlys Button
const directPropsList = ['size', 'variant', 'onPress', 'testID', 'isLoading', 'type']

// Explicit drop list for Button
// NOTE: Does NOT include themeProps because Button keeps 'size' and 'variant' as direct props
// Only drops 'colorScheme' from themeProps
const dropPropsList = [
  ...allPseudoProps,
  ...platformOverrides,
  ...themeOverrides,
  ...componentAgnostic,
  // From themeProps, but keep 'size' and 'variant'
  'colorScheme',
  'leftIcon',
  'rightIcon',
  '_text',
  '_loading',
]

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Button'
  const targetName = options.targetName ?? 'Button'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  const defaultType = options.defaultType ?? 'solid'
  // Default: true (wrap in View when style props exist)
  const wrap = options.wrap ?? true

  // import { Button } from '@hb-frontend/common/src/components'
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Button')) {
    return fileInfo.source
  }

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

  buttonElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    let iconValue = null
    let textValue = null

    const leftIconAttr = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'leftIcon',
    )

    if (leftIconAttr?.value && leftIconAttr.value.type === 'JSXExpressionContainer') {
      const iconName = extractPropFromJSXElement(leftIconAttr.value.expression, 'Icon', 'name')
      if (iconName) {
        iconValue = typeof iconName === 'string' ? j.stringLiteral(iconName) : iconName
      }
    }

    const { value: extractedText, isComplex } = extractSimpleChild(children, j)
    if (isComplex) {
      warnings.push(
        'Button with complex children cannot be automatically migrated - requires manual conversion',
      )
      skipped++
      return
    }
    textValue = extractedText

    if (!iconValue && !textValue) {
      warnings.push(
        'Button without text or icon cannot be migrated (icon-only requires manual setup)',
      )
      skipped++
      return
    }

    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
      droppedProps,
      invalidStyles,
    } = categorizeProps(attributes, buttonProps, j)

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    if (
      attributes.some((attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'rightIcon')
    ) {
      warnings.push('Button rightIcon not supported in Nordlys - dropped')
    }

    const buttonAttributes = attributes.filter((attr) => {
      if (attr.type !== 'JSXAttribute' || !attr.name) {
        return false
      }
      const propName = attr.name.name
      return directPropsList.includes(propName) && !propsToRemove.includes(propName)
    })

    for (const [name, value] of Object.entries(transformedProps)) {
      buttonAttributes.push(j.jsxAttribute(j.jsxIdentifier(name), value))
    }

    if (iconValue) {
      buttonAttributes.push(
        j.jsxAttribute(j.jsxIdentifier('icon'), j.jsxExpressionContainer(iconValue)),
      )
    }

    if (textValue) {
      buttonAttributes.push(
        j.jsxAttribute(j.jsxIdentifier('text'), j.jsxExpressionContainer(textValue)),
      )
    }

    const hasType = buttonAttributes.some(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'type',
    )
    if (!hasType) {
      buttonAttributes.push(j.jsxAttribute(j.jsxIdentifier('type'), j.stringLiteral(defaultType)))
    }

    addElementComment(path, droppedProps, invalidStyles, j)

    const buttonElement = j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier(targetName), buttonAttributes, true),
      null,
      [],
    )

    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    if (wrap && hasStyleProps) {
      const styleName = `button${index}`

      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, elementStyles, j, [])
      const viewElement = createViewWrapper(buttonElement, styleValue, j)
      path.replace(viewElement)
    } else {
      path.replace(buttonElement)
    }

    migrated++
  })

  if (warnings.length > 0) {
    console.warn(`⚠️  Button migration: ${migrated} migrated, ${skipped} skipped`)
    const uniqueWarnings = [...new Set(warnings)]
    for (const w of uniqueWarnings) {
      console.warn(`   ${w}`)
    }
  }

  removeNamedImport(imports, 'Button', j)
  addNamedImport(root, targetImport, targetName, j)

  if (wrap && elementStyles.length > 0) {
    addNamedImport(root, 'react-native', 'View', j)
    addNamedImport(root, 'react-native', 'StyleSheet', j)
    for (const h of usedTokenHelpers) {
      addNamedImport(root, tokenImport, h, j)
    }
  }

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
