// Migrate NativeBase/Common Icon → Nordlys Icon
// See icon.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import { createJSXHelper } from '../helpers/factory.js'
import { getNordlysColorPath } from './mappings/maps-color.js'
import { NB_SPACE_SCALE_NUMERIC } from './mappings/nativebase-props.js'

function convertSizeToNumber(value, j) {
  if (!value) {
    return null
  }

  // Already a number
  if (value.type === 'NumericLiteral') {
    return value
  }

  // String literal - try to convert
  if (value.type === 'StringLiteral') {
    const token = value.value
    if (NB_SPACE_SCALE_NUMERIC[token] !== undefined) {
      return j.numericLiteral(NB_SPACE_SCALE_NUMERIC[token])
    }
  }

  // Expression - keep as is (can't statically analyze)
  return value
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const $ = createJSXHelper(j)
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Icon'
  const targetName = options.targetName ?? 'Icon'

  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Icon')) {
    return fileInfo.source
  }

  const iconElements = $.findElements(root, 'Icon')

  if (iconElements.length === 0) {
    return fileInfo.source
  }

  const warnings = []

  iconElements.forEach((path) => {
    const attributes = path.node.openingElement.attributes || []
    const newAttributes = []

    // Track which props we've seen
    let hasName = false
    let hasWidth = false
    let hasHeight = false
    let hasColor = false

    attributes.forEach((attr) => {
      if (attr.type !== 'JSXAttribute' || !attr.name) {
        // Keep spread attributes but warn
        if (attr.type === 'JSXSpreadAttribute') {
          warnings.push('Icon: Spread attributes not supported in Nordlys Icon (dropped)')
        }
        return
      }

      const propName = attr.name.name

      // Keep name and testID as-is
      if (propName === 'name' || propName === 'testID') {
        if (propName === 'name') {
          hasName = true
        }
        newAttributes.push(attr)
        return
      }

      // Convert width/height from token to number
      if (propName === 'width' || propName === 'height') {
        if (propName === 'width') {
          hasWidth = true
        }
        if (propName === 'height') {
          hasHeight = true
        }

        const value = $.extractAttributeValue(attr.value)
        const converted = convertSizeToNumber(value, j)

        if (converted) {
          newAttributes.push($.createAttribute(propName, converted))
        } else {
          newAttributes.push(attr)
        }
        return
      }

      // Convert color from NativeBase token to Nordlys ColorPath
      if (propName === 'color') {
        hasColor = true
        if (attr.value?.type === 'StringLiteral') {
          const colorPath = getNordlysColorPath(attr.value.value)
          attr.value.value = colorPath
        }
        newAttributes.push(attr)
        return
      }

      // Drop other props (style props, etc.)
      warnings.push(`Icon: Dropped unsupported prop "${propName}"`)
    })

    // Warn if required props missing
    if (!hasName) {
      warnings.push('Icon: Missing required "name" prop')
    }
    if (!hasWidth) {
      warnings.push('Icon: Missing required "width" prop (add width={20})')
    }
    if (!hasHeight) {
      warnings.push('Icon: Missing required "height" prop (add height={20})')
    }
    if (!hasColor) {
      warnings.push('Icon: Missing required "color" prop (add color="icon.primary")')
    }

    path.node.openingElement.attributes = newAttributes
  })

  if (warnings.length > 0) {
    console.warn('⚠️  Icon migration warnings:')
    for (const w of warnings) {
      console.warn(`   ${w}`)
    }
  }

  removeNamedImport(imports, 'Icon', j)
  addNamedImport(root, targetImport, targetName, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
