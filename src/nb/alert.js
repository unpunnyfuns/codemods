/**
 * NativeBase Alert to Nordlys Alert
 *
 * Compound components (Alert.Title, Alert.Description) extracted to props
 * Alert.Icon: removed (Nordlys handles automatically)
 * description prop: required (warning if missing)
 * Other children: skipped with warning
 */

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import {
  addTransformedProps,
  buildStyleValue,
  createAttribute,
  createSelfClosingElement,
  createViewWrapper,
  filterAttributes,
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
import { addElementComment, categorizeProps } from './props.js'

/**
 * Alert prop configuration
 *
 * styleProps: Props for View wrapper
 * Includes spacing (p, m), sizing (w, h), colors (bg), borders, layout, flexbox, position
 *
 * transformProps: Props renamed on the element
 * None (status prop already matches Nordlys API)
 *
 * directProps: Props that pass through unchanged
 * status: Alert severity (success, info, warning, error)
 * Accessibility props
 *
 * dropProps: Props removed during migration
 * variant: Nordlys has fixed styling
 * colorScheme: status prop provides semantic coloring
 * Pseudo-props: _hover, _pressed, etc.
 */
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

/**
 * Extract Alert.Title and Alert.Description content from compound components
 *
 * Parses Alert children for compound components and extracts text content.
 *
 * Returns object with:
 * title: text or expression from Alert.Title (null if not found)
 * description: text or expression from Alert.Description (null if not found)
 * otherChildren: array of unsupported children (buttons, custom elements)
 *
 * Handles:
 * Alert.Title: first text node or expression
 * Alert.Description: first text node or expression
 * Alert.Icon: skipped (Nordlys handles automatically)
 * Other elements: collected in otherChildren for warning
 *
 * Examples:
 * <Alert.Title>Success</Alert.Title> extracts "Success"
 * <Alert.Title>{title}</Alert.Title> extracts title expression
 * <Button>OK</Button> collected in otherChildren
 */
const extractMemberContent = (child, object, property) => {
  const elementName = child.openingElement?.name
  if (
    elementName?.type === 'JSXMemberExpression' &&
    elementName.object?.name === object &&
    elementName.property?.name === property
  ) {
    const children = child.children || []
    if (children.length > 0) {
      const textChild = children[0]
      if (textChild.type === 'JSXText') {
        return textChild.value.trim()
      }
      if (textChild.type === 'JSXExpressionContainer') {
        return textChild.expression
      }
    }
  }
  return null
}

function extractAlertContent(children) {
  const result = { title: null, description: null, otherChildren: [] }

  if (!children || children.length === 0) {
    return result
  }

  children.forEach((child) => {
    if (child.type !== 'JSXElement') {
      return
    }

    const titleContent = extractMemberContent(child, 'Alert', 'Title')
    if (titleContent) {
      result.title = titleContent
      return
    }

    const descContent = extractMemberContent(child, 'Alert', 'Description')
    if (descContent) {
      result.description = descContent
      return
    }

    const elementName = child.openingElement?.name
    const isAlertIcon =
      elementName?.type === 'JSXMemberExpression' &&
      elementName.object?.name === 'Alert' &&
      elementName.property?.name === 'Icon'

    if (isAlertIcon) {
      return
    }

    result.otherChildren.push(child)
  })

  return result
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? 'native-base'
  const targetImport = options.targetImport
  const targetName = options.targetName ?? 'Alert'
  const tokenImport = options.tokenImport
  const wrap = options.wrap ?? true

  if (!targetImport) {
    throw new Error('--targetImport is required (e.g., --targetImport="@your/components/Alert")')
  }
  if (!tokenImport) {
    throw new Error('--tokenImport is required (e.g., --tokenImport="@your/design-tokens")')
  }

  // Check for Alert imports from both source and target (for re-running)
  const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  const targetImports = root.find(j.ImportDeclaration, { source: { value: targetImport } })

  const hasSourceAlert = sourceImports.length > 0 && hasNamedImport(sourceImports, 'Alert')
  const hasTargetAlert = targetImports.length > 0 && hasNamedImport(targetImports, 'Alert')

  if (!hasSourceAlert && !hasTargetAlert) {
    return fileInfo.source
  }

  const alertElements = findJSXElements(root, 'Alert', j)

  if (alertElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  const styles = createStyleContext()
  let migrated = 0

  alertElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    const { title, description, otherChildren } = extractAlertContent(children)

    if (otherChildren.length > 0) {
      warnings.push('Alert: Contains unsupported children (buttons, custom content not supported)')
    }

    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers,
      droppedProps,
      invalidStyles,
      hasManualFailures,
    } = categorizeProps(attributes, alertProps, j)

    // Skip if manual fixes needed (unless --unsafe mode)
    if (hasManualFailures) {
      const msg = options.unsafe
        ? `⚠️  Alert: unsafe mode - proceeding with partial migration (${fileInfo.path})`
        : `⚠️  Alert skipped - manual fixes required (${fileInfo.path})`
      console.warn(msg)
      if (!options.unsafe) {
        return
      }
    }

    styles.addHelpers(usedTokenHelpers)

    const attrs = filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    addTransformedProps(attrs, transformedProps, j)

    if (title) {
      attrs.push(createAttribute('title', title, j))
    }

    if (description) {
      attrs.push(createAttribute('description', description, j))
    }

    if (!description) {
      warnings.push('Alert: No description found - description is required in Nordlys Alert')
    }

    addElementComment(path, droppedProps, invalidStyles, j)
    migrated++

    const element = createSelfClosingElement('Alert', attrs, j)

    const hasStyles = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    // Wrap in View if style props exist
    if (wrap && hasStyles) {
      const styleName = `alert${index}`

      const tempStyles = []
      const style = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }

      const wrapper = createViewWrapper(element, style, j)
      j(path).replaceWith(wrapper)
    } else {
      j(path).replaceWith(element)
    }
  })

  if (warnings.length > 0) {
    console.warn('⚠️  Alert migration warnings:')
    const uniqueWarnings = [...new Set(warnings)]
    for (const w of uniqueWarnings) {
      console.warn(`   ${w}`)
    }
  }

  // Only change imports if we migrated at least one element
  if (migrated === 0) {
    return fileInfo.source
  }

  // Remove Alert from source import (if it exists) and add to target
  if (hasSourceAlert) {
    removeNamedImport(sourceImports, 'Alert', j)
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
