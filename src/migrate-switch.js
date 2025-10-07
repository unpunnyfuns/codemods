/**
 * Migrate NativeBase/Common Switch → Nordlys Switch
 *
 * Key differences:
 * - isChecked → value
 * - onToggle → onValueChange
 * - isDisabled → disabled
 * - children wrapped in <Switch.Label>
 * - label prop becomes <Switch.Description>
 *
 * Before:
 * <Switch label="Label" isChecked={bool} onToggle={fn}>
 *   Description text
 * </Switch>
 *
 * After:
 * <Switch value={bool} onValueChange={fn}>
 *   <Switch.Label>Description text</Switch.Label>
 *   <Switch.Description>Label</Switch.Description>
 * </Switch>
 */

import { addNamedImport, hasNamedImport, removeNamedImport } from './utils/imports.js'

// Switch prop mappings
const STYLE_PROPS = {}

const TRANSFORM_PROPS = {
  isChecked: 'value',
  onToggle: 'onValueChange',
  isDisabled: 'disabled',
}

const DIRECT_PROPS = [
  'testID',
  'accessibilityLabel',
  'accessibilityHint',
]

const DROP_PROPS = [
  'label',
  'switchPosition',
  'hStackProps',
  'childrenProps',
  'labelProps',
  'LeftElement',
  '_hover',
  '_pressed',
  '_disabled',
  '_focus',
  '_invalid',
  '_checked',
  '_indeterminate',
]

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport || '@hb-frontend/common/src/components'
  const targetImport = options.targetImport || '@hb-frontend/app/src/components/nordlys/Switch'

  // Find imports
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Switch')) return fileInfo.source

  // Find all Switch elements
  const switchElements = root.find(j.JSXElement, { openingElement: { name: { name: 'Switch' } } })
  if (switchElements.length === 0) return fileInfo.source

  // Transform each Switch element
  switchElements.forEach((path) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    // Extract props to transform
    let labelValue = null
    const propsToKeep = []
    const propsToRemove = []

    // Process attributes using mappings
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
      if (TRANSFORM_PROPS[propName]) {
        attr.name.name = TRANSFORM_PROPS[propName]
        propsToKeep.push(attr)
      }
      // Extract label for later (custom transformation)
      else if (propName === 'label') {
        labelValue = attr.value
        propsToRemove.push(attr)
      }
      // Drop these props
      else if (DROP_PROPS.includes(propName)) {
        propsToRemove.push(attr)
      }
      // Keep direct props as-is
      else if (DIRECT_PROPS.includes(propName)) {
        propsToKeep.push(attr)
      }
      // Keep unknown props
      else {
        propsToKeep.push(attr)
      }
    })

    // Remove dropped props
    propsToRemove.forEach((attr) => {
      const index = attributes.indexOf(attr)
      if (index > -1) attributes.splice(index, 1)
    })

    // Update attributes
    path.node.openingElement.attributes = propsToKeep

    // Transform children: wrap in <Switch.Label>
    const labelElement = j.jsxElement(
      j.jsxOpeningElement(
        j.jsxMemberExpression(j.jsxIdentifier('Switch'), j.jsxIdentifier('Label')),
        [],
      ),
      j.jsxClosingElement(
        j.jsxMemberExpression(j.jsxIdentifier('Switch'), j.jsxIdentifier('Label')),
      ),
      children,
    )

    const newChildren = [j.jsxText('\n  '), labelElement]

    // Add <Switch.Description> if label value exists
    if (labelValue) {
      const descriptionChildren =
        labelValue.type === 'JSXExpressionContainer'
          ? [j.jsxExpressionContainer(labelValue.expression)]
          : [j.jsxText(labelValue.value)]

      const descriptionElement = j.jsxElement(
        j.jsxOpeningElement(
          j.jsxMemberExpression(j.jsxIdentifier('Switch'), j.jsxIdentifier('Description')),
          [],
        ),
        j.jsxClosingElement(
          j.jsxMemberExpression(j.jsxIdentifier('Switch'), j.jsxIdentifier('Description')),
        ),
        descriptionChildren,
      )
      newChildren.push(j.jsxText('\n  '), descriptionElement)
    }

    newChildren.push(j.jsxText('\n'))
    path.node.children = newChildren
  })

  // Update imports
  removeNamedImport(imports, 'Switch', j)
  addNamedImport(root, targetImport, 'Switch', j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
