/**
 * Generate prop mappings from source props and transformation rules
 *
 * Takes a list of source props (from nativebase-props.js) and applies transformation
 * rules to generate mapping configurations (for props-style.js).
 *
 * Rules:
 * - shortcuts: Map shorthand to full name (m → margin)
 * - renames: Map NB name to Nordlys name (marginX → marginHorizontal)
 * - expansions: Map one prop to multiple (size → [width, height])
 * - tokenHelper: Which token helper to use (space, color, radius)
 * - valueMap: Value transformations (full → 100%)
 *
 * Output format matches props-style.js:
 * - String: Direct 1:1 mapping
 * - Object: { styleName, tokenHelper?, valueMap?, properties? }
 */

/**
 * Generate mappings from source props and transformation rules
 *
 * @param {string[]} sourceProps - Array of prop names from NativeBase model
 * @param {object} rules - Transformation rules
 * @param {string} [rules.tokenHelper] - Token helper to use (space, color, radius)
 * @param {object} [rules.valueMap] - Value transformations (full → 100%)
 * @param {object} [rules.shortcuts] - Shorthand mappings (m → margin)
 * @param {object} [rules.renames] - Prop renames (marginX → marginHorizontal)
 * @param {object} [rules.expansions] - Multi-property expansions (size → [width, height])
 * @returns {object} Mapping configuration object
 */
export function generateMappings(sourceProps, rules = {}) {
  const {
    tokenHelper = null,
    valueMap = null,
    shortcuts = {},
    renames = {},
    expansions = {},
  } = rules

  const mappings = {}

  for (const prop of sourceProps) {
    // Check if it's an expansion (one prop → multiple style props)
    if (expansions[prop]) {
      mappings[prop] = {
        properties: expansions[prop],
        ...(tokenHelper && { tokenHelper }),
        ...(valueMap && { valueMap }),
      }
      continue
    }

    // Check if it's a shortcut or rename
    const targetName = shortcuts[prop] || renames[prop] || prop

    // Build mapping config
    if (tokenHelper || valueMap) {
      // Complex mapping with token helper or value map
      mappings[prop] = {
        styleName: targetName,
        ...(tokenHelper && { tokenHelper }),
        ...(valueMap && { valueMap }),
      }
    } else {
      // Simple 1:1 mapping (just a string)
      mappings[prop] = targetName
    }
  }

  return mappings
}
