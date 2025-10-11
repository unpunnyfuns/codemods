// Migrate NativeBase Alert → Nordlys Alert
// See alert.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
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
import { addOrExtendStyleSheet, categorizeProps } from './props.js'

// Alert prop mappings
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

const transformProps = {}

const directPropsList = ['status', ...accessibility]

const dropPropsList = [
  ...allPseudoProps,
  // Alert-specific NativeBase props
  'variant',
  'colorScheme',
]

// Extract Alert.Title and Alert.Description from children
function extractAlertContent(children) {
  const result = { title: null, description: null, otherChildren: [] }

  if (!children || children.length === 0) {
    return result
  }

  children.forEach((child) => {
    if (child.type !== 'JSXElement') {
      // Skip text nodes, comments, etc.
      return
    }

    const elementName = child.openingElement?.name

    // Check for Alert.Title
    if (
      elementName?.type === 'JSXMemberExpression' &&
      elementName.object?.name === 'Alert' &&
      elementName.property?.name === 'Title'
    ) {
      // Extract text content from Alert.Title
      const titleChildren = child.children || []
      if (titleChildren.length > 0) {
        const textChild = titleChildren[0]
        if (textChild.type === 'JSXText') {
          result.title = textChild.value.trim()
        } else if (textChild.type === 'JSXExpressionContainer') {
          result.title = textChild.expression
        }
      }
      return
    }

    // Check for Alert.Description
    if (
      elementName?.type === 'JSXMemberExpression' &&
      elementName.object?.name === 'Alert' &&
      elementName.property?.name === 'Description'
    ) {
      // Extract text content from Alert.Description
      const descChildren = child.children || []
      if (descChildren.length > 0) {
        const textChild = descChildren[0]
        if (textChild.type === 'JSXText') {
          result.description = textChild.value.trim()
        } else if (textChild.type === 'JSXExpressionContainer') {
          result.description = textChild.expression
        }
      }
      return
    }

    // Check for Alert.Icon (skip it, Nordlys handles icons automatically)
    if (
      elementName?.type === 'JSXMemberExpression' &&
      elementName.object?.name === 'Alert' &&
      elementName.property?.name === 'Icon'
    ) {
      return
    }

    // Other children (not supported)
    result.otherChildren.push(child)
  })

  return result
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? 'native-base'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Alert'
  const targetName = options.targetName ?? 'Alert'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  // Default: true (wrap in View when style props exist)
  const wrap = options.wrap ?? true

  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Alert')) {
    return fileInfo.source
  }

  const alertElements = root.find(j.JSXElement, {
    openingElement: {
      name: {
        type: 'JSXIdentifier',
        name: 'Alert',
      },
    },
  })

  if (alertElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  const elementStyles = []
  const usedTokenHelpers = new Set()
  const alertProps = {
    styleProps,
    transformProps,
    directProps: directPropsList,
    dropProps: dropPropsList,
  }

  alertElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    // Extract title and description from children
    const { title, description, otherChildren } = extractAlertContent(children)

    if (otherChildren.length > 0) {
      warnings.push('Alert: Contains unsupported children (buttons, custom content not supported)')
    }

    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
    } = categorizeProps(attributes, alertProps, j)

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    const alertAttributes = attributes.filter((attr) => {
      if (attr.type !== 'JSXAttribute' || !attr.name) {
        return false
      }
      const propName = attr.name.name
      return directPropsList.includes(propName) && !propsToRemove.includes(propName)
    })

    for (const [name, value] of Object.entries(transformedProps)) {
      alertAttributes.push(j.jsxAttribute(j.jsxIdentifier(name), value))
    }

    // Add title prop if found
    if (title) {
      const titleValue =
        typeof title === 'string' ? j.stringLiteral(title) : j.jsxExpressionContainer(title)
      alertAttributes.push(j.jsxAttribute(j.jsxIdentifier('title'), titleValue))
    }

    // Add description prop if found
    if (description) {
      const descValue =
        typeof description === 'string'
          ? j.stringLiteral(description)
          : j.jsxExpressionContainer(description)
      alertAttributes.push(j.jsxAttribute(j.jsxIdentifier('description'), descValue))
    }

    // Warn if no description
    if (!description) {
      warnings.push('Alert: No description found - description is required in Nordlys Alert')
    }

    // Create new self-closing Alert element
    const alertElement = j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier('Alert'), alertAttributes, true),
      null,
      [],
      true,
    )

    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    // Wrap in View if style props exist
    if (wrap && hasStyleProps) {
      const styleName = `alert${index}`
      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, elementStyles, j, [])
      const viewElement = createViewWrapper(alertElement, styleValue, j)
      j(path).replaceWith(viewElement)
    } else {
      j(path).replaceWith(alertElement)
    }
  })

  if (warnings.length > 0) {
    console.warn('⚠️  Alert migration warnings:')
    for (const w of warnings) {
      console.warn(`   ${w}`)
    }
  }

  removeNamedImport(imports, 'Alert', j)
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
