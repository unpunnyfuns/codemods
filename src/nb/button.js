/**
 * NativeBase/Common Button to Nordlys Button with extracted icon and text props
 *
 * Children extracted to text prop
 * leftIcon={<Icon name="..." />} extracted to icon="..." prop
 * rightIcon not supported (dropped with warning)
 * Variant mapping: solid/outline/ghost/link to Nordlys variant+type combinations
 * disabled becomes isDisabled, size xs becomes sm
 * onPress required (no-op added if missing)
 * Re-runnable on partially migrated files
 */

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import {
  addTransformedProps,
  buildStyleValue,
  createAttribute,
  createSelfClosingElement,
  createStringAttribute,
  createViewWrapper,
  extractPropFromJSXElement,
  extractSimpleChild,
  filterAttributes,
  findJSXElements,
  getAttributeValue,
  hasAttribute,
} from '@puns/shiftkit/jsx'
import { createStyleContext } from '../helpers/style-context.js'
import { platformPseudoProps, themePseudoProps, unsupportedProps } from './mappings/props-drop.js'
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

// styleProps: spacing, sizing, colors, borders, layout, flexbox, position (excludes 'size', 'color')
// transformProps: disabled -> isDisabled, size xs -> sm
// directProps: onPress, testID, isLoading, isDisabled
// dropProps: colorScheme, leftIcon, rightIcon, _text, _loading, platform/theme/pseudo
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
delete styleProps.size // 'size' is a Button prop, not a style
delete styleProps.color // Button text color is controlled by variant/type, not a color prop

const transformProps = {
  disabled: 'isDisabled',
  size: { propName: 'size', valueMap: { xs: 'sm' } }, // xs not supported in Nordlys
}

const directPropsList = ['onPress', 'testID', 'isLoading', 'isDisabled']

const dropPropsList = [
  ...platformPseudoProps, // _ios, _android, _web
  ...themePseudoProps, // _light, _dark
  ...unsupportedProps, // Props that don't map to React Native
  'colorScheme', // Replaced by variant+type
  'leftIcon', // Extracted to icon prop
  'rightIcon', // Not supported (dropped with warning)
  '_text', // Style overrides not supported
  '_loading', // Style overrides not supported
]

const buttonProps = {
  styleProps,
  transformProps,
  directProps: directPropsList,
  dropProps: dropPropsList,
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport
  const targetImport = options.targetImport
  const targetName = options.targetName ?? 'Button'
  const tokenImport = options.tokenImport
  const wrap = options.wrap ?? true

  if (!sourceImport) {
    throw new Error('--sourceImport is required (e.g., --sourceImport="@your/common/components")')
  }
  if (!targetImport) {
    throw new Error('--targetImport is required (e.g., --targetImport="@your/components/Button")')
  }
  if (!tokenImport) {
    throw new Error('--tokenImport is required (e.g., --tokenImport="@your/design-tokens")')
  }

  // Check for Button imports from source (e.g., import { Button } from '@source/components')
  const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })

  // Also check for imports from targetImport (for re-running on partially migrated files)
  const targetImports = root.find(j.ImportDeclaration, { source: { value: targetImport } })

  const hasSourceButton = sourceImports.length > 0 && hasNamedImport(sourceImports, 'Button')
  const hasTargetButton = targetImports.length > 0 && hasNamedImport(targetImports, 'Button')

  if (!hasSourceButton && !hasTargetButton) {
    return fileInfo.source
  }

  const getLocalName = (imports, importedName) => {
    let localName = null
    imports.forEach((path) => {
      const spec = (path.node.specifiers || []).find(
        (s) => s.type === 'ImportSpecifier' && s.imported.name === importedName,
      )
      if (spec) {
        localName = spec.local.name
      }
    })
    return localName
  }

  const sourceButtonName = hasSourceButton ? getLocalName(sourceImports, 'Button') : null
  const targetButtonName = hasTargetButton ? getLocalName(targetImports, 'Button') : null

  const allButtonElements = [
    ...(sourceButtonName ? findJSXElements(root, sourceButtonName, j).paths() : []),
    ...(targetButtonName ? findJSXElements(root, targetButtonName, j).paths() : []),
  ]

  if (allButtonElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  let migrated = 0
  let skipped = 0
  const styles = createStyleContext()

  allButtonElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    let icon = null
    let text = null

    const leftIcon = getAttributeValue(attributes, 'leftIcon')
    if (leftIcon) {
      const iconName = extractPropFromJSXElement(leftIcon, 'Icon', 'name')
      if (iconName) {
        icon = typeof iconName === 'string' ? j.stringLiteral(iconName) : iconName
      }
    }

    const { value: extractedText, isComplex } = extractSimpleChild(children, j, {
      allowedExpressionTypes: [
        'Identifier',
        'CallExpression',
        'MemberExpression',
        'StringLiteral',
        'ConditionalExpression',
        'TemplateLiteral',
        'LogicalExpression',
        'BinaryExpression',
        'NumericLiteral',
        'BooleanLiteral',
      ],
    })
    if (isComplex) {
      warnings.push(
        `Button with complex children cannot be automatically migrated - requires manual conversion (${fileInfo.path})`,
      )
      skipped++
      return
    }
    text = extractedText

    if (!icon && !text) {
      warnings.push(
        `Button without text or icon cannot be migrated - empty button (${fileInfo.path})`,
      )
      skipped++
      return
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
    } = categorizeProps(attributes, buttonProps, j)

    // Skip if manual fixes needed (unless --unsafe mode)
    if (hasManualFailures) {
      const msg = options.unsafe
        ? `⚠️  Button: unsafe mode - proceeding with partial migration (${fileInfo.path})`
        : `⚠️  Button skipped - manual fixes required (${fileInfo.path})`
      console.warn(msg)
      if (!options.unsafe) {
        addTodoComment(path, 'Button', invalidStyles, j)
        return
      }
    }

    styles.addHelpers(usedTokenHelpers)

    if (hasAttribute(attributes, 'rightIcon')) {
      warnings.push('Button rightIcon not supported in Nordlys - dropped')
    }

    const attrs = filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    addTransformedProps(attrs, transformedProps, j)

    // Always set icon (undefined if no icon)
    attrs.push(createAttribute('icon', icon || j.identifier('undefined'), j))

    if (text) {
      attrs.push(createAttribute('text', text, j))
    }

    // Add defaults for required props
    if (!hasAttribute(attributes, 'onPress')) {
      attrs.push(createAttribute('onPress', j.arrowFunctionExpression([], j.blockStatement([])), j))
      warnings.push('Button: Missing onPress - added no-op handler (TODO: wire up actual handler)')
    }

    if (!hasAttribute(attributes, 'size') && !transformedProps.size) {
      attrs.push(createStringAttribute('size', 'md', j))
      warnings.push('Button: Missing size - defaulted to "md"')
    }

    // Map NativeBase variant to Nordlys variant + type
    const variant = getAttributeValue(attributes, 'variant')
    const variantValue =
      variant?.type === 'StringLiteral' ? variant.value : variant?.value || 'primary'

    let nordlysVariant = 'primary'
    let nordlysType = 'solid'

    // If already using Nordlys variants (primary/secondary), preserve them
    if (variantValue === 'primary' || variantValue === 'secondary') {
      nordlysVariant = variantValue
      nordlysType = 'solid'
    } else {
      // Map NativeBase/other variants
      switch (variantValue) {
        case 'solid':
          nordlysVariant = 'primary'
          nordlysType = 'solid'
          break
        case 'outline':
          nordlysVariant = 'secondary'
          nordlysType = 'solid'
          break
        case 'ghost':
        case 'link':
        case 'unstyled':
          nordlysVariant = 'primary'
          nordlysType = 'ghost'
          break
        default:
          nordlysVariant = 'primary'
          nordlysType = 'solid'
      }
    }

    attrs.push(createStringAttribute('variant', nordlysVariant, j))
    attrs.push(createStringAttribute('type', nordlysType, j))

    addElementComment(path, droppedProps, invalidStyles, j)

    const element = createSelfClosingElement(targetName, attrs, j)

    const hasStyles = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    if (wrap && hasStyles) {
      const styleName = `button${index}`

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

    migrated++
  })

  if (warnings.length > 0) {
    console.warn(`⚠️  Button migration: ${migrated} migrated, ${skipped} skipped`)
    const uniqueWarnings = [...new Set(warnings)]
    for (const w of uniqueWarnings) {
      console.warn(`   ${w}`)
    }
  }

  // Only change imports if we successfully migrated at least one button
  if (migrated === 0) {
    return fileInfo.source
  }

  // Remove the Button import from sourceImport (if it exists)
  if (hasSourceButton) {
    removeNamedImport(sourceImports, 'Button', j)
  }

  // Always add/ensure Button import to targetImport
  // If it already exists, addNamedImport is smart enough to not duplicate it
  addNamedImport(root, targetImport, targetName, j)

  // Remove Icon import if no longer used anywhere
  const iconImports = root.find(j.ImportDeclaration).filter((path) => {
    return (path.node.specifiers || []).some(
      (spec) => spec.type === 'ImportSpecifier' && spec.imported.name === 'Icon',
    )
  })
  if (iconImports.length > 0) {
    // Check for JSX usage: <Icon />
    const iconJSXUsages = root.find(j.JSXElement, {
      openingElement: { name: { name: 'Icon' } },
    })

    // Check for identifier references (types, re-exports, etc.)
    const iconIdentifierUsages = root.find(j.Identifier, { name: 'Icon' })

    // Count non-import usages (exclude the import specifier itself)
    let nonImportUsages = 0
    iconIdentifierUsages.forEach((path) => {
      // Skip if this is the import specifier
      if (path.parent.node.type === 'ImportSpecifier') {
        return
      }
      nonImportUsages++
    })

    if (iconJSXUsages.length === 0 && nonImportUsages === 0) {
      removeNamedImport(iconImports, 'Icon', j)
    }
  }

  styles.applyToRoot(root, { wrap, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
