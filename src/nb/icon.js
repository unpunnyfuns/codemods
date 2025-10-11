// Migrate NativeBase/Common Icon → Nordlys Icon
// See icon.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import { getNordlysColorPath } from './mappings/maps-color.js'

// NativeBase space scale (tokens to pixels)
const SPACE_SCALE = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
}

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
    if (SPACE_SCALE[token] !== undefined) {
      return j.numericLiteral(SPACE_SCALE[token])
    }
  }

  // Expression - keep as is (can't statically analyze)
  return value
}

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Icon'
  const targetName = options.targetName ?? 'Icon'

  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length || !hasNamedImport(imports, 'Icon')) {
    return fileInfo.source
  }

  const iconElements = root.find(j.JSXElement, {
    openingElement: {
      name: {
        type: 'JSXIdentifier',
        name: 'Icon',
      },
    },
  })

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

        const value =
          attr.value?.type === 'JSXExpressionContainer' ? attr.value.expression : attr.value
        const converted = convertSizeToNumber(value, j)

        if (converted) {
          newAttributes.push(
            j.jsxAttribute(
              j.jsxIdentifier(propName),
              converted.type === 'NumericLiteral'
                ? j.jsxExpressionContainer(converted)
                : attr.value,
            ),
          )
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
