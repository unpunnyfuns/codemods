/**
 * NativeBase/Common Box to React Native View with StyleSheet
 *
 * Box becomes View with extracted StyleSheet
 * variant prop: explicit borderRadius values (container=12, content=8)
 * disableTopRounding/disableBottomRounding: borderRadius=0 for specific corners
 * Preprocessing converts variant/disable* to explicit borderRadius before categorization
 * Re-runnable on partially migrated files
 */

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
import { addElementComment, addTodoComment, categorizeProps } from './props.js'

// Variant to borderRadius mapping observed from Box component API
// Default borderRadius values applied when variant prop is set
const VARIANT_BORDER_RADIUS = {
  container: 'lg', // Used for outer containers
  content: 'md', // Used for content boxes
}

// Radii token to numeric value mapping from documented design tokens
// Converts semantic tokens to actual pixel values for React Native StyleSheet
const RADII_VALUES = {
  sm: 4,
  md: 8,
  lg: 12,
}

// styleProps: spacing, sizing, colors, borders, layout, flexbox, position, text
// transformProps: none
// directProps: event handlers, accessibility, testID, children
// dropProps: pseudo-props, platform/theme overrides, variant, disableTopRounding, disableBottomRounding, safeArea*
const styleProps = {
  ...spacing,
  ...sizing,
  ...color,
  ...border,
  ...layout,
  ...flexbox,
  ...position,
  ...text, // Text-only props will fail validation and be marked for manual migration
  ...extra,
}

const transformProps = {}

const directPropsList = [...directProps]

// Explicit drop list for Box
// NOTE: Box is a layout component (migrates to View), not themed - drop colorScheme/variant
// The 'size' prop is handled by styleProps as layout (width/height)
const dropPropsList = [
  ...allPseudoProps, // _hover, _pressed, _focus, _disabled, etc.
  ...platformPseudoProps, // _ios, _android, _web
  ...themePseudoProps, // _light, _dark
  ...unsupportedProps, // Props that don't map to React Native
  // Box-specific drops (theme props from NativeBase)
  'colorScheme',
  'variant',
  // Common Box props (handled in preprocessing)
  'disableTopRounding',
  'disableBottomRounding',
  // Safe area props (not supported in vanilla RN View)
  'safeAreaBottom',
  'safeAreaTop',
]

const boxProps = {
  styleProps,
  transformProps,
  directProps: directPropsList,
  dropProps: dropPropsList,
}

// Convert variant and disable* props to explicit borderRadius before categorization
// variant="container" -> borderRadius=12, disableTopRounding -> borderTopRadius=0
function preprocessBoxAttributes(attributes, j) {
  // STEP 1: Find variant prop to determine default borderRadius
  const variantAttr = attributes.find(
    (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'variant',
  )

  // Look up the default borderRadius for this variant (e.g., "container" → 12, "content" → 8)
  let defaultBorderRadius = null
  if (variantAttr?.value?.type === 'StringLiteral') {
    const variantValue = variantAttr.value.value
    const radiusToken = VARIANT_BORDER_RADIUS[variantValue] // e.g., "lg"
    if (radiusToken) {
      defaultBorderRadius = RADII_VALUES[radiusToken] // e.g., 12
    }
  }

  // STEP 2: Check if borderRadius is already explicitly set
  // If any of these exist, we DON'T add variant defaults (explicit values win)
  const borderRadius = attributes.find(
    (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'borderRadius',
  )
  const borderTopRadius = attributes.find(
    (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'borderTopRadius',
  )
  const borderBottomRadius = attributes.find(
    (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'borderBottomRadius',
  )

  // STEP 3: Find the disable* props that need to be converted to borderRadius values
  const disableTopRounding = attributes.find(
    (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'disableTopRounding',
  )
  const disableBottomRounding = attributes.find(
    (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'disableBottomRounding',
  )

  /**
   * Helper to determine if a boolean prop is truthy
   * Returns:
   * - true: Prop is definitely truthy (disableTopRounding or disableTopRounding={true})
   * - false: Prop is definitely falsy (disableTopRounding={false})
   * - null: Prop is conditional (disableTopRounding={someCondition}) - needs ternary expression
   */
  const isTruthy = (attr) => {
    if (!attr || !attr.value) {
      return true // <Box disableTopRounding> means {true}
    }
    if (attr.value.type === 'JSXExpressionContainer') {
      const expr = attr.value.expression
      if (expr.type === 'BooleanLiteral' || expr.type === 'Literal') {
        return expr.value === true
      }
      // For other expressions (Identifier, LogicalExpression, etc.), we can't determine
      // at transform time, so return null to indicate conditional logic is needed
      return null
    }
    return false
  }

  const addRadiusAttribute = (propName, disableAttr, explicitAttr) => {
    if (disableAttr) {
      const truthyCheck = isTruthy(disableAttr)
      if (truthyCheck === true) {
        newAttributes.push(
          j.jsxAttribute(j.jsxIdentifier(propName), j.jsxExpressionContainer(j.numericLiteral(0))),
        )
      } else if (truthyCheck === null) {
        const condition = disableAttr.value.expression
        const fallback =
          defaultBorderRadius !== null
            ? j.numericLiteral(defaultBorderRadius)
            : j.identifier('undefined')
        newAttributes.push(
          j.jsxAttribute(
            j.jsxIdentifier(propName),
            j.jsxExpressionContainer(
              j.conditionalExpression(condition, j.numericLiteral(0), fallback),
            ),
          ),
        )
      }
    } else if (defaultBorderRadius !== null && !explicitAttr && !borderRadius) {
      newAttributes.push(
        j.jsxAttribute(
          j.jsxIdentifier(propName),
          j.jsxExpressionContainer(j.numericLiteral(defaultBorderRadius)),
        ),
      )
    }
  }

  const newAttributes = []
  addRadiusAttribute('borderTopRadius', disableTopRounding, borderTopRadius)
  addRadiusAttribute('borderBottomRadius', disableBottomRounding, borderBottomRadius)

  const filteredAttributes = attributes.filter(
    (attr) =>
      !(
        attr.type === 'JSXAttribute' &&
        (attr.name?.name === 'disableTopRounding' || attr.name?.name === 'disableBottomRounding')
      ),
  )

  return [...filteredAttributes, ...newAttributes]
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? 'native-base'
  const targetImport = options.targetImport ?? 'react-native'
  const targetName = options.targetName ?? 'View'
  const tokenImport = options.tokenImport

  if (!tokenImport) {
    throw new Error('--tokenImport is required (e.g., --tokenImport="@your/design-tokens")')
  }

  // import { Box } from 'native-base'
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })

  if (!imports.length || !hasNamedImport(imports, 'Box')) {
    return fileInfo.source
  }

  // Find all JSX elements named Box
  const boxElements = findJSXElements(root, 'Box', j)

  // Find derived names: const AnimatedBox = withAnimated(Box)
  // Only match HOC patterns, not components that use Box in JSX body
  const derivedNames = new Set()
  root
    .find(j.VariableDeclarator)
    .filter((path) => {
      const init = path.node.init
      if (!init) {
        return false
      }

      // Only match CallExpression patterns: withAnimated(Box), Animated.createAnimatedComponent(Box)
      // Skip ArrowFunctionExpression and FunctionExpression (component definitions)
      if (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression') {
        return false
      }

      // For CallExpression, check if Box is a direct argument
      if (init.type === 'CallExpression') {
        const hasBoxArg = init.arguments.some(
          (arg) => arg.type === 'Identifier' && arg.name === 'Box',
        )
        if (hasBoxArg && path.node.id && path.node.id.type === 'Identifier') {
          derivedNames.add(path.node.id.name)
          return true
        }
      }

      return false
    })
    .forEach(() => {})

  // Collect all elements (direct Box + derived names)
  const allElements = [...boxElements.paths()]
  for (const name of derivedNames) {
    const derivedElements = findJSXElements(root, name, j)
    allElements.push(...derivedElements.paths())
  }

  if (allElements.length === 0) {
    // Box imported but not used at all - safe to remove
    removeNamedImport(imports, 'Box', j)
    return fileInfo.source
  }

  const styles = createStyleContext()
  const warnings = []
  let migrated = 0
  let skipped = 0

  allElements.forEach((path, index) => {
    const elementName = path.node.openingElement.name.name
    const attributes = path.node.openingElement.attributes || []

    // Pre-process to make variant borderRadius and disable* props explicit
    const processedAttributes = preprocessBoxAttributes(attributes, j)

    const {
      styleProps,
      inlineStyles,
      transformedProps,
      propsToRemove,
      usedTokenHelpers,
      droppedProps,
      invalidStyles,
      existingStyleReferences,
      hasManualFailures,
    } = categorizeProps(processedAttributes, boxProps, j)

    // Skip if manual fixes needed (unless --unsafe mode)
    if (hasManualFailures) {
      const msg = options.unsafe
        ? `${elementName}: unsafe mode - proceeding with partial migration (${fileInfo.path})`
        : `${elementName} skipped - manual fixes required (${fileInfo.path})`
      warnings.push(msg)
      if (!options.unsafe) {
        addTodoComment(path, elementName, invalidStyles, j)
        skipped++
        return
      }
    }

    styles.addHelpers(usedTokenHelpers)

    // Keep only direct props (filter out style props and dropped props)
    const attrs = filterAttributes(processedAttributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    // Add transformed props
    addTransformedProps(attrs, transformedProps, j)

    // Build and add style prop
    const tempStyles = []
    const style = buildStyleValue(
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

    // Add style prop to element (only if style is not null)
    if (style) {
      const styleProp = j.jsxAttribute(j.jsxIdentifier('style'), j.jsxExpressionContainer(style))
      attrs.push(styleProp)
    }

    // Update element name and attributes
    // Only rename if it's the direct Box component, not a derived name
    if (elementName === 'Box') {
      path.node.openingElement.name = j.jsxIdentifier(targetName)
      if (path.node.closingElement) {
        path.node.closingElement.name = j.jsxIdentifier(targetName)
      }
    }
    path.node.openingElement.attributes = attrs

    addElementComment(path, droppedProps, invalidStyles, j)
    migrated++
  })

  // If nothing was migrated, return original source
  if (migrated === 0) {
    if (warnings.length > 0) {
      console.warn('⚠️  Box migration warnings:')
      const uniqueWarnings = [...new Set(warnings)]
      for (const w of uniqueWarnings) {
        console.warn(`   ${w}`)
      }
    }
    return fileInfo.source
  }

  // Replace Box identifier references with View (e.g., withAnimated(Box) -> withAnimated(View))
  root.find(j.Identifier, { name: 'Box' }).forEach((path) => {
    const parent = path.parent.node
    // Skip import specifiers and JSX element names (already handled)
    if (parent.type === 'ImportSpecifier') {
      return
    }
    if (parent.type === 'JSXOpeningElement' || parent.type === 'JSXClosingElement') {
      return
    }
    // Replace identifier: withAnimated(Box) -> withAnimated(View)
    path.node.name = targetName
  })

  // Check for BoxProps type references that cannot be auto-fixed
  root.find(j.Identifier, { name: 'BoxProps' }).forEach((path) => {
    const parent = path.parent.node
    // Skip if it's the import specifier itself
    if (parent.type === 'ImportSpecifier') {
      return
    }
    // Found type reference usage
    warnings.push(`BoxProps type reference found - manual migration required (${fileInfo.path})`)
  })

  // Add View import if any elements were successfully migrated
  if (migrated > 0) {
    addNamedImport(root, targetImport, targetName, j)
  }

  // Only remove Box import if no elements were skipped
  // If elements were skipped, they still reference Box in JSX
  if (skipped === 0) {
    removeNamedImport(imports, 'Box', j)
  } else {
    warnings.push(
      `Box import kept - ${skipped} element(s) skipped and still reference Box (${fileInfo.path})`,
    )
  }

  // Output warnings if any
  if (warnings.length > 0) {
    console.warn('⚠️  Box migration warnings:')
    const uniqueWarnings = [...new Set(warnings)]
    for (const w of uniqueWarnings) {
      console.warn(`   ${w}`)
    }
  }

  styles.applyToRoot(root, { wrap: false, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
