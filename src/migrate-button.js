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

import { toFormattedSource } from './utils/formatting.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from './utils/imports.js'

function extractIconName(iconElement, j) {
  if (!iconElement || iconElement.type !== 'JSXElement') return null

  const openingElement = iconElement.openingElement
  if (!openingElement || !openingElement.name || openingElement.name.name !== 'Icon') return null

  const nameAttr = openingElement.attributes.find(
    attr => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'name'
  )

  if (!nameAttr) return null

  // Handle both string literals (Literal in JSX) and expression containers
  if (nameAttr.value.type === 'Literal' || nameAttr.value.type === 'StringLiteral') {
    return nameAttr.value.value
  } else if (nameAttr.value.type === 'JSXExpressionContainer') {
    return nameAttr.value.expression
  }

  return null
}

function extractTextFromChildren(children, j) {
  // Filter out whitespace-only text nodes
  const significantChildren = children.filter(child => {
    if (child.type === 'JSXText') {
      return child.value.trim().length > 0
    }
    return true
  })

  if (significantChildren.length === 0) return null
  if (significantChildren.length > 1) return { complex: true }

  const child = significantChildren[0]

  // Simple string literal
  if (child.type === 'JSXText') {
    return j.stringLiteral(child.value.trim())
  }

  // Expression container with simple expression
  if (child.type === 'JSXExpressionContainer') {
    const expr = child.expression

    // Identifier, call expression, member expression are all fine
    if (expr.type === 'Identifier' ||
        expr.type === 'CallExpression' ||
        expr.type === 'MemberExpression' ||
        expr.type === 'StringLiteral') {
      return expr
    }

    // Complex expressions
    return { complex: true }
  }

  // JSX elements are complex
  if (child.type === 'JSXElement') {
    return { complex: true }
  }

  return null
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport || '@hb-frontend/common/src/components'
  const targetImport = options.targetImport || '@hb-frontend/app/src/components/nordlys/Button'
  const defaultType = options.defaultType || 'solid'

  // Find imports
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Button')) return fileInfo.source

  // Find all Button elements
  const buttonElements = root.find(j.JSXElement, {
    openingElement: {
      name: {
        type: 'JSXIdentifier',
        name: 'Button'
      }
    }
  })

  if (buttonElements.length === 0) return fileInfo.source

  const warnings = []
  let migrated = 0
  let skipped = 0

  // Transform each Button element
  buttonElements.forEach((path) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    let iconValue = null
    let textValue = null
    const propsToKeep = []
    const propsToRemove = []

    // Extract leftIcon
    const leftIconAttr = attributes.find(
      attr => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'leftIcon'
    )

    if (leftIconAttr && leftIconAttr.value && leftIconAttr.value.type === 'JSXExpressionContainer') {
      const iconName = extractIconName(leftIconAttr.value.expression, j)
      if (iconName) {
        iconValue = typeof iconName === 'string' ? j.stringLiteral(iconName) : iconName
      }
    }

    // Extract text from children
    const extractedText = extractTextFromChildren(children, j)
    if (extractedText && extractedText.complex) {
      warnings.push('Button with complex children cannot be automatically migrated - requires manual conversion')
      skipped++
      return
    }
    textValue = extractedText

    // Check if we have neither icon nor text (icon-only buttons)
    if (!iconValue && !textValue) {
      warnings.push('Button without text or icon cannot be migrated (icon-only requires manual setup)')
      skipped++
      return
    }

    // Process attributes
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

      // Transform prop names
      if (propName === 'isDisabled') {
        attr.name.name = 'disabled'
        propsToKeep.push(attr)
      }
      // Keep these props as-is
      else if (['size', 'variant', 'onPress', 'testID', 'isLoading'].includes(propName)) {
        propsToKeep.push(attr)
      }
      // Drop these props
      else if (['leftIcon', 'rightIcon', '_text', '_hover', '_pressed', '_disabled', '_loading'].includes(propName)) {
        propsToRemove.push(attr)
        if (propName === 'rightIcon') {
          warnings.push('Button rightIcon not supported in Nordlys - dropped')
        }
      }
      // Drop style props (margin, padding, etc)
      else if (['m', 'mt', 'mb', 'ml', 'mr', 'mx', 'my', 'p', 'pt', 'pb', 'pl', 'pr', 'px', 'py',
                 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
                 'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
                 'w', 'h', 'width', 'height', 'bg', 'bgColor', 'backgroundColor'].includes(propName)) {
        propsToRemove.push(attr)
      }
      // Keep unknown props
      else {
        propsToKeep.push(attr)
      }
    })

    // Add icon prop if extracted
    if (iconValue) {
      const iconProp = j.jsxAttribute(
        j.jsxIdentifier('icon'),
        j.jsxExpressionContainer(iconValue)
      )
      propsToKeep.push(iconProp)
    }

    // Add text prop if extracted
    if (textValue) {
      const textProp = j.jsxAttribute(
        j.jsxIdentifier('text'),
        j.jsxExpressionContainer(textValue)
      )
      propsToKeep.push(textProp)
    }

    // Add required type prop if not present
    const hasType = propsToKeep.some(
      attr => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'type'
    )
    if (!hasType) {
      const typeProp = j.jsxAttribute(
        j.jsxIdentifier('type'),
        j.stringLiteral(defaultType)
      )
      propsToKeep.push(typeProp)
    }

    // Update element
    path.node.openingElement.attributes = propsToKeep
    path.node.children = [] // Remove children (now in text prop)
    path.node.openingElement.selfClosing = true
    path.node.closingElement = null

    migrated++
  })

  // Print warnings
  if (warnings.length > 0) {
    console.warn(`⚠️  Button migration: ${migrated} migrated, ${skipped} skipped`)
    const uniqueWarnings = [...new Set(warnings)]
    uniqueWarnings.forEach(w => console.warn(`   ${w}`))
  }

  // Update imports
  removeNamedImport(imports, 'Button', j)
  addNamedImport(root, targetImport, 'Button', j)

  return toFormattedSource(root)
}

export default main
