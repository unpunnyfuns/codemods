/**
 * Functional pipeline for codemod transforms
 *
 * Provides explicit, composable transform flow where each step is a pure function.
 * Steps receive context and return { ctx: newContext } or { skip: true, reason: string }
 *
 * Benefits:
 * - Self-documenting: reading the step array shows exactly what happens
 * - Composable: each codemod assembles only the steps it needs
 * - Testable: steps are pure functions
 * - No inheritance: codemods are just functions that compose steps
 */

/**
 * Run a pipeline of transformation steps
 *
 * @param {object} fileInfo - jscodeshift fileInfo
 * @param {object} api - jscodeshift api
 * @param {object} options - transform options
 * @param {Array<Function>} steps - Array of step functions: (ctx) => { ctx } | { skip, reason }
 * @returns {string} - Transformed source code
 */
export function pipeline(fileInfo, api, options, steps) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Initial context
  let ctx = {
    fileInfo,
    api,
    j,
    root,
    options,
    warnings: [],
    migrated: 0,
    skipped: 0,
  }

  // Run each step
  for (const step of steps) {
    const result = step(ctx)

    // Handle skip signal
    if (result.skip) {
      if (result.warnings) {
        outputWarnings(result.warnings, fileInfo.path)
      }
      return fileInfo.source
    }

    // Update context
    ctx = result.ctx
  }

  // Output warnings if any
  if (ctx.warnings.length > 0) {
    outputWarnings(ctx.warnings, fileInfo.path)
  }

  // Return transformed source
  return ctx.root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

/**
 * Output warnings to console
 */
function outputWarnings(warnings, filePath) {
  if (warnings.length === 0) {
    return
  }

  const unique = [...new Set(warnings)]
  for (const w of unique) {
    console.warn(`⚠️  ${filePath}: ${w}`)
  }
}

/**
 * Helper: Create a step that can be skipped based on a condition
 *
 * @param {Function} conditionFn - (ctx) => boolean (true = skip)
 * @param {string} reason - Reason for skipping
 * @returns {Function} Step function
 */
export function skipIf(conditionFn, reason) {
  return (ctx) => {
    if (conditionFn(ctx)) {
      return { skip: true, reason }
    }
    return { ctx }
  }
}

/**
 * Helper: Create a step that modifies context
 *
 * @param {Function} modifyFn - (ctx) => modifications object
 * @returns {Function} Step function
 */
export function modify(modifyFn) {
  return (ctx) => {
    const modifications = modifyFn(ctx)
    return { ctx: { ...ctx, ...modifications } }
  }
}

/**
 * Helper: Create a step that performs a side effect without modifying context
 *
 * @param {Function} effectFn - (ctx) => void
 * @returns {Function} Step function
 */
export function effect(effectFn) {
  return (ctx) => {
    effectFn(ctx)
    return { ctx }
  }
}
