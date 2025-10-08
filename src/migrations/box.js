/**
 * Migrate NativeBase Box → React Native View with StyleSheet
 *
 * <Box bg="blue.500" p={4} m={2} rounded="md">{children}</Box>
 * =>
 * <View style={styles.box0}>{children}</View>
 * const styles = StyleSheet.create({ box0: { backgroundColor: color.blue['500'], padding: 4, margin: 2, borderRadius: radius.md } })
 */

import { directProps } from '../mappings/direct-props.js'
import { dropProps } from '../mappings/drop-props.js'
import { border, layout, sizing, spacing } from '../mappings/style-props.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from '../utils/imports.js'
import {
  addPropsToElement,
  addStyleProp,
  buildStyleValue,
  removePropsFromElement,
  updateElementName,
} from '../utils/jsx-transforms.js'
import { addOrExtendStyleSheet, categorizeProps } from '../utils/props.js'

// Box → View prop mappings
const styleProps = {
  ...spacing,
  ...sizing,
  ...layout,
  ...border,

  // Color/Background props with color token helper
  bgColor: { styleName: 'backgroundColor', tokenHelper: 'color' },
  bg: { styleName: 'backgroundColor', tokenHelper: 'color' },
  backgroundColor: { styleName: 'backgroundColor', tokenHelper: 'color' },

  // Border colors
  borderColor: { styleName: 'borderColor', tokenHelper: 'color' },
  borderTopColor: { styleName: 'borderTopColor', tokenHelper: 'color' },
  borderBottomColor: { styleName: 'borderBottomColor', tokenHelper: 'color' },
  borderLeftColor: { styleName: 'borderLeftColor', tokenHelper: 'color' },
  borderRightColor: { styleName: 'borderRightColor', tokenHelper: 'color' },
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

  // Find imports
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Box')) {
    return fileInfo.source
  }

  // Find all Box elements
  const boxElements = root.find(j.JSXElement, { openingElement: { name: { name: 'Box' } } })
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

  // Transform each Box element
  boxElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    // Categorize props
    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
    } = categorizeProps(attributes, boxProps, j)

    for (const h of newHelpers) {
      usedTokenHelpers.add(h)
    }

    // Transform element
    removePropsFromElement(attributes, propsToRemove)
    updateElementName(path, targetName)
    addPropsToElement(attributes, transformedProps, j)

    const styleValue = buildStyleValue(styleProps, inlineStyles, `box${index}`, elementStyles, j)
    addStyleProp(attributes, styleValue, j)
  })

  // Update imports
  removeNamedImport(imports, 'Box', j)
  addNamedImport(root, targetImport, targetName, j)
  for (const h of usedTokenHelpers) {
    addNamedImport(root, tokenImport, h, j)
  }

  // Add StyleSheet
  addOrExtendStyleSheet(root, elementStyles, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
