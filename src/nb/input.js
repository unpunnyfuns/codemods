// Migrate NativeBase Input -> Nordlys Input (simple cases only)
// See input.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import {
  addTransformedProps,
  buildStyleValue,
  createSelfClosingElement,
  createViewWrapper,
  filterAttributes,
  findJSXElements,
  hasAttribute,
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
import { addElementComment, categorizeProps } from './props.js'

// Props that need manual handling or warning
const complexProps = [
  'InputLeftElement',
  'InputRightElement',
  'multiline',
  'numberOfLines',
  'secureTextEntry',
  'variant',
  'size',
]

// Input prop mappings
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
  placeholder: 'label',
  onChangeText: 'onChange',
  isDisabled: 'disabled',
}

const directPropsList = ['value', 'keyboardType', 'onBlur', 'error', ...accessibility]

const dropPropsList = [...allPseudoProps, 'variant', 'size', '_focus', '_input']

const inputProps = {
  styleProps,
  transformProps,
  directProps: directPropsList,
  dropProps: dropPropsList,
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? 'native-base'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Input'
  const targetName = options.targetName ?? 'Input'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  // Default: true (wrap in View when style props exist)
  const wrap = options.wrap ?? true

  // Check for Input imports from both source and target (for re-running)
  const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  const targetImports = root.find(j.ImportDeclaration, { source: { value: targetImport } })

  const hasSourceInput = sourceImports.length > 0 && hasNamedImport(sourceImports, 'Input')
  const hasTargetInput = targetImports.length > 0 && hasNamedImport(targetImports, 'Input')

  if (!hasSourceInput && !hasTargetInput) {
    return fileInfo.source
  }

  const inputElements = findJSXElements(root, 'Input', j)

  if (inputElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  const styles = createStyleContext()
  let migrated = 0

  inputElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    // Check for complex props
    attributes.forEach((attr) => {
      if (attr.type === 'JSXAttribute' && attr.name && complexProps.includes(attr.name.name)) {
        warnings.push(`Input: Complex prop "${attr.name.name}" may need manual migration`)
      }
    })

    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
      droppedProps,
      invalidStyles,
      hasManualFailures,
    } = categorizeProps(attributes, inputProps, j)

    // Skip transformation if manual intervention required (unless --unsafe)
    if (hasManualFailures && !options.unsafe) {
      console.warn(`⚠️  Input element skipped - manual fixes required (${fileInfo.path})`)
      return
    }

    if (hasManualFailures && options.unsafe) {
      console.warn(
        `⚠️  Input element: unsafe mode - proceeding with partial migration (${fileInfo.path})`,
      )
    }

    styles.addHelpers(newHelpers)

    addElementComment(path, droppedProps, invalidStyles, j)
    migrated++

    const allowList = [...directPropsList, ...complexProps].filter(
      (prop) => !propsToRemove.includes(prop),
    )
    const inputAttributes = filterAttributes(attributes, { allow: allowList })

    addTransformedProps(inputAttributes, transformedProps, j)

    // Check if label prop exists
    if (!hasAttribute(inputAttributes, 'label')) {
      warnings.push('Input: Missing required "label" prop (transformed from "placeholder")')
    }

    // Check if onChange prop exists
    if (!hasAttribute(inputAttributes, 'onChange')) {
      warnings.push('Input: Missing required "onChange" prop (transformed from "onChangeText")')
    }

    const inputElement = createSelfClosingElement('Input', inputAttributes, j)

    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    // Wrap in View if style props exist
    if (wrap && hasStyleProps) {
      const styleName = `input${index}`
      const tempStyles = []
      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }
      const viewElement = createViewWrapper(inputElement, styleValue, j)
      j(path).replaceWith(viewElement)
    } else {
      j(path).replaceWith(inputElement)
    }
  })

  if (warnings.length > 0) {
    console.warn('⚠️  Input migration warnings:')
    for (const w of warnings) {
      console.warn(`   ${w}`)
    }
  }

  // Only change imports if we migrated at least one element
  if (migrated === 0) {
    return fileInfo.source
  }

  // Remove Input from source import (if it exists) and add to target
  if (hasSourceInput) {
    removeNamedImport(sourceImports, 'Input', j)
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
