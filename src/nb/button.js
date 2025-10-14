// Migrate NativeBase/Common Button -> Nordlys Button with extracted icon and text props
// See button.md for documentation

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
import { componentAgnostic, platformOverrides, themeOverrides } from './mappings/props-drop.js'
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

// Button prop mappings
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
delete styleProps.size
delete styleProps.color // Button text color is controlled by variant/type, not a color prop

const transformProps = {
  disabled: 'isDisabled',
  size: { propName: 'size', valueMap: { xs: 'sm' } },
}

const directPropsList = ['onPress', 'testID', 'isLoading', 'isDisabled']

const dropPropsList = [
  ...platformOverrides,
  ...themeOverrides,
  ...componentAgnostic,
  'colorScheme',
  'leftIcon',
  'rightIcon',
  '_text',
  '_loading',
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

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Button'
  const targetName = options.targetName ?? 'Button'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  // Default: true (wrap in View when style props exist)
  const wrap = options.wrap ?? true

  // import { Button } from '@hb-frontend/common/src/components'
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Button')) {
    return fileInfo.source
  }

  // Get the local name of Button import from sourceImport
  let sourceButtonName = null
  imports.forEach((path) => {
    const specifiers = path.node.specifiers || []
    for (const spec of specifiers) {
      if (spec.type === 'ImportSpecifier' && spec.imported.name === 'Button') {
        sourceButtonName = spec.local.name
        break
      }
    }
  })

  if (!sourceButtonName) {
    return fileInfo.source
  }

  const buttonElements = findJSXElements(root, sourceButtonName, j)

  if (buttonElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []
  let migrated = 0
  let skipped = 0
  const styles = createStyleContext()

  buttonElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []
    const children = path.node.children || []

    let iconValue = null
    let textValue = null

    const leftIcon = getAttributeValue(attributes, 'leftIcon')
    if (leftIcon) {
      const iconName = extractPropFromJSXElement(leftIcon, 'Icon', 'name')
      if (iconName) {
        iconValue = typeof iconName === 'string' ? j.stringLiteral(iconName) : iconName
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
    textValue = extractedText

    if (!iconValue && !textValue) {
      warnings.push(
        `Button without text or icon cannot be migrated (icon-only requires manual setup) (${fileInfo.path})`,
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
        return
      }
    }

    styles.addHelpers(usedTokenHelpers)

    if (hasAttribute(attributes, 'rightIcon')) {
      warnings.push('Button rightIcon not supported in Nordlys - dropped')
    }

    const buttonAttributes = filterAttributes(attributes, {
      allow: directPropsList.filter((prop) => !propsToRemove.includes(prop)),
    })

    addTransformedProps(buttonAttributes, transformedProps, j)

    // Always set icon (undefined if no icon)
    buttonAttributes.push(createAttribute('icon', iconValue || j.identifier('undefined'), j))

    if (textValue) {
      buttonAttributes.push(createAttribute('text', textValue, j))
    }

    // Add defaults for required props
    if (!hasAttribute(attributes, 'onPress')) {
      buttonAttributes.push(
        createAttribute('onPress', j.arrowFunctionExpression([], j.blockStatement([])), j),
      )
      warnings.push('Button: Missing onPress - added no-op handler (TODO: wire up actual handler)')
    }

    if (!hasAttribute(attributes, 'size') && !transformedProps.size) {
      buttonAttributes.push(createStringAttribute('size', 'md', j))
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

    buttonAttributes.push(createStringAttribute('variant', nordlysVariant, j))
    buttonAttributes.push(createStringAttribute('type', nordlysType, j))

    addElementComment(path, droppedProps, invalidStyles, j)

    const buttonElement = createSelfClosingElement(targetName, buttonAttributes, j)

    const hasStyleProps = Object.keys(styleProps).length > 0 || Object.keys(inlineStyles).length > 0

    if (wrap && hasStyleProps) {
      const styleName = `button${index}`

      const tempStyles = []
      const styleValue = buildStyleValue(styleProps, inlineStyles, styleName, tempStyles, j, [])
      if (tempStyles.length > 0) {
        styles.addStyle(tempStyles[0].name, tempStyles[0].styles)
      }

      const viewElement = createViewWrapper(buttonElement, styleValue, j)
      j(path).replaceWith(viewElement)
    } else {
      j(path).replaceWith(buttonElement)
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

  // Only remove the Button import from sourceImport
  removeNamedImport(imports, 'Button', j)

  // Check if there's already an import from targetImport and use its alias
  const existingTargetImport = root.find(j.ImportDeclaration, {
    source: { value: targetImport },
  })

  let actualTargetName = targetName
  if (existingTargetImport.length > 0) {
    // Use existing import alias if it exists
    existingTargetImport.forEach((path) => {
      const specifiers = path.node.specifiers || []
      for (const spec of specifiers) {
        if (spec.type === 'ImportSpecifier' && spec.imported.name === 'Button') {
          actualTargetName = spec.local.name
          break
        }
      }
    })
  } else {
    // Add new import only if it doesn't exist
    addNamedImport(root, targetImport, targetName, j)
  }

  // If we used a different target name (alias), update all transformed button elements
  if (actualTargetName !== targetName) {
    root
      .find(j.JSXElement, {
        openingElement: { name: { name: targetName } },
      })
      .forEach((path) => {
        path.node.openingElement.name.name = actualTargetName
        if (path.node.closingElement) {
          path.node.closingElement.name.name = actualTargetName
        }
      })

    root
      .find(j.JSXOpeningElement, {
        name: { name: targetName },
        selfClosing: true,
      })
      .forEach((path) => {
        path.node.name.name = actualTargetName
      })
  }

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
