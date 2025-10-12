// Migrate NativeBase Alert -> Nordlys Alert
// See alert.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import { buildStyleValue, createViewWrapper } from '@puns/shiftkit/jsx'
import { createJSXHelper } from '../helpers/factory.js'
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

const dropPropsList = [...allPseudoProps, 'variant', 'colorScheme']

const alertProps = {
  styleProps,
  transformProps,
  directProps: directPropsList,
  dropProps: dropPropsList,
}

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
  const $ = createJSXHelper(j)
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

  const alertElements = $.findElements(root, 'Alert')

  if (alertElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  const styles = createStyleContext()

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
      droppedProps,
      invalidStyles,
    } = categorizeProps(attributes, alertProps, j)

    styles.addHelpers(newHelpers)

    const alertAttributes = $.filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    $.addTransformedProps(alertAttributes, transformedProps)

    // Add title prop if found
    if (title) {
      alertAttributes.push($.createAttribute('title', title))
    }

    // Add description prop if found
    if (description) {
      alertAttributes.push($.createAttribute('description', description))
    }

    // Warn if no description
    if (!description) {
      warnings.push('Alert: No description found - description is required in Nordlys Alert')
    }

    addElementComment(path, droppedProps, invalidStyles, j)

    const alertElement = $.createElement('Alert', alertAttributes)

    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    // Wrap in View if style props exist
    if (wrap && hasStyleProps) {
      const styleName = `alert${index}`

      const tempStyles = []
      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }

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

  styles.applyToRoot(root, { wrap, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
