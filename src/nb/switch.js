// Migrate NativeBase/Common Switch → Nordlys Switch with compound components
// See switch.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import { filterAttributes, findAttribute } from '../helpers/jsx-attributes.js'
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

const directPropsList = accessibility

const dropPropsList = [
  ...allPseudoProps,
  // Switch-specific props
  'label',
  'switchPosition',
  'hStackProps',
  'childrenProps',
  'labelProps',
  'LeftElement',
]

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Switch'
  const targetName = options.targetName ?? 'Switch'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  // Default: true (wrap in View when style props exist)
  const wrap = options.wrap ?? true

  // import { Switch } from '@hb-frontend/common/src/components'
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Switch')) {
    return fileInfo.source
  }

  const switchElements = findJSXElements(root, 'Switch', j)
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

  switchElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    // Extract label prop to transform into <Switch.Description>
    const labelAttr = findAttribute(attributes, 'label')
    const labelValue = labelAttr ? labelAttr.value : null

    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
      droppedProps,
      invalidStyles,
    } = categorizeProps(attributes, switchProps, j)

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    const switchAttributes = filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    for (const [name, value] of Object.entries(transformedProps)) {
      switchAttributes.push(j.jsxAttribute(j.jsxIdentifier(name), value))
    }

    path.node.openingElement.attributes = switchAttributes

    addElementComment(path, droppedProps, invalidStyles, j)

    // Wrap children in <Switch.Label>
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

    // Add <Switch.Description> if label prop exists
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

    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    if (wrap && hasStyleProps) {
      const styleName = `switch${index}`

      const switchElement = j.jsxElement(
        path.node.openingElement,
        path.node.closingElement,
        path.node.children,
        path.node.selfClosing,
      )

      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, elementStyles, j, [])
      const viewElement = createViewWrapper(switchElement, styleValue, j)
      j(path).replaceWith(viewElement)
    }
  })

  removeNamedImport(imports, 'Switch', j)
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
