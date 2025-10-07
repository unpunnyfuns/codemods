/**
 * Migrate NativeBase/Common Avatar → Nordlys Avatar
 *
 * Key transformations:
 * - iconName="name" → icon={{ name: "name", fill: "blue" }}
 * - imageUri="url" → image={{ source: { uri: "url" } }}
 * - imageSource={source} → image={{ source }}
 * - letters not supported (drop with warning)
 *
 * Before:
 * <Avatar iconName="user" size="md" bgColor="blue" />
 * <Avatar imageUri="https://..." size="lg" />
 * <Avatar letters="AB" size="sm" />
 *
 * After:
 * <Avatar icon={{ name: "user", fill: "blue" }} size="md" />
 * <Avatar image={{ source: { uri: "https://..." } }} size="lg" />
 * // Warning: Avatar with letters prop cannot be migrated (not supported in Nordlys)
 */

import { toFormattedSource } from './utils/formatting.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from './utils/imports.js'

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport || '@hb-frontend/common/src/components'
  const targetImport = options.targetImport || '@hb-frontend/app/src/components/nordlys/Avatar'

  // Find imports
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Avatar')) return fileInfo.source

  // Find all Avatar elements (excluding Avatar.Badge and Avatar.Group)
  const avatarElements = root.find(j.JSXElement, {
    openingElement: {
      name: {
        type: 'JSXIdentifier',
        name: 'Avatar',
      },
    },
  })

  if (avatarElements.length === 0) return fileInfo.source

  const warnings = []

  // Transform each Avatar element
  avatarElements.forEach((path) => {
    const attributes = path.node.openingElement.attributes || []

    let iconNameValue = null
    let imageUriValue = null
    let imageSourceValue = null
    let lettersValue = null
    const propsToKeep = []
    const propsToRemove = []

    // First pass: collect values
    attributes.forEach((attr) => {
      if (attr.type !== 'JSXAttribute') {
        propsToKeep.push(attr)
        return
      }
      if (!attr.name || attr.name.type !== 'JSXIdentifier') {
        propsToKeep.push(attr)
        return
      }

      const propName = attr.name.name

      if (propName === 'iconName') {
        iconNameValue = attr.value
        propsToRemove.push(attr)
      } else if (propName === 'imageUri') {
        imageUriValue = attr.value
        propsToRemove.push(attr)
      } else if (propName === 'imageSource') {
        imageSourceValue = attr.value
        propsToRemove.push(attr)
      } else if (propName === 'letters') {
        lettersValue = attr.value
        propsToRemove.push(attr)
      }
      // Drop these props
      else if (
        [
          'lettersColor',
          'bgColor',
          'isSecondaryColor',
          'placeholder',
          'resizeMode',
          'source',
          'bg',
          'w',
          'h',
        ].includes(propName)
      ) {
        propsToRemove.push(attr)
      }
      // Keep size, testID, etc
      else {
        propsToKeep.push(attr)
      }
    })

    // Second pass: add transformed props
    if (iconNameValue) {
      // iconName → icon={{ name: "...", fill: "blue" }}
      const nameValue =
        iconNameValue.type === 'JSXExpressionContainer' ? iconNameValue.expression : iconNameValue

      const iconObject = j.objectExpression([
        j.property('init', j.identifier('name'), nameValue),
        j.property('init', j.identifier('fill'), j.stringLiteral('blue')),
      ])

      const iconProp = j.jsxAttribute(j.jsxIdentifier('icon'), j.jsxExpressionContainer(iconObject))
      propsToKeep.push(iconProp)
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
      propsToKeep.push(imageProp)
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
      propsToKeep.push(imageProp)
    } else if (lettersValue) {
      // letters not supported - warn and skip element transformation
      warnings.push('Avatar with letters prop cannot be migrated (not supported in Nordlys Avatar)')
      return
    }

    // Update attributes
    path.node.openingElement.attributes = propsToKeep
  })

  // Print warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Avatar migration warnings:')
    warnings.forEach((w) => console.warn(`   ${w}`))
  }

  // Update imports
  removeNamedImport(imports, 'Avatar', j)
  addNamedImport(root, targetImport, 'Avatar', j)

  return toFormattedSource(root)
}

export default main
