// Migrate NativeBase/Common Switch → Nordlys Switch with compound components
// See switch.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import { createViewWrapper } from '../helpers/jsx-transforms.js'
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

// Switch prop mappings
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

const transformProps = {
  isChecked: 'value',
  onToggle: 'onValueChange',
  isDisabled: 'disabled',
}

const directPropsList = ['testID', 'accessibilityLabel', 'accessibilityHint']

const dropPropsList = [
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

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Switch'
  const targetName = options.targetName ?? 'Switch'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  const wrap = options.wrap ?? true // Default: true (wrap in View when style props exist)

  // Find imports
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Switch')) {
    return fileInfo.source
  }

  // Find all Switch elements
  const switchElements = root.find(j.JSXElement, { openingElement: { name: { name: 'Switch' } } })
  if (switchElements.length === 0) {
    return fileInfo.source
  }

  const elementStyles = []
  const usedTokenHelpers = new Set()
  const switchProps = {
    styleProps,
    transformProps,
    directProps: directPropsList,
    dropProps: dropPropsList,
  }

  // Transform each Switch element
  switchElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    // Extract label prop (custom transformation)
    let labelValue = null
    const labelAttr = attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === 'label',
    )
    if (labelAttr) {
      labelValue = labelAttr.value
    }

    // Categorize props using standard mappings
    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
    } = categorizeProps(attributes, switchProps, j)

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    // Store dropped props for this element

    // Build Switch props - start with direct props that pass through
    const switchAttributes = attributes.filter((attr) => {
      if (attr.type !== 'JSXAttribute' || !attr.name) {
        return false
      }
      const propName = attr.name.name
      // Keep direct props that weren't removed
      return directPropsList.includes(propName) && !propsToRemove.includes(propName)
    })

    // Add transformed props
    for (const [name, value] of Object.entries(transformedProps)) {
      switchAttributes.push(j.jsxAttribute(j.jsxIdentifier(name), value))
    }

    // Update element attributes
    path.node.openingElement.attributes = switchAttributes

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

    // Check if we need to wrap in View
    const hasStyleProps = Object.keys(styleProps).length > 0 || inlineStyles.length > 0

    if (wrap && hasStyleProps) {
      const styleName = `switch${index}`

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

      // Clone the Switch element
      const switchElement = j.jsxElement(
        path.node.openingElement,
        path.node.closingElement,
        path.node.children,
        path.node.selfClosing,
      )

      const viewElement = createViewWrapper(switchElement, styleName, j)
      j(path).replaceWith(viewElement)
    }
  })

  // Update imports
  removeNamedImport(imports, 'Switch', j)
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
