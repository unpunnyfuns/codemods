/**
 * Migrate NativeBase Typography to Nordlys Typography
 *
 * Key differences:
 * - Nordlys Typography doesn't accept style props (margin, padding, etc.)
 * - Style props need to be wrapped in a View with StyleSheet
 * - fontWeight/fontSize/lineHeight props are dropped (managed internally)
 * - Color expects ColorPath string (Typography resolves internally)
 *
 * Before:
 * <Typography type="heading" size="xl" mb="lg" fontWeight="700">
 *   {text}
 * </Typography>
 *
 * After:
 * <View style={styles.typography0}>
 *   <Typography type="heading" size="xl">
 *     {text}
 *   </Typography>
 * </View>
 *
 * const styles = StyleSheet.create({
 *   typography0: { marginBottom: space.lg }
 * })
 */

import { getNordlysColorPath } from './mappings/color-mappings.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from './utils/imports.js'

// Props that stay on Typography element
const TYPOGRAPHY_PROPS = ['type', 'size', 'color', 'align', 'numberOfLines', 'textDecorationLine']

// React Native Text props that pass through
const TEXT_PROPS = [
  'testID',
  'onPress',
  'onLongPress',
  'accessibilityLabel',
  'accessibilityHint',
  'accessibilityRole',
  'accessible',
]

// Style props that need View wrapper (from common-style-props)
const STYLE_PROPS = {
  // Spacing
  margin: { styleName: 'margin', tokenHelper: 'space' },
  marginTop: { styleName: 'marginTop', tokenHelper: 'space' },
  marginBottom: { styleName: 'marginBottom', tokenHelper: 'space' },
  marginLeft: { styleName: 'marginLeft', tokenHelper: 'space' },
  marginRight: { styleName: 'marginRight', tokenHelper: 'space' },
  m: { styleName: 'margin', tokenHelper: 'space' },
  mt: { styleName: 'marginTop', tokenHelper: 'space' },
  mb: { styleName: 'marginBottom', tokenHelper: 'space' },
  ml: { styleName: 'marginLeft', tokenHelper: 'space' },
  mr: { styleName: 'marginRight', tokenHelper: 'space' },
  mx: { styleName: 'marginHorizontal', tokenHelper: 'space' },
  my: { styleName: 'marginVertical', tokenHelper: 'space' },
  padding: { styleName: 'padding', tokenHelper: 'space' },
  paddingTop: { styleName: 'paddingTop', tokenHelper: 'space' },
  paddingBottom: { styleName: 'paddingBottom', tokenHelper: 'space' },
  paddingLeft: { styleName: 'paddingLeft', tokenHelper: 'space' },
  paddingRight: { styleName: 'paddingRight', tokenHelper: 'space' },
  p: { styleName: 'padding', tokenHelper: 'space' },
  pt: { styleName: 'paddingTop', tokenHelper: 'space' },
  pb: { styleName: 'paddingBottom', tokenHelper: 'space' },
  pl: { styleName: 'paddingLeft', tokenHelper: 'space' },
  pr: { styleName: 'paddingRight', tokenHelper: 'space' },
  px: { styleName: 'paddingHorizontal', tokenHelper: 'space' },
  py: { styleName: 'paddingVertical', tokenHelper: 'space' },

  // Sizing
  width: 'width',
  height: 'height',
  minWidth: 'minWidth',
  maxWidth: 'maxWidth',
  w: 'width',
  h: 'height',

  // Flex
  flex: 'flex',
  flexGrow: 'flexGrow',
  flexShrink: 'flexShrink',
}

// Font props that are managed internally by Typography (drop with warning)
const FONT_PROPS = ['fontWeight', 'fontSize', 'lineHeight', 'fontFamily']

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport || '@hb-frontend/common/src/components'
  const targetImport = options.targetImport || '@hb-frontend/app/src/components/nordlys/Typography'
  const tokenImport = options.tokenImport || '@hb-frontend/nordlys'

  // Find Typography imports
  const imports = root.find(j.ImportDeclaration, {
    source: { value: sourceImport },
  })

  if (!hasNamedImport(imports, 'Typography')) {
    return fileInfo.source
  }

  // Find all Typography JSX elements
  const typographyElements = root.find(j.JSXElement, {
    openingElement: {
      name: { name: 'Typography' },
    },
  })

  if (typographyElements.length === 0) {
    return fileInfo.source
  }

  const elementStyles = []
  const usedTokenHelpers = new Set()
  const warnings = []

  // Transform each Typography element
  typographyElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const styleProps = {}
    const propsToKeep = []
    const propsToRemove = []

    attributes.forEach((attr) => {
      if (attr.type !== 'JSXAttribute') {
        propsToKeep.push(attr)
        return
      }
      if (!attr.name || attr.name.type !== 'JSXIdentifier') {
        propsToKeep.push(attr)
        return
      }

      const propName = attr.name.name

      // Check if it's a Typography-specific prop
      if (TYPOGRAPHY_PROPS.includes(propName)) {
        // Handle color - remap path but keep as string literal (Typography resolves internally)
        if (propName === 'color' && attr.value?.type === 'StringLiteral') {
          const colorPath = getNordlysColorPath(attr.value.value)
          attr.value.value = colorPath
        }
        propsToKeep.push(attr)
        return
      }

      // Check if it's a Text prop (pass through)
      if (TEXT_PROPS.includes(propName)) {
        propsToKeep.push(attr)
        return
      }

      // Check if it's a style prop (extract to View wrapper)
      if (STYLE_PROPS[propName]) {
        const config = STYLE_PROPS[propName]
        let styleName, tokenHelper

        if (typeof config === 'string') {
          styleName = config
          tokenHelper = null
        } else {
          styleName = config.styleName
          tokenHelper = config.tokenHelper
        }

        let value = null
        if (attr.value?.type === 'JSXExpressionContainer') {
          value = attr.value.expression
        } else if (attr.value?.type === 'StringLiteral') {
          value = attr.value
        }

        if (value && (value.type === 'StringLiteral' || value.type === 'NumericLiteral')) {
          let processedValue = value

          // Apply token helper for string literals
          if (tokenHelper && value.type === 'StringLiteral') {
            processedValue = buildNestedMemberExpression(j, tokenHelper, value.value)
            usedTokenHelpers.add(tokenHelper)
          }

          styleProps[styleName] = processedValue
          propsToRemove.push(propName)
        }
        return
      }

      // Check if it's a font prop (drop with warning)
      if (FONT_PROPS.includes(propName)) {
        warnings.push(
          `Typography: Dropped ${propName} prop (managed internally by Nordlys Typography)`,
        )
        propsToRemove.push(propName)
        return
      }

      // Unknown prop - keep it
      propsToKeep.push(attr)
    })

    // Update attributes (remove style props) BEFORE wrapping
    path.node.openingElement.attributes = propsToKeep

    // If we have style props, wrap in View
    if (Object.keys(styleProps).length > 0) {
      const styleName = `typography${index}`
      elementStyles.push({ name: styleName, styles: styleProps })

      // Clone the Typography element (not the node itself, to avoid mutations)
      const typographyElement = j.jsxElement(
        path.node.openingElement,
        path.node.closingElement,
        path.node.children,
        path.node.selfClosing,
      )

      // Create View wrapper with cloned Typography as child
      const viewElement = j.jsxElement(
        j.jsxOpeningElement(j.jsxIdentifier('View'), [
          j.jsxAttribute(
            j.jsxIdentifier('style'),
            j.jsxExpressionContainer(
              j.memberExpression(j.identifier('styles'), j.identifier(styleName)),
            ),
          ),
        ]),
        j.jsxClosingElement(j.jsxIdentifier('View')),
        [typographyElement],
      )

      // Replace Typography with wrapped version
      j(path).replaceWith(viewElement)
    }
  })

  // Print warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Typography migration warnings:')
    warnings.forEach((w) => console.warn(`   ${w}`))
  }

  // Update imports
  removeNamedImport(imports, 'Typography', j)
  addNamedImport(root, targetImport, 'Typography', j)

  // Add View and StyleSheet imports if we have styles
  if (elementStyles.length > 0) {
    addNamedImport(root, 'react-native', 'View', j)
    addNamedImport(root, 'react-native', 'StyleSheet', j)
  }

  // Add token imports
  usedTokenHelpers.forEach((helper) => {
    addNamedImport(root, tokenImport, helper, j)
  })

  // Add StyleSheet.create() if we have styles
  if (elementStyles.length > 0) {
    const styleProperties = elementStyles.map(({ name, styles }) => {
      const props = Object.entries(styles).map(([key, value]) => {
        return j.property('init', j.identifier(key), value)
      })
      return j.property('init', j.identifier(name), j.objectExpression(props))
    })

    // Check if StyleSheet.create already exists
    const existingStyleSheet = root.find(j.VariableDeclarator, {
      id: { name: 'styles' },
      init: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'StyleSheet' },
          property: { name: 'create' },
        },
      },
    })

    if (existingStyleSheet.length > 0) {
      // Extend existing StyleSheet
      existingStyleSheet.forEach((path) => {
        const createCallArgs = path.node.init.arguments
        if (createCallArgs.length > 0 && createCallArgs[0].type === 'ObjectExpression') {
          createCallArgs[0].properties.push(...styleProperties)
        }
      })
    } else {
      // Create new StyleSheet
      const styleSheetCall = j.variableDeclaration('const', [
        j.variableDeclarator(
          j.identifier('styles'),
          j.callExpression(j.memberExpression(j.identifier('StyleSheet'), j.identifier('create')), [
            j.objectExpression(styleProperties),
          ]),
        ),
      ])

      root.find(j.Program).forEach((path) => {
        path.node.body.push(styleSheetCall)
      })
    }
  }

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
