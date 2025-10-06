// NativeBase HStack/VStack to Nordlys Stack
//
// Nordlys uses single Stack component with direction prop instead of separate components.
// HStack becomes <Stack direction="horizontal">, VStack becomes <Stack direction="vertical">
//
// space prop becomes gap (must be valid space token)
// align/justify get value mapping (start becomes flex-start, between becomes space-between, etc)
//
// Re-runnable: checks for both source and target imports, only transforms source elements

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import {
  addTransformedProps,
  buildStyleValue,
  filterAttributes,
  findJSXElements,
} from '@puns/shiftkit/jsx'
import { createStyleContext } from '../helpers/style-context.js'
import { alignValues, justifyValues } from './mappings/maps-values.js'
import { directProps } from './mappings/props-direct.js'
import {
  allPseudoProps,
  platformPseudoProps,
  themePseudoProps,
  unsupportedProps,
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
  addTodoComment,
  categorizeProps,
  validateToken,
  validSpaceTokens,
} from './props.js'

// styleProps: spacing, sizing, colors, borders, layout, flexbox, position (align -> alignItems, justify -> justifyContent with value mapping; space excluded)
// transformProps: space -> gap (validated as space token)
// directProps: event handlers, accessibility, testID, children
// dropProps: colorScheme, variant, divider, reversed, _text, _stack, pseudo-props, platform/theme overrides
const styleProps = {
  ...spacing,
  ...sizing, // Includes 'size' for layout (width/height)
  ...color,
  ...border,
  ...layout,
  ...flexbox,
  ...position,
  ...text,
  ...extra,

  // Stack-specific props with value mapping
  align: {
    styleName: 'alignItems',
    valueMap: alignValues, // start becomes flex-start, etc.
  },
  justify: {
    styleName: 'justifyContent',
    valueMap: justifyValues, // between becomes space-between, etc.
  },
}

// Remove space from styleProps since it should stay on element as gap
delete styleProps.space

// Transform space prop to gap prop
// space="md" becomes gap={space.md} (stays on element, not extracted to StyleSheet)
const transformProps = {
  space: 'gap',
}

const directPropsList = directProps

// Explicit drop list for Stack
// NOTE: Stack is a layout component, not themed - drop colorScheme/variant
// The 'size' prop is handled by styleProps as layout (width/height)
const dropPropsList = [
  ...allPseudoProps, // _hover, _pressed, _focus, _disabled, etc.
  ...platformPseudoProps, // _ios, _android, _web
  ...themePseudoProps, // _light, _dark
  ...unsupportedProps, // Props that don't map to React Native
  'colorScheme', // Stack is layout-only, not themed
  'variant', // Stack is layout-only, not themed
  'divider', // Not supported in Nordlys
  'reversed', // Use flexDirection: 'row-reverse' or 'column-reverse' instead
  '_text', // Style overrides not supported
  '_stack', // Style overrides not supported
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
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? 'native-base'
  const targetImport = options.targetImport
  const targetName = options.targetName ?? 'Stack'
  const tokenImport = options.tokenImport

  if (!targetImport) {
    throw new Error('--targetImport is required (e.g., --targetImport="@your/components/Stack")')
  }
  if (!tokenImport) {
    throw new Error('--tokenImport is required (e.g., --tokenImport="@your/design-tokens")')
  }

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

    const stackElements = findJSXElements(root, componentName, j)
    if (stackElements.length === 0) {
      continue
    }

    let skippedForComponent = 0

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
        hasManualFailures,
      } = categorizeProps(attributes, stackProps, j)

      // Skip transformation if manual intervention required
      if (hasManualFailures) {
        console.warn(
          `⚠️  ${componentName} element skipped - manual fixes required (${fileInfo.path})`,
        )
        addTodoComment(path, componentName, invalidStyles, j)
        skippedForComponent++
        return
      }

      styles.addHelpers(newHelpers)

      // gap prop must be a valid space token name
      if (transformedProps.gap) {
        const gapValue = transformedProps.gap
        const validation = validateToken(gapValue, validSpaceTokens, false)

        if (!validation.isValid) {
          const gapAttr = j.jsxAttribute(j.jsxIdentifier('gap'), gapValue)
          droppedProps.push({ name: 'gap', attr: gapAttr })
          delete transformedProps.gap
        }
      }

      // Keep only direct props (filter out style props and dropped props)
      const stackAttributes = filterAttributes(attributes, {
        allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
      })

      // Add direction prop
      const directionProp = j.jsxAttribute(j.jsxIdentifier('direction'), j.stringLiteral(direction))
      stackAttributes.push(directionProp)

      // Add transformed props
      addTransformedProps(stackAttributes, transformedProps, j)

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

      // Add style prop to element (only if styleValue is not null)
      if (styleValue) {
        const styleProp = j.jsxAttribute(
          j.jsxIdentifier('style'),
          j.jsxExpressionContainer(styleValue),
        )
        stackAttributes.push(styleProp)
      }

      // Update element name and attributes
      path.node.openingElement.name = j.jsxIdentifier(targetName)
      if (path.node.closingElement) {
        path.node.closingElement.name = j.jsxIdentifier(targetName)
      }
      path.node.openingElement.attributes = stackAttributes

      addElementComment(path, droppedProps, invalidStyles, j)
    })

    // Replace component identifier references with Stack (e.g., withAnimated(HStack) -> withAnimated(Stack))
    root.find(j.Identifier, { name: componentName }).forEach((path) => {
      const parent = path.parent.node
      // Skip import specifiers and JSX element names (already handled)
      if (parent.type === 'ImportSpecifier') {
        return
      }
      if (parent.type === 'JSXOpeningElement' || parent.type === 'JSXClosingElement') {
        return
      }
      // Replace identifier: withAnimated(HStack) -> withAnimated(Stack)
      path.node.name = targetName
    })

    // Only remove component import if no elements were skipped
    if (skippedForComponent === 0) {
      removeNamedImport(imports, componentName, j)
    } else {
      console.warn(
        `⚠️  ${componentName} import kept - ${skippedForComponent} element(s) skipped and still reference ${componentName} (${fileInfo.path})`,
      )
    }

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
