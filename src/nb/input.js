// Migrate NativeBase Input → Nordlys Input (simple cases only)
// See input.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import { filterAttributes, hasAttribute } from '../helpers/jsx-attributes.js'
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

const directPropsList = ['value', 'keyboardType', 'onBlur', 'error', ...accessibility]

const dropPropsList = [
  ...allPseudoProps,
  // Input-specific NativeBase props
  'variant',
  'size',
  '_focus',
  '_input',
]

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? 'native-base'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Input'
  const targetName = options.targetName ?? 'Input'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  // Default: true (wrap in View when style props exist)
  const wrap = options.wrap ?? true

  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Input')) {
    return fileInfo.source
  }

  const inputElements = findJSXElements(root, 'Input', j)

  if (inputElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  const elementStyles = []
  const usedTokenHelpers = new Set()
  const inputProps = {
    styleProps,
    transformProps,
    directProps: directPropsList,
    dropProps: dropPropsList,
  }

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
    } = categorizeProps(attributes, inputProps, j)

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    addElementComment(path, droppedProps, invalidStyles, j)

    const allowList = [...directPropsList, ...complexProps].filter(
      (prop) => !propsToRemove.includes(prop),
    )
    const inputAttributes = filterAttributes(attributes, { allow: allowList })

    for (const [name, value] of Object.entries(transformedProps)) {
      inputAttributes.push(j.jsxAttribute(j.jsxIdentifier(name), value))
    }

    // Check if label prop exists
    if (!hasAttribute(inputAttributes, 'label')) {
      warnings.push('Input: Missing required "label" prop (transformed from "placeholder")')
    }

    // Check if onChange prop exists
    if (!hasAttribute(inputAttributes, 'onChange')) {
      warnings.push('Input: Missing required "onChange" prop (transformed from "onChangeText")')
    }

    // Create new self-closing Input element
    const inputElement = j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier('Input'), inputAttributes, true),
      null,
      [],
      true,
    )

    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    // Wrap in View if style props exist
    if (wrap && hasStyleProps) {
      const styleName = `input${index}`
      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, elementStyles, j, [])
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

  removeNamedImport(imports, 'Input', j)
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
