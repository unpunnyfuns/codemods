/**
 * NativeBase → Target Color Transformations
 *
 * Part of the transformation layer: Source (NativeBase) → Target mappings.
 *
 * Initially thought we could auto-generate this from color tokens, but NativeBase
 * uses numeric scales (gray.100-900) while target uses semantic names (HN1-9).
 * Built this map by running migration on real files and collecting mismatches.
 *
 * This is semantic mapping, not value-based - preserves design intent.
 */

// Paths that match directly between NB and target - rare but they exist
export const DIRECT_COLOR_PATHS = [
  'background.primary',
  'background.primary-alternate',
  'background.secondary',
  'background.tertiary',
  'background.screen',
]

// Explicit remappings - most colors need this
export const COLOR_PATH_REMAPPING = {
  // NativeBase numeric scales to target named tokens
  'white.900': 'white.HW1',
  'white.0': 'white.HW1',
  'black.900': 'core.neutral.HN1',

  // Gray scale - semantic mapping by lightness (NB cool tint vs target warm tint)
  gray: 'core.neutral.HN5',
  'gray.0': 'core.neutral.HN10', // Lightest
  'gray.100': 'core.neutral.HN9',
  'gray.200': 'core.neutral.HN8',
  'gray.300': 'core.neutral.HN7',
  'gray.400': 'core.neutral.HN6',
  'gray.500': 'core.neutral.HN5',
  'gray.600': 'core.neutral.HN4',
  'gray.700': 'core.neutral.HN3',
  'gray.800': 'core.neutral.HN2',
  'gray.900': 'core.neutral.HN1', // Darkest

  // Blue scale - semantic mapping by lightness
  'blue.0': 'core.blue.HB10', // Lightest (exact match)
  'blue.100': 'core.blue.HB9',
  'blue.500': 'core.blue.HB5',

  // Pink scale - map to closest warm neutrals (target has no pink)
  'pink.200': 'core.neutral.HN9',
  'pink.400': 'core.neutral.HN8',

  account: 'brand.primary',
  'account.solid.default': 'brand.primary',

  // Text colors - only remap paths that don't exist in target
  // text.primary/secondary/tertiary/quaternary exist in target (pass through unchanged)
  'text.brand': 'brand.primary', // NB has text.brand, target uses brand.primary

  // Background semantic colors
  'background.info': 'feedback.info.subtle',
  'background.error': 'feedback.error.subtle',

  // Input colors
  'input.backgroundDefault': 'background.secondary',
  'input.backgroundFocus': 'background.secondary',
  'input.backgroundDisabled': 'background.tertiary',

  // Avatar colors
  'avatar.default': 'background.primary',
  'avatar.info': 'feedback.info.subtle',
  'avatar.success': 'feedback.success.subtle',
}

/**
 * Special color values that should not use the color token helper
 */
export const LITERAL_COLORS = ['transparent']

/**
 * Get the target color path for a NativeBase color path
 * Returns the mapped color path, or null for special literal colors
 */
export function getTargetColorPath(nbColorPath) {
  // Check if it needs remapping
  if (COLOR_PATH_REMAPPING[nbColorPath]) {
    return COLOR_PATH_REMAPPING[nbColorPath]
  }

  // Otherwise return as-is (will be handled by token helper)
  return nbColorPath
}

/**
 * Check if a color value should be a literal string instead of using color token helper
 */
export function isLiteralColor(colorValue) {
  return LITERAL_COLORS.includes(colorValue)
}
