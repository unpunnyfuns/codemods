// Migrate NativeBase Typography → Nordlys Typography with wrapper View for style props
// See typography.md for documentation

import {
  addNamedImport,
  createViewWrapper,
  hasNamedImport,
  removeNamedImport,
} from '@puns/shiftkit'
import { createJSXHelper } from '../helpers/factory.js'
import { createStyleContext } from '../helpers/style-context.js'
import { getNordlysColorPath } from './mappings/maps-color.js'
import { TYPOGRAPHY_RESTRICTED_PROPS } from './mappings/nordlys-props.js'
import { accessibility, eventHandlers } from './mappings/props-direct.js'
import { allPseudoProps } from './mappings/props-drop.js'
import {
  border,
  color,
  extra,
  flexbox,
  layout,
  position,
  sizing,
  spacing,
} from './mappings/props-style.js'
import { addElementComment, categorizeProps } from './props.js'

// Typography prop mappings (component-specific config)
const typographyPropConfig = {
  styleProps: {
    // Style props get extracted to View wrapper
    ...spacing,
    ...sizing,
    ...color,
    ...border,
    ...layout,
    ...flexbox,
    ...position,
    ...extra,
  },
  transformProps: {},
  // Props that stay on Typography element + text props + managed font props
  directProps: [
    'type',
    'size',
    'color',
    'align',
    'numberOfLines',
    'textDecorationLine',
    ...accessibility,
    ...eventHandlers,
  ],
  dropProps: [
    ...allPseudoProps,
    // Font props managed internally by Nordlys Typography
    ...TYPOGRAPHY_RESTRICTED_PROPS.managed,
  ],
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const $ = createJSXHelper(j)
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Typography'
  const targetName = options.targetName ?? 'Typography'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'
  // Default: true (wrap in View when style props exist)
  const wrap = options.wrap ?? true

  const imports = root.find(j.ImportDeclaration, {
    source: { value: sourceImport },
  })

  if (!hasNamedImport(imports, 'Typography')) {
    return fileInfo.source
  }

  const typographyElements = $.findElements(root, 'Typography')

  if (typographyElements.length === 0) {
    return fileInfo.source
  }

  const styles = createStyleContext()
  const warnings = []

  typographyElements.forEach((path, index) => {
    const attributes = path.node.openingElement.attributes || []

    // Use layered categorizeProps
    const {
      styleProps,
      transformedProps,
      propsToRemove,
      usedTokenHelpers: newHelpers,
      droppedProps,
      invalidStyles,
    } = categorizeProps(attributes, typographyPropConfig, j)

    styles.addHelpers(newHelpers)

    // Warn about dropped font props
    for (const { name } of droppedProps) {
      if (TYPOGRAPHY_RESTRICTED_PROPS.managed.includes(name)) {
        warnings.push(`Typography: Dropped ${name} prop (managed internally by Nordlys Typography)`)
      }
    }

    // Handle color prop special case - Typography resolves color internally as string
    const typographyAttributes = attributes.filter((attr) => {
      if (attr.type !== 'JSXAttribute' || !attr.name) {
        return true
      }
      const propName = attr.name.name

      // Keep directProps that aren't being removed
      if (typographyPropConfig.directProps.includes(propName) && !propsToRemove.includes(attr)) {
        // Remap color path but keep as string literal
        if (propName === 'color' && attr.value?.type === 'StringLiteral') {
          const colorPath = getNordlysColorPath(attr.value.value)
          attr.value.value = colorPath
        }
        return true
      }

      return false
    })

    // Add transformed props
    for (const [name, value] of Object.entries(transformedProps)) {
      typographyAttributes.push(j.jsxAttribute(j.jsxIdentifier(name), value))
    }

    path.node.openingElement.attributes = typographyAttributes

    addElementComment(path, droppedProps, invalidStyles, j)

    const hasStyleProps = Object.keys(styleProps).length > 0

    if (wrap && hasStyleProps) {
      const styleName = `typography${index}`
      styles.addStyle(styleName, styleProps)

      const typographyElement = $.clone(path.node)

      const styleValue = j.memberExpression(j.identifier('styles'), j.identifier(styleName))
      const viewElement = createViewWrapper(typographyElement, styleValue, j)

      j(path).replaceWith(viewElement)
    }
  })

  if (warnings.length > 0) {
    console.warn('⚠️  Typography migration warnings:')
    for (const w of warnings) {
      console.warn(`   ${w}`)
    }
  }

  removeNamedImport(imports, 'Typography', j)
  addNamedImport(root, targetImport, targetName, j)

  styles.applyToRoot(root, { wrap, tokenImport }, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
