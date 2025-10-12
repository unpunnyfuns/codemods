// Migrate NativeBase/Common Avatar -> Nordlys Avatar with object-based props
// See avatar.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import { buildStyleValue, createViewWrapper } from '@puns/shiftkit/jsx'
import { createJSXHelper } from '../helpers/factory.js'
import { createStyleContext } from '../helpers/style-context.js'
import { accessibility } from './mappings/props-direct.js'
import { allPseudoProps } from './mappings/props-drop.js'
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

// Avatar prop mappings
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
delete styleProps.size

const transformProps = {}

const directPropsList = ['size', ...accessibility]

const dropPropsList = [
  ...allPseudoProps,
  'iconName',
  'imageUri',
  'imageSource',
  'letters',
  'lettersColor',
  'isSecondaryColor',
  'placeholder',
  'resizeMode',
  'source',
]

const avatarProps = {
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
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Avatar'
  const targetName = options.targetName ?? 'Avatar'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  // Default: true (wrap in View when style props exist)
  const wrap = options.wrap ?? true

  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Avatar')) {
    return fileInfo.source
  }

  const avatarElements = $.findElements(root, 'Avatar')

  if (avatarElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  const styles = createStyleContext()

  avatarElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    const iconNameValue = $.getAttributeValue(attributes, 'iconName')
    const imageUriValue = $.getAttributeValue(attributes, 'imageUri')
    const imageSourceValue = $.getAttributeValue(attributes, 'imageSource')
    const lettersValue = $.getAttributeValue(attributes, 'letters')

    // Warn and skip if letters prop is used (not supported)
    if (lettersValue) {
      warnings.push('Avatar with letters prop cannot be migrated (not supported in Nordlys Avatar)')
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
    } = categorizeProps(attributes, avatarProps, j)

    styles.addHelpers(newHelpers)

    const avatarAttributes = $.filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    $.addTransformedProps(avatarAttributes, transformedProps)

    if (iconNameValue) {
      const iconObject = $.createNestedObject({
        name: iconNameValue,
        fill: 'blue',
      })
      avatarAttributes.push($.createAttribute('icon', iconObject))
    } else if (imageUriValue) {
      const imageObject = $.createNestedObject({
        source: { uri: imageUriValue },
      })
      avatarAttributes.push($.createAttribute('image', imageObject))
    } else if (imageSourceValue) {
      const imageObject = $.createNestedObject({ source: imageSourceValue })
      avatarAttributes.push($.createAttribute('image', imageObject))
    }

    path.node.openingElement.attributes = avatarAttributes

    addElementComment(path, droppedProps, invalidStyles, j)

    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    if (wrap && hasStyleProps) {
      const styleName = `avatar${index}`

      const avatarElement = $.clone(path.node)

      const tempStyles = []
      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }

      const viewElement = createViewWrapper(avatarElement, styleValue, j)
      j(path).replaceWith(viewElement)
    }
  })

  if (warnings.length > 0) {
    console.warn('⚠️  Avatar migration warnings:')
    for (const w of warnings) {
      console.warn(`   ${w}`)
    }
  }

  removeNamedImport(imports, 'Avatar', j)
  addNamedImport(root, targetImport, targetName, j)

  styles.applyToRoot(root, { wrap, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
