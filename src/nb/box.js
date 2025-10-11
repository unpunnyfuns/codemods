// Migrate NativeBase Box → React Native View with StyleSheet
// See box.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import { findJSXElements } from '../helpers/jsx-elements.js'
import {
  addPropsToElement,
  addStyleProp,
  buildStyleValue,
  removePropsFromElement,
  updateElementName,
} from '../helpers/jsx-transforms.js'
import { directProps } from './mappings/props-direct.js'
import {
  allPseudoProps,
  componentAgnostic,
  platformOverrides,
  themeOverrides,
} from './mappings/props-drop.js'
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

// Box to View prop mappings
const styleProps = {
  ...spacing,
  // Includes 'size' for layout (width/height)
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

const directPropsList = [...directProps]

// Explicit drop list for Box
// NOTE: Box is a layout component (migrates to View), not themed - drop colorScheme/variant
// The 'size' prop is handled by styleProps as layout (width/height)
const dropPropsList = [
  ...allPseudoProps,
  ...platformOverrides,
  ...themeOverrides,
  ...componentAgnostic,
  // Box is a layout component, not themed
  'colorScheme',
  'variant',
  'disableTopRounding',
  'disableBottomRounding',
  'safeAreaBottom',
  'safeAreaTop',
]

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? 'native-base'
  const targetImport = options.targetImport ?? 'react-native'
  const targetName = options.targetName ?? 'View'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'

  // import { Box } from 'native-base'
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })

  if (!imports.length || !hasNamedImport(imports, 'Box')) {
    return fileInfo.source
  }

  const boxElements = findJSXElements(root, 'Box', j)
  if (boxElements.length === 0) {
    return fileInfo.source
  }

  const elementStyles = []
  const usedTokenHelpers = new Set()

  const boxProps = {
    styleProps,
    transformProps,
    directProps: directPropsList,
    dropProps: dropPropsList,
  }

  boxElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
      droppedProps,
      invalidStyles,
      existingStyleReferences,
    } = categorizeProps(attributes, boxProps, j)

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    removePropsFromElement(attributes, propsToRemove)
    updateElementName(path, targetName)
    addPropsToElement(attributes, transformedProps, j)

    const styleValue = buildStyleValue(
      styleProps,
      inlineStyles,
      `box${index}`,
      elementStyles,
      j,
      existingStyleReferences,
    )
    addStyleProp(attributes, styleValue, j)

    addElementComment(path, droppedProps, invalidStyles, j)
  })

  removeNamedImport(imports, 'Box', j)
  addNamedImport(root, targetImport, targetName, j)

  for (const h of usedTokenHelpers) {
    addNamedImport(root, tokenImport, h, j)
  }

  addOrExtendStyleSheet(root, elementStyles, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
