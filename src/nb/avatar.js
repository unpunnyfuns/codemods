// Migrate NativeBase/Common Avatar → Nordlys Avatar with object-based props
// See avatar.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import { buildStyleValue, createViewWrapper } from '../helpers/jsx-transforms.js'
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
import { addOrExtendStyleSheet, categorizeProps } from './props.js'

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

const directPropsList = ['size', 'testID', 'accessibilityLabel']

const dropPropsList = [
  'iconName',
  'imageUri',
  'imageSource',
  'letters',
  'lettersColor',
  'isSecondaryColor',
  'placeholder',
  'resizeMode',
  'source',
  '_hover',
  '_pressed',
  '_focus',
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

  // Find imports
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Avatar')) {
    return fileInfo.source
  }

  // Find all Avatar elements (excluding Avatar.Badge and Avatar.Group)
  const avatarElements = root.find(j.JSXElement, {
    openingElement: {
      name: {
        type: 'JSXIdentifier',
        name: 'Avatar',
      },
    },
  })

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

  // Transform each Avatar element
  avatarElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    // Extract custom Avatar props
    let iconNameValue = null
    let imageUriValue = null
    let imageSourceValue = null
    let lettersValue = null

    const iconNameAttr = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'iconName',
    )
    if (iconNameAttr) {
      iconNameValue = iconNameAttr.value
    }

    const imageUriAttr = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'imageUri',
    )
    if (imageUriAttr) {
      imageUriValue = imageUriAttr.value
    }

    const imageSourceAttr = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'imageSource',
    )
    if (imageSourceAttr) {
      imageSourceValue = imageSourceAttr.value
    }

    const lettersAttr = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'letters',
    )
    if (lettersAttr) {
      lettersValue = lettersAttr.value
    }

    // Warn and skip if letters prop is used (not supported)
    if (lettersValue) {
      warnings.push('Avatar with letters prop cannot be migrated (not supported in Nordlys Avatar)')
      return
    }

    // Categorize props using standard mappings
    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
    } = categorizeProps(attributes, avatarProps, j)

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    // Store dropped props for this element

    // Build Avatar props - start with direct props that pass through
    const avatarAttributes = attributes.filter((attr) => {
      if (attr.type !== 'JSXAttribute' || !attr.name) {
        return false
      }
      const propName = attr.name.name
      // Keep direct props that weren't removed
      return directPropsList.includes(propName) && !propsToRemove.includes(propName)
    })

    // Add transformed props
    for (const [name, value] of Object.entries(transformedProps)) {
      avatarAttributes.push(j.jsxAttribute(j.jsxIdentifier(name), value))
    }

    // Add custom transformed props
    if (iconNameValue) {
      // iconName → icon={{ name: "...", fill: "blue" }}
      const nameValue =
        iconNameValue.type === 'JSXExpressionContainer' ? iconNameValue.expression : iconNameValue

      const iconObject = j.objectExpression([
        j.property('init', j.identifier('name'), nameValue),
        j.property('init', j.identifier('fill'), j.stringLiteral('blue')),
      ])

      const iconProp = j.jsxAttribute(j.jsxIdentifier('icon'), j.jsxExpressionContainer(iconObject))
      avatarAttributes.push(iconProp)
    } else if (imageUriValue) {
      // imageUri → image={{ source: { uri: "..." } }}
      const uriValue =
        imageUriValue.type === 'JSXExpressionContainer' ? imageUriValue.expression : imageUriValue

      const imageObject = j.objectExpression([
        j.property(
          'init',
          j.identifier('source'),
          j.objectExpression([j.property('init', j.identifier('uri'), uriValue)]),
        ),
      ])

      const imageProp = j.jsxAttribute(
        j.jsxIdentifier('image'),
        j.jsxExpressionContainer(imageObject),
      )
      avatarAttributes.push(imageProp)
    } else if (imageSourceValue) {
      // imageSource → image={{ source }}
      const sourceValue =
        imageSourceValue.type === 'JSXExpressionContainer'
          ? imageSourceValue.expression
          : imageSourceValue

      const imageObject = j.objectExpression([
        j.property('init', j.identifier('source'), sourceValue),
      ])

      const imageProp = j.jsxAttribute(
        j.jsxIdentifier('image'),
        j.jsxExpressionContainer(imageObject),
      )
      avatarAttributes.push(imageProp)
    }

    // Update element attributes
    path.node.openingElement.attributes = avatarAttributes

    // Check if we need to wrap in View
    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    if (wrap && hasStyleProps) {
      const styleName = `avatar${index}`

      // Clone the Avatar element
      const avatarElement = j.jsxElement(
        path.node.openingElement,
        path.node.closingElement,
        path.node.children,
        path.node.selfClosing,
      )

      // Build style value and create View wrapper
      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, elementStyles, j, [])
      const viewElement = createViewWrapper(avatarElement, styleValue, j)
      j(path).replaceWith(viewElement)
    }
  })

  // Print warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Avatar migration warnings:')
    for (const w of warnings) {
      console.warn(`   ${w}`)
    }
  }

  // Update imports
  removeNamedImport(imports, 'Avatar', j)
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
