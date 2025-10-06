/**
 * Reusable pipeline steps for component migrations
 *
 * Each step is a factory function that returns a step: (ctx) => { ctx: newContext } | { skip: true, reason }
 * ALL steps follow the factory pattern for consistency.
 * Steps are composable and can be used by any codemod.
 */

import { createStyleContext } from './style-context.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from './imports.js'
import { findJSXElements } from './jsx.js'

/**
 * @typedef {Object} Context
 * @property {Object} fileInfo - jscodeshift fileInfo
 * @property {Object} api - jscodeshift api
 * @property {Object} j - jscodeshift instance
 * @property {Object} root - AST root
 * @property {Object} options - Raw CLI options
 * @property {Object} parsedOptions - Parsed and validated options
 * @property {Array} elements - JSX elements to transform
 * @property {Object} [styles] - StyleSheet context (if using styles)
 * @property {Array<string>} warnings - Warning messages
 * @property {number} migrated - Count of successfully migrated elements
 * @property {number} skipped - Count of skipped elements
 */

/**
 * Parse and validate options
 *
 * @param {object} defaults - Default option values
 * @returns {Function} Step function
 */
export function parseOptions(defaults) {
  return (ctx) => {
    const options = {
      sourceImport: ctx.options.sourceImport || defaults.sourceImport,
      targetImport: ctx.options.targetImport || defaults.targetImport,
      targetName: ctx.options.targetName || defaults.targetName,
      tokenImport: ctx.options.tokenImport || defaults.tokenImport,
      wrap: ctx.options.wrap ?? defaults.wrap ?? true,
      unsafe: ctx.options.unsafe ?? false,
    }

    // Validation
    if (!options.targetImport) {
      throw new Error('--targetImport is required')
    }
    if (!options.tokenImport) {
      throw new Error('--tokenImport is required')
    }

    return { ctx: { ...ctx, parsedOptions: options } }
  }
}

/**
 * Check if file can be skipped (no relevant imports)
 *
 * @param {string|string[]} elementName - Element name(s) to find (e.g., 'Box' or ['HStack', 'VStack'])
 * @param {boolean} rerunnable - Whether to also check target imports
 * @returns {Function} Step function
 */
export function checkImports(elementName, rerunnable = true) {
  return (ctx) => {
    const { root, j, parsedOptions } = ctx
    const { sourceImport, targetImport } = parsedOptions

    const names = Array.isArray(elementName) ? elementName : [elementName]

    const hasSource = sourceImport && names.some((name) => hasImport(root, sourceImport, name, j))

    const hasTarget =
      rerunnable && targetImport && names.some((name) => hasImport(root, targetImport, name, j))

    if (!hasSource && !hasTarget) {
      return { skip: true, reason: 'No relevant imports found' }
    }

    return { ctx }
  }
}

/**
 * Find elements to transform
 *
 * @param {string} elementName - Element name to find
 * @param {Function} [customFinder] - Optional custom finder: (ctx) => elements[]
 * @returns {Function} Step function
 *
 * @example
 * // Standard usage
 * findElements('Icon')
 *
 * // Custom finder
 * function findBoxElementsImpl(ctx) {
 *   // Custom logic to find elements
 *   return elements  // Return array directly
 * }
 * findElements('Box', findBoxElementsImpl)
 */
export function findElements(elementName, customFinder = null) {
  return (ctx) => {
    const { root, j, parsedOptions } = ctx
    const { sourceImport } = parsedOptions

    let elements = []

    if (customFinder) {
      elements = customFinder(ctx)
    } else {
      // Only find elements from source import - target elements are already migrated
      if (sourceImport && hasImport(root, sourceImport, elementName, j)) {
        elements.push(...findJSXElements(root, elementName, j).paths())
      }
    }

    if (elements.length === 0) {
      return { skip: true, reason: 'No elements found' }
    }

    return { ctx: { ...ctx, elements } }
  }
}

/**
 * Initialize style context for StyleSheet generation
 *
 * @returns {Function} Step function
 */
export function initStyleContext() {
  return (ctx) => {
    const styles = createStyleContext()
    return { ctx: { ...ctx, styles } }
  }
}

/**
 * Transform elements using a transform function
 *
 * Transform functions should return { element, warnings, metadata } instead of mutating context.
 * This step collects results and updates context immutably.
 *
 * @param {Function} transformFn - Transform function: (path, index, ctx) => { element, warnings?, tokenHelpers?, styles? }
 * @returns {Function} Step function
 *
 * @example
 * function transformBox(path, index, ctx) {
 *   const warnings = []
 *   if (shouldSkip) {
 *     warnings.push('Skipped')
 *     return { element: null, warnings }
 *   }
 *   return {
 *     element: transformedNode,
 *     warnings,
 *     tokenHelpers: new Set(['space']),
 *     styles: [{ name: 'box0', styles: {...} }]
 *   }
 * }
 */
export function transformElements(transformFn) {
  return (ctx) => {
    const { elements, j } = ctx

    let migrated = 0
    let skipped = 0
    const allWarnings = []
    const allTokenHelpers = new Set()
    const allStyles = []

    elements.forEach((path, index) => {
      const result = transformFn(path, index, ctx)

      if (result.element) {
        j(path).replaceWith(result.element)
        migrated++
      } else {
        skipped++
      }

      if (result.warnings && result.warnings.length > 0) {
        allWarnings.push(...result.warnings)
      }

      if (result.tokenHelpers) {
        for (const helper of result.tokenHelpers) {
          allTokenHelpers.add(helper)
        }
      }

      if (result.styles && result.styles.length > 0) {
        allStyles.push(...result.styles)
      }
    })

    // If nothing migrated, skip
    if (migrated === 0) {
      return { skip: true, reason: 'No elements successfully migrated', warnings: allWarnings }
    }

    // Return immutable update
    return {
      ctx: {
        ...ctx,
        migrated: ctx.migrated + migrated,
        skipped: ctx.skipped + skipped,
        warnings: [...ctx.warnings, ...allWarnings],
        // Store collected metadata for later steps
        collectedTokenHelpers: allTokenHelpers,
        collectedStyles: allStyles,
      },
    }
  }
}

/**
 * Manage imports (remove source, add target)
 *
 * @param {string} elementName - Element name in imports
 * @param {Function} [customManager] - Optional custom import management: (ctx) => void
 * @returns {Function} Step function
 *
 * @example
 * // Standard usage
 * manageImports('Icon')
 *
 * // Custom import management
 * function manageBoxImportsCustom(ctx) {
 *   // Custom logic: replace Box identifiers with View, etc.
 * }
 * manageImports('Box', manageBoxImportsCustom)
 */
export function manageImports(elementName, customManager = null) {
  return (ctx) => {
    if (customManager) {
      customManager(ctx)
      return { ctx }
    }

    const { root, j, parsedOptions, skipped } = ctx
    const { sourceImport, targetImport, targetName } = parsedOptions

    let keptSourceImport = false
    if (sourceImport) {
      const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
      if (sourceImports.length > 0 && hasNamedImport(sourceImports, elementName)) {
        if (skipped === 0) {
          removeNamedImport(sourceImports, elementName, j)
        } else {
          keptSourceImport = true
          ctx.warnings.push(
            `${elementName} import kept - ${skipped} element(s) skipped and still reference ${elementName}`,
          )
        }
      }
    }

    // If we kept the source import and targetName matches elementName, skip adding to avoid duplicates
    const shouldAddTarget =
      !hasImport(root, targetImport, targetName, j) &&
      !(keptSourceImport && targetName === elementName)
    if (shouldAddTarget) {
      addNamedImport(root, targetImport, targetName, j)
    }

    return { ctx }
  }
}

/**
 * Apply collected style metadata to StyleSheet context
 *
 * This step mutates the styles object (acceptable since it's a builder pattern).
 * Must be called after transformElements() and before applyStyleSheet().
 *
 * @returns {Function} Step function
 */
export function applyCollectedStyles() {
  return (ctx) => {
    const { styles, collectedTokenHelpers, collectedStyles } = ctx

    if (!styles) {
      return { ctx }
    }

    if (collectedTokenHelpers && collectedTokenHelpers.size > 0) {
      styles.addHelpers(collectedTokenHelpers)
    }

    if (collectedStyles && collectedStyles.length > 0) {
      for (const styleEntry of collectedStyles) {
        styles.addStyle(styleEntry.name, styleEntry.styles)
      }
    }

    return { ctx }
  }
}

/**
 * Apply StyleSheet to root
 *
 * @returns {Function} Step function
 */
export function applyStyleSheet() {
  return (ctx) => {
    const { styles, root, j, parsedOptions } = ctx

    if (styles) {
      styles.applyToRoot(
        root,
        {
          wrap: parsedOptions.wrap,
          tokenImport: parsedOptions.tokenImport,
        },
        j,
      )
    }

    return { ctx }
  }
}

/**
 * Preprocess elements before transformation
 *
 * Wraps a preprocessing function to follow the factory pattern.
 * Preprocessing functions can mutate element attributes in place.
 *
 * @param {Function} preprocessFn - Function that preprocesses elements: (ctx) => void
 * @returns {Function} Step function
 *
 * @example
 * // Custom preprocessing
 * function preprocessBoxVariant(ctx) {
 *   const { elements, j } = ctx
 *   elements.forEach(path => {
 *     // Modify path.node.openingElement.attributes
 *   })
 * }
 *
 * // Use in pipeline
 * preprocess(preprocessBoxVariant)
 */
export function preprocess(preprocessFn) {
  return (ctx) => {
    preprocessFn(ctx)
    return { ctx }
  }
}

/**
 * Helper: Check if an import exists
 */
function hasImport(root, importPath, name, j) {
  const imports = root.find(j.ImportDeclaration, { source: { value: importPath } })
  return imports.length > 0 && hasNamedImport(imports, name)
}
