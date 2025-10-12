// Migrate NativeBase HStack/VStack → Stack with direction
// See stack.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import { buildStyleValue } from '@puns/shiftkit/jsx'
import { createJSXHelper } from '../helpers/factory.js'
import { createStyleContext } from '../helpers/style-context.js'
import { alignValues, justifyValues } from './mappings/maps-values.js'
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
import {
  addElementComment,
  categorizeProps,
  validateTokenValue,
  validSpaceTokens,
} from './props.js'

// Stack prop mappings
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

  // Stack-specific props with value mapping
  // align="start" transforms to alignItems: 'flex-start' (extracted to StyleSheet)
  align: {
    styleName: 'alignItems',
    valueMap: alignValues,
  },
  // justify="between" transforms to justifyContent: 'space-between' (extracted to StyleSheet)
  justify: {
    styleName: 'justifyContent',
    valueMap: justifyValues,
  },
}

// Remove space from STYLE_PROPS since it should stay on element as gap
delete styleProps.space

// Transform space prop to gap prop
// space={2} becomes gap={space[2]} (stays on element, not extracted)
const transformProps = {
  space: 'gap',
}

const directPropsList = directProps

// Explicit drop list for Stack
// NOTE: Stack is a layout component, not themed - drop colorScheme/variant
// The 'size' prop is handled by styleProps as layout (width/height)
const dropPropsList = [
  ...allPseudoProps,
  ...platformOverrides,
  ...themeOverrides,
  ...componentAgnostic,
  // Stack is a layout component, not themed
  'colorScheme',
  'variant',
  'divider',
  'reversed',
  '_text',
  '_stack',
]

const stackProps = {
  styleProps,
  transformProps,
  directProps: directPropsList,
  dropProps: dropPropsList,
}

const STACK_COMPONENTS = [
  { name: 'HStack', direction: 'horizontal' },
  { name: 'VStack', direction: 'vertical' },
]

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const $ = createJSXHelper(j)
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? 'native-base'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Stack'
  const targetName = options.targetName ?? 'Stack'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'

  // import { HStack, VStack } from 'native-base'
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length) {
    return fileInfo.source
  }

  let transformed = false
  const styles = createStyleContext()

  // Process each stack component type
  for (const { name: componentName, direction } of STACK_COMPONENTS) {
    if (!hasNamedImport(imports, componentName)) {
      continue
    }

    const stackElements = $.findElements(root, componentName)
    if (stackElements.length === 0) {
      continue
    }

    stackElements.forEach((path, index) => {
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
      } = categorizeProps(attributes, stackProps, j)

      styles.addHelpers(newHelpers)

      // gap prop must be a valid space token name
      if (transformedProps.gap) {
        const gapValue = transformedProps.gap
        const validation = validateTokenValue(gapValue, validSpaceTokens, false)

        if (!validation.isValid) {
          const gapAttr = j.jsxAttribute(j.jsxIdentifier('gap'), gapValue)
          droppedProps.push({ name: 'gap', attr: gapAttr })
          delete transformedProps.gap
        }
      }

      // Remove props that need to be removed
      path.node.openingElement.attributes = attributes.filter(
        (attr) => !propsToRemove.includes(attr),
      )

      // Update element name
      path.node.openingElement.name = j.jsxIdentifier(targetName)
      if (path.node.closingElement) {
        path.node.closingElement.name = j.jsxIdentifier(targetName)
      }

      // Add direction prop
      const directionProp = j.jsxAttribute(j.jsxIdentifier('direction'), j.stringLiteral(direction))
      path.node.openingElement.attributes.push(directionProp)

      // Add transformed props
      $.addTransformedProps(path.node.openingElement.attributes, transformedProps)

      // Build and add style prop
      const tempStyles = []
      const styleValue = buildStyleValue(
        styleProps,
        inlineStyles,
        `${componentName.toLowerCase()}${index}`,
        tempStyles,
        j,
        existingStyleReferences,
      )
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }

      // Add style prop to element
      const styleProp = j.jsxAttribute(
        j.jsxIdentifier('style'),
        j.jsxExpressionContainer(styleValue),
      )
      path.node.openingElement.attributes.push(styleProp)

      addElementComment(path, droppedProps, invalidStyles, j)
    })

    removeNamedImport(imports, componentName, j)
    transformed = true
  }

  if (!transformed) {
    return fileInfo.source
  }

  addNamedImport(root, targetImport, targetName, j)

  styles.applyToRoot(root, { wrap: false, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
