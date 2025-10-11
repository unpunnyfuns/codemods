// Migrate NativeBase/Common Avatar → Nordlys Avatar with object-based props
// See avatar.md for documentation

import { createNestedObject } from '../helpers/ast-builders.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import {
  addTransformedProps,
  createAttribute,
  filterAttributes,
  getAttributeValue,
} from '../helpers/jsx-attributes.js'
import { cloneElement } from '../helpers/jsx-clone.js'
import { findJSXElements } from '../helpers/jsx-elements.js'
import { buildStyleValue, createViewWrapper } from '../helpers/jsx-transforms.js'
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
import { addElementComment, addOrExtendStyleSheet, categorizeProps } from './props.js'

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

// Remove size from STYLE_PROPS - it's a semantic Avatar prop, not a style prop
delete styleProps.size

const transformProps = {}

const directPropsList = ['size', ...accessibility]

const dropPropsList = [
  ...allPseudoProps,
  // Avatar-specific props (transformed via custom logic)
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

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
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

  const avatarElements = findJSXElements(root, 'Avatar', j)

  if (avatarElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  const elementStyles = []
  const usedTokenHelpers = new Set()
  const avatarProps = {
    styleProps,
    transformProps,
    directProps: directPropsList,
    dropProps: dropPropsList,
  }

  avatarElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    const iconNameValue = getAttributeValue(attributes, 'iconName')
    const imageUriValue = getAttributeValue(attributes, 'imageUri')
    const imageSourceValue = getAttributeValue(attributes, 'imageSource')
    const lettersValue = getAttributeValue(attributes, 'letters')

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

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    const avatarAttributes = filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    addTransformedProps(avatarAttributes, transformedProps, j)

    if (iconNameValue) {
      // iconName → icon={{ name: "...", fill: "blue" }}
      const iconObject = createNestedObject(
        {
          name: iconNameValue,
          fill: 'blue',
        },
        j,
      )
      avatarAttributes.push(createAttribute('icon', iconObject, j))
    } else if (imageUriValue) {
      // imageUri → image={{ source: { uri: "..." } }}
      const imageObject = createNestedObject(
        {
          source: { uri: imageUriValue },
        },
        j,
      )
      avatarAttributes.push(createAttribute('image', imageObject, j))
    } else if (imageSourceValue) {
      // imageSource → image={{ source }}
      const imageObject = createNestedObject({ source: imageSourceValue }, j)
      avatarAttributes.push(createAttribute('image', imageObject, j))
    }

    path.node.openingElement.attributes = avatarAttributes

    addElementComment(path, droppedProps, invalidStyles, j)

    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    if (wrap && hasStyleProps) {
      const styleName = `avatar${index}`

      const avatarElement = cloneElement(path.node, j)

      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, elementStyles, j, [])
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
