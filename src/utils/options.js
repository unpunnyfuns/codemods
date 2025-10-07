/**
 * Shared utilities for handling codemod options
 */

/**
 * Merge user options with defaults
 * @param {Object} options - User-provided options
 * @param {Object} defaults - Default values
 * @returns {Object} Merged options
 */
export function mergeOptions(options = {}, defaults = {}) {
  return { ...defaults, ...options }
}

/**
 * Normalize components array - handles backward compat and string-to-object conversion
 * @param {Object} options - Options object that may contain components, sourceName, staticProps
 * @param {Object} fallback - Fallback component config if none provided
 * @returns {Array} Normalized array of component configs
 */
export function normalizeComponents(options, fallback = null) {
  let components = options.components

  // Backward compatibility: if sourceName is provided, convert to components array
  if (!components && options.sourceName) {
    components = [
      {
        name: options.sourceName,
        staticProps: options.staticProps || {},
      },
    ]
  }

  // Use fallback if still no components
  if (!components && fallback) {
    components = [fallback]
  }

  if (!components) {
    return []
  }

  // Normalize components array (strings to objects)
  return components.map((comp) => {
    if (typeof comp === 'string') {
      return { name: comp, staticProps: options.staticProps || {} }
    }
    return comp
  })
}

/**
 * Extract standard codemod options with defaults
 * @param {Object} options - User options
 * @param {Object} defaults - Override defaults
 * @returns {Object} Extracted options with defaults applied
 */
export function extractOptions(options = {}, defaults = {}) {
  const finalDefaults = {
    sourceImport: 'react-native',
    targetImport: 'aurora',
    targetName: 'Stack',
    tokenImport: '@hb-frontend/nordlys',
    ...defaults,
  }

  return {
    sourceImport: options.sourceImport ?? finalDefaults.sourceImport,
    targetImport: options.targetImport ?? finalDefaults.targetImport,
    targetName: options.targetName ?? finalDefaults.targetName,
    tokenImport: options.tokenImport ?? finalDefaults.tokenImport,
    mappings: options.mappings ?? finalDefaults.mappings,
  }
}
