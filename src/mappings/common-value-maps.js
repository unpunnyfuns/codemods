/**
 * Common value mappings for NativeBase → Aurora token transformations
 *
 * PRIORITY: String literal transformations (align, justify) - Numeric values passed through
 *
 * Based on token comparison and codebase analysis:
 * - Semantic spacing tokens (2xs, xs, sm, md, lg, xl, 2xl, 3xl) are IDENTICAL - no transformation
 * - Numeric values (m={4}, space={2}) are kept as-is - no transformation
 * - Only string literals need value mapping (e.g., align="start" → alignItems="flex-start")
 */

// Value mappings for alignment props (used in TRANSFORM_PROPS)
export const ALIGN_VALUES = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  stretch: 'stretch',
  baseline: 'baseline',
}

export const JUSTIFY_VALUES = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
}

// NativeBase size tokens (if used)
// Uncomment and customize when needed
// export const SIZE_TOKENS = {
//   xs: 24,
//   sm: 32,
//   md: 40,
//   lg: 48,
//   xl: 56,
//   '2xl': 64,
// }

// =============================================================================
// COLOR MAPPINGS - TODO for later
// =============================================================================
// Color mapping is more complex and should use Aurora's 3-tier token system:
// 1. Reference tokens: core.blue.HB4 = '#005FA5'
// 2. System tokens: interactive.primary = core.blue.HB4
// 3. Component tokens: button.background.primary.default = interactive.primary
//
// Recommended approach:
// - Map NativeBase semantic colors to Aurora system tokens
// - Example: themeColors.button.solid.primary.default → color.interactive.primary
// - Use getColorFromPath() helper at runtime if needed
//
// export const COLOR_TOKENS = {
//   // TODO: Define mappings when ready to tackle colors
// }
