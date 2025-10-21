// Migrate NativeBase/Common Switch -> Nordlys Switch with compound components
// See switch.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import {
  addTransformedProps,
  buildStyleValue,
  cloneElement,
  createMemberElement,
  createViewWrapper,
  filterAttributes,
  findAttribute,
  findJSXElements,
} from '@puns/shiftkit/jsx'
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
import { addElementComment, addTodoComment, categorizeProps } from './props.js'

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
  onChange: 'onValueChange',
  isDisabled: 'disabled',
}

const directPropsList = [...accessibility, 'value', 'onValueChange', 'disabled']

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
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Switch'
  const targetName = options.targetName ?? 'Switch'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  // Default: true (wrap in View when style props exist)
  const wrap = options.wrap ?? true

  // Check for Switch imports from both source and target (for re-running)
  const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  const targetImports = root.find(j.ImportDeclaration, { source: { value: targetImport } })

  const hasSourceSwitch = sourceImports.length > 0 && hasNamedImport(sourceImports, 'Switch')
  const hasTargetSwitch = targetImports.length > 0 && hasNamedImport(targetImports, 'Switch')

  if (!hasSourceSwitch && !hasTargetSwitch) {
    return fileInfo.source
  }

  const switchElements = findJSXElements(root, 'Switch', j)
  if (switchElements.length === 0) {
    return fileInfo.source
  }

  const styles = createStyleContext()
  let migrated = 0

  switchElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    // Extract label prop to transform into <Switch.Description>
    const label = findAttribute(attributes, 'label')?.value ?? null

    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers,
      droppedProps,
      invalidStyles,
      hasManualFailures,
    } = categorizeProps(attributes, switchProps, j)

    // Skip if manual fixes needed (unless --unsafe mode)
    if (hasManualFailures) {
      const msg = options.unsafe
        ? `⚠️  Switch: unsafe mode - proceeding with partial migration (${fileInfo.path})`
        : `⚠️  Switch skipped - manual fixes required (${fileInfo.path})`
      console.warn(msg)
      if (!options.unsafe) {
        addTodoComment(path, 'Switch', invalidStyles, j)
        return
      }
    }

    styles.addHelpers(usedTokenHelpers)

    const attrs = filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    addTransformedProps(attrs, transformedProps, j)

    path.node.openingElement.attributes = attrs

    addElementComment(path, droppedProps, invalidStyles, j)
    migrated++

    const labelElement = createMemberElement('Switch', 'Label', [], children, j)

    const newChildren = [j.jsxText('\n  '), labelElement]

    // Add <Switch.Description> if label prop exists
    if (label) {
      const descriptionChildren =
        label.type === 'JSXExpressionContainer'
          ? [j.jsxExpressionContainer(label.expression)]
          : [j.jsxText(label.value)]

      const descriptionElement = createMemberElement(
        'Switch',
        'Description',
        [],
        descriptionChildren,
        j,
      )
      newChildren.push(j.jsxText('\n  '), descriptionElement)
    }

    newChildren.push(j.jsxText('\n'))
    path.node.children = newChildren

    const hasStyles = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    if (wrap && hasStyles) {
      const styleName = `switch${index}`

      const element = cloneElement(path.node, j)

      const tempStyles = []
      const style = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }

      const wrapper = createViewWrapper(element, style, j)
      j(path).replaceWith(wrapper)
    }
  })

  // Only change imports if we migrated at least one element
  if (migrated === 0) {
    return fileInfo.source
  }

  // Remove Switch from source import (if it exists) and add to target
  if (hasSourceSwitch) {
    removeNamedImport(sourceImports, 'Switch', j)
  }
  addNamedImport(root, targetImport, targetName, j)

  styles.applyToRoot(root, { wrap, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
