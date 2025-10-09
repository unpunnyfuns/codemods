// Migrate NativeBase Box → React Native View with StyleSheet
// See box.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import {
  addPropsToElement,
  addStyleProp,
  buildStyleValue,
  removePropsFromElement,
  updateElementName,
} from '../helpers/jsx-transforms.js'
import { directProps } from './mappings/props-direct.js'
import { dropProps } from './mappings/props-drop.js'
import { border, color, extra, flexbox, layout, position, sizing, spacing } from './mappings/props-style.js'
import { addDroppedPropsComment, addOrExtendStyleSheet, categorizeProps } from './props.js'

// Box → View prop mappings
const styleProps = {
  ...spacing,
  ...sizing,
  ...color,
  ...border,
  ...layout,
  ...flexbox,
  ...position,
  ...extra,
}

const transformProps = {}

const directPropsList = [...directProps, 'safeAreaBottom']

const dropPropsList = [...dropProps, 'disableTopRounding', 'disableBottomRounding']

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? 'native-base'
  const targetImport = options.targetImport ?? 'react-native'
  const targetName = options.targetName ?? 'View'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'

  // Find import declarations matching the source path
  // j.ImportDeclaration finds: import { Box } from 'native-base'
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })

  // Bail early if no imports or Box isn't imported
  if (!imports.length || !hasNamedImport(imports, 'Box')) {
    return fileInfo.source
  }

  // Find all JSX elements with opening tag <Box>
  // j.JSXElement finds the entire element including children and closing tag
  const boxElements = root.find(j.JSXElement, { openingElement: { name: { name: 'Box' } } })
  if (boxElements.length === 0) {
    return fileInfo.source
  }

  // Track styles to be added to StyleSheet.create() at end of file
  const elementStyles = []
  // Track which design token helpers we need to import (e.g., 'color', 'space', 'radius')
  const usedTokenHelpers = new Set()
  // Track dropped props per element: Map(elementIndex -> [propNames])
  const droppedPropsMap = new Map()

  const boxProps = {
    styleProps,
    transformProps,
    directProps: directPropsList,
    dropProps: dropPropsList,
  }

  // Transform each Box element
  boxElements.forEach((path, index) => {
    // JSX attributes are on the opening element: <Box attr={value}>
    const attributes = path.node.openingElement.attributes || []

    // Categorize props into: extract to StyleSheet, keep inline, transform, or drop
    // - styleProps: Props with static values to extract to StyleSheet
    // - inlineStyles: Props with dynamic values to keep inline
    // - transformedProps: Props to rename/transform on the element
    // - propsToRemove: Props to remove from element (extracted or dropped)
    // - usedTokenHelpers: Set of token helper names used (e.g., 'color', 'space')
    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
      droppedProps,
    } = categorizeProps(attributes, boxProps, j)

    // Collect all token helpers used across all elements
    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    // Store dropped props for this element
    if (droppedProps.length > 0) {
      droppedPropsMap.set(index, droppedProps)
    }

    // Mutate the AST: remove old props, rename element, add transformed props
    removePropsFromElement(attributes, propsToRemove)
    updateElementName(path, targetName)
    addPropsToElement(attributes, transformedProps, j)

    // Build the style prop value: either styles.box0 or inline object or both
    // Also adds to elementStyles array for StyleSheet.create()
    const styleValue = buildStyleValue(styleProps, inlineStyles, `box${index}`, elementStyles, j)
    addStyleProp(attributes, styleValue, j)
  })

  // Clean up old import, add new ones
  removeNamedImport(imports, 'Box', j)
  addNamedImport(root, targetImport, targetName, j)

  // Add imports for design tokens that were actually used (e.g., import { color, space } from '@hb-frontend/nordlys')
  for (const h of usedTokenHelpers) {
    addNamedImport(root, tokenImport, h, j)
  }

  // Add or extend StyleSheet.create() at the end of the file
  addOrExtendStyleSheet(root, elementStyles, j)

  // Add comment about dropped props
  addDroppedPropsComment(root, droppedPropsMap, 'Box', j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
