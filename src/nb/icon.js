// Migrate NativeBase/Common Icon -> Nordlys Icon
// See icon.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '@puns/shiftkit'
import { createAttribute, findJSXElements } from '@puns/shiftkit/jsx'
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
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? '@hb-frontend/common/src/components'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Icon'
  const targetName = options.targetName ?? 'Icon'

  // Check for Icon imports from both source and target (for re-running)
  const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  const targetImports = root.find(j.ImportDeclaration, { source: { value: targetImport } })

  const hasSourceIcon = sourceImports.length > 0 && hasNamedImport(sourceImports, 'Icon')
  const hasTargetIcon = targetImports.length > 0 && hasNamedImport(targetImports, 'Icon')

  if (!hasSourceIcon && !hasTargetIcon) {
    return fileInfo.source
  }

  const iconElements = findJSXElements(root, 'Icon', j)

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

        // Extract value based on attribute value type
        let value = null
        if (attr.value?.type === 'JSXExpressionContainer') {
          value = attr.value.expression
        } else if (attr.value?.type === 'StringLiteral') {
          value = attr.value
        }

        const converted = convertSizeToNumber(value, j)

        if (converted) {
          newAttributes.push(createAttribute(propName, converted, j))
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

    // Add defaults for missing required props
    if (!hasName) {
      warnings.push('Icon: Missing required "name" prop')
    }
    if (!hasWidth) {
      newAttributes.push(createAttribute('width', j.numericLiteral(20), j))
    }
    if (!hasHeight) {
      newAttributes.push(createAttribute('height', j.numericLiteral(20), j))
    }
    if (!hasColor) {
      newAttributes.push(createAttribute('color', j.stringLiteral('icon.primary'), j))
    }

    path.node.openingElement.attributes = newAttributes
  })

  if (warnings.length > 0) {
    console.warn('⚠️  Icon migration warnings:')
    for (const w of warnings) {
      console.warn(`   ${w}`)
    }
  }

  // Remove Icon from source import (if it exists) and add to target
  if (hasSourceIcon) {
    removeNamedImport(sourceImports, 'Icon', j)
  }
  addNamedImport(root, targetImport, targetName, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
