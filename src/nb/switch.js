// Migrate NativeBase/Common Switch → Nordlys Switch with compound components
// See switch.md for documentation

import { createJSXHelper } from '../helpers/factory.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import { buildStyleValue, createViewWrapper } from '../helpers/jsx-transforms.js'
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
  'label',
  'switchPosition',
  'hStackProps',
  'childrenProps',
  'labelProps',
  'LeftElement',
]

const switchProps = {
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

  const switchElements = $.findElements(root, 'Switch')
  if (switchElements.length === 0) {
    return fileInfo.source
  }

  const styles = createStyleContext()

  switchElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    // Extract label prop to transform into <Switch.Description>
    const labelAttr = $.findAttribute(attributes, 'label')
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

    styles.addHelpers(newHelpers)

    const switchAttributes = $.filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    $.addTransformedProps(switchAttributes, transformedProps)

    path.node.openingElement.attributes = switchAttributes

    addElementComment(path, droppedProps, invalidStyles, j)

    const labelElement = $.createMemberElement('Switch', 'Label', [], children)

    const newChildren = [j.jsxText('\n  '), labelElement]

    // Add <Switch.Description> if label prop exists
    if (labelValue) {
      const descriptionChildren =
        labelValue.type === 'JSXExpressionContainer'
          ? [j.jsxExpressionContainer(labelValue.expression)]
          : [j.jsxText(labelValue.value)]

      const descriptionElement = $.createMemberElement(
        'Switch',
        'Description',
        [],
        descriptionChildren,
      )
      newChildren.push(j.jsxText('\n  '), descriptionElement)
    }

    newChildren.push(j.jsxText('\n'))
    path.node.children = newChildren

    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    if (wrap && hasStyleProps) {
      const styleName = `switch${index}`

      const switchElement = $.clone(path.node)

      const tempStyles = []
      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }

      const viewElement = createViewWrapper(switchElement, styleValue, j)
      j(path).replaceWith(viewElement)
    }
  })

  removeNamedImport(imports, 'Switch', j)
  addNamedImport(root, targetImport, targetName, j)

  styles.applyToRoot(root, { wrap, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
