// Migrate NativeBase/Common Button → Nordlys Button with extracted icon and text props
// See button.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import {
  buildStyleValue,
  createViewWrapper,
  extractPropFromJSXElement,
  extractSimpleChild,
} from '@puns/shiftkit/jsx'
import { createJSXHelper } from '../helpers/factory.js'
import { createStyleContext } from '../helpers/style-context.js'
import { componentAgnostic, platformOverrides, themeOverrides } from './mappings/props-drop.js'
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
import { addElementComment, categorizeProps } from './props.js'

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
delete styleProps.size // It's a semantic Button prop, not a style prop

const transformProps = {
  isDisabled: 'disabled',
}

const directPropsList = ['size', 'variant', 'onPress', 'testID', 'isLoading', 'type']

const dropPropsList = [
  ...platformOverrides,
  ...themeOverrides,
  ...componentAgnostic,
  'colorScheme',
  'leftIcon',
  'rightIcon',
  '_text',
  '_loading',
]

const buttonProps = {
  styleProps,
  transformProps,
  directProps: directPropsList,
  dropProps: dropPropsList,
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const $ = createJSXHelper(j)
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

  const buttonElements = $.findElements(root, 'Button')

  if (buttonElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  let migrated = 0
  let skipped = 0
  const styles = createStyleContext()

  buttonElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    let iconValue = null
    let textValue = null

    const leftIconValue = $.getAttributeValue(attributes, 'leftIcon')

    if (leftIconValue) {
      const iconName = extractPropFromJSXElement(leftIconValue, 'Icon', 'name')
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

    styles.addHelpers(newHelpers)

    if ($.hasAttribute(attributes, 'rightIcon')) {
      warnings.push('Button rightIcon not supported in Nordlys - dropped')
    }

    const buttonAttributes = $.filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    $.addTransformedProps(buttonAttributes, transformedProps)

    if (iconValue) {
      buttonAttributes.push($.createAttribute('icon', iconValue))
    }

    if (textValue) {
      buttonAttributes.push($.createAttribute('text', textValue))
    }

    if (!$.hasAttribute(buttonAttributes, 'type')) {
      buttonAttributes.push($.createStringAttribute('type', defaultType))
    }

    addElementComment(path, droppedProps, invalidStyles, j)

    const buttonElement = $.createElement(targetName, buttonAttributes)

    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    if (wrap && hasStyleProps) {
      const styleName = `button${index}`

      // buildStyleValue handles complex style processing and pushes to internal array
      const tempStyles = []
      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])

      // Add the generated styles to our context
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }

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

  styles.applyToRoot(root, { wrap, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
