// Migrate NativeBase Box -> React Native View with StyleSheet
// See box.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import {
  addTransformedProps,
  buildStyleValue,
  filterAttributes,
  findJSXElements,
} from '@puns/shiftkit/jsx'
import { createStyleContext } from '../helpers/style-context.js'
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
import { addElementComment, categorizeProps } from './props.js'

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

const boxProps = {
  styleProps,
  transformProps,
  directProps: directPropsList,
  dropProps: dropPropsList,
}

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

  const styles = createStyleContext()

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

    styles.addHelpers(newHelpers)

    // Keep only direct props (filter out style props and dropped props)
    const viewAttributes = filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    // Add transformed props
    addTransformedProps(viewAttributes, transformedProps, j)

    // Build and add style prop
    const tempStyles = []
    const styleValue = buildStyleValue(
      styleProps,
      inlineStyles,
      `box${index}`,
      tempStyles,
      j,
      existingStyleReferences,
    )
    if (tempStyles.length > 0) {
      styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
    }

    // Add style prop to element (only if styleValue is not null)
    if (styleValue) {
      const styleProp = j.jsxAttribute(
        j.jsxIdentifier('style'),
        j.jsxExpressionContainer(styleValue),
      )
      viewAttributes.push(styleProp)
    }

    // Update element name and attributes
    path.node.openingElement.name = j.jsxIdentifier(targetName)
    if (path.node.closingElement) {
      path.node.closingElement.name = j.jsxIdentifier(targetName)
    }
    path.node.openingElement.attributes = viewAttributes

    addElementComment(path, droppedProps, invalidStyles, j)
  })

  removeNamedImport(imports, 'Box', j)
  addNamedImport(root, targetImport, targetName, j)

  styles.applyToRoot(root, { wrap: false, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
