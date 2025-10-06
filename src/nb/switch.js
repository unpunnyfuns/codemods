/**
 * NativeBase/Common Switch to Nordlys Switch with compound components
 *
 * Children become <Switch.Label>
 * label prop becomes <Switch.Description>
 * isChecked -> value, onToggle/onChange -> onValueChange, isDisabled -> disabled
 * Style props wrapped in View
 * Re-runnable on partially migrated files
 */

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

// styleProps: spacing, sizing, colors, borders, layout, flexbox, position (for View wrapper)
// transformProps: isChecked -> value, onToggle/onChange -> onValueChange, isDisabled -> disabled
// directProps: value, onValueChange, disabled, accessibility
// dropProps: label, switchPosition, hStackProps, childrenProps, labelProps, LeftElement, pseudo-props
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
  isChecked: 'value', // Standard React Native Switch API
  onToggle: 'onValueChange', // Standard React Native Switch event
  onChange: 'onValueChange', // Normalize to standard API
  isDisabled: 'disabled', // Simpler naming
}

const directPropsList = [...accessibility, 'value', 'onValueChange', 'disabled']

const dropPropsList = [
  ...allPseudoProps, // _hover, _pressed, etc.
  'label', // Extracted to <Switch.Description>
  'switchPosition', // Layout controlled by compound components
  'hStackProps', // Not needed with compound components
  'childrenProps', // Not needed with compound components
  'labelProps', // Not needed with compound components
  'LeftElement', // Not supported
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

  const sourceImport = options.sourceImport
  const targetImport = options.targetImport
  const targetName = options.targetName ?? 'Switch'
  const tokenImport = options.tokenImport
  const wrap = options.wrap ?? true

  if (!sourceImport) {
    throw new Error('--sourceImport is required (e.g., --sourceImport="@your/common/components")')
  }
  if (!targetImport) {
    throw new Error('--targetImport is required (e.g., --targetImport="@your/components/Switch")')
  }
  if (!tokenImport) {
    throw new Error('--tokenImport is required (e.g., --tokenImport="@your/design-tokens")')
  }

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
