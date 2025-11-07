/**
 * NativeBase/Common Icon → Nordlys Icon
 *
 * Simple migration:
 * - name passes through
 * - width/height: token → number
 * - color: NB ColorPath → Nordlys ColorPath
 * - Defaults added for missing props
 */

import { createAttribute } from '@puns/shiftkit/jsx'
import { pipeline } from '../infrastructure/core/pipeline.js'
import {
  checkImports,
  findElements,
  manageImports,
  parseOptions,
  transformElements,
} from '../infrastructure/steps/pipeline-steps.js'
import { NB_SPACE_SCALE_NUMERIC } from './models/source-nativebase.js'
import { getNordlysColorPath } from './models/transforms-colors.js'

// Icon configuration
const iconConfig = {
  sourceImport: '@hb-frontend/common/src/components',
  targetImport: '@hb-frontend/app/src/components/nordlys/Icon',
  targetName: 'Icon',
  tokenImport: '@hb-frontend/nordlys',
  wrap: false,
}

const ICON_DEFAULTS = {
  width: 20,
  height: 20,
  color: 'icon.primary',
}

/**
 * Convert width/height from NB space token to numeric pixels
 * xl → 20, etc.
 */
function convertSizeToNumber(value, j) {
  if (!value) {
    return null
  }

  // Already a number: width={20}
  if (value.type === 'NumericLiteral') {
    return value
  }

  // String literal: width="xl"
  if (value.type === 'StringLiteral') {
    const token = value.value
    if (NB_SPACE_SCALE_NUMERIC[token] !== undefined) {
      return j.numericLiteral(NB_SPACE_SCALE_NUMERIC[token])
    }
  }

  // Expression: width={iconSize} - keep as-is
  return value
}

/**
 * Convert color path
 */
function convertIconColor(value) {
  if (value?.type === 'StringLiteral') {
    return getNordlysColorPath(value.value)
  }
  return value?.value
}

/**
 * Transform a single Icon element
 *
 * Returns { element, warnings } instead of mutating context.
 */
function transformIcon(path, _index, ctx) {
  const { j } = ctx
  const attributes = path.node.openingElement.attributes || []
  const newAttributes = []
  const warnings = []

  // Track which required props we've seen
  const seen = {
    name: false,
    width: false,
    height: false,
    color: false,
  }

  // Process each attribute
  for (const attr of attributes) {
    if (attr.type !== 'JSXAttribute' || !attr.name) {
      // Spread attributes not supported
      if (attr.type === 'JSXSpreadAttribute') {
        warnings.push('Icon: Spread attributes not supported in Nordlys Icon (dropped)')
      }
      continue
    }

    const propName = attr.name.name

    // Keep name and testID as-is
    if (propName === 'name' || propName === 'testID') {
      if (propName === 'name') {
        seen.name = true
      }
      newAttributes.push(attr)
      continue
    }

    // Convert width/height from token to number
    if (propName === 'width' || propName === 'height') {
      seen[propName] = true

      // Extract value
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
      continue
    }

    // Convert color path
    if (propName === 'color') {
      seen.color = true
      if (attr.value?.type === 'StringLiteral') {
        const colorPath = convertIconColor(attr.value)
        attr.value.value = colorPath
      }
      newAttributes.push(attr)
      continue
    }

    // Drop all other props
    warnings.push(`Icon: Dropped unsupported prop "${propName}"`)
  }

  // Add defaults for missing required props
  if (!seen.name) {
    warnings.push('Icon: Missing required "name" prop')
  }
  if (!seen.width) {
    newAttributes.push(createAttribute('width', j.numericLiteral(ICON_DEFAULTS.width), j))
  }
  if (!seen.height) {
    newAttributes.push(createAttribute('height', j.numericLiteral(ICON_DEFAULTS.height), j))
  }
  if (!seen.color) {
    newAttributes.push(createAttribute('color', j.stringLiteral(ICON_DEFAULTS.color), j))
  }

  // Update element
  path.node.openingElement.attributes = newAttributes

  // Return results immutably
  return {
    element: path.node,
    warnings,
  }
}

/**
 * Main transform - functional pipeline composition
 *
 * The pipeline array is self-documenting: read top-to-bottom to understand flow
 */
export default function transform(fileInfo, api, options) {
  return pipeline(fileInfo, api, options, [
    parseOptions(iconConfig),
    checkImports('Icon'),
    findElements('Icon'),
    transformElements(transformIcon),
    manageImports('Icon'),
  ])
}
