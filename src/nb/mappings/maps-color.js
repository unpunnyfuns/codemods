/**
 * NativeBase → Nordlys Color Mappings
 *
 * Maps NativeBase semantic color paths to Nordlys color tokens.
 * Handles cases where:
 * 1. Path matches directly (background.secondary → color.background.secondary)
 * 2. Path needs remapping (white.900 → color.white.HW1)
 * 3. Path structure differs (avatar.success → needs mapping)
 */

/**
 * Direct mappings where NativeBase and Nordlys have same semantic path
 * These will be handled automatically by the token helper
 */
export const DIRECT_COLOR_PATHS = [
  'background.primary',
  'background.secondary',
  'background.tertiary',
  'background.screen',
  // More can be added as discovered
]

/**
 * NativeBase → Nordlys color path remappings
 * For cases where the semantic meaning matches but path differs
 */
export const COLOR_PATH_REMAPPING = {
  // NativeBase uses numeric scales, Nordlys uses named tokens
  'white.900': 'white.HW1',
  'white.0': 'white.HW1', // transparent in NB, white in Nordlys
  'black.900': 'core.neutral.HN1', // Closest dark

  // Input colors - NativeBase has these, need to check Nordlys equivalent
  'input.backgroundDefault': 'background.secondary', // Gray[0] → White
  'input.backgroundFocus': 'background.secondary',
  'input.backgroundDisabled': 'background.tertiary',

  // Avatar colors
  'avatar.default': 'background.primary', // Pink[200] → beige
  'avatar.info': 'feedback.info.subtle',
  'avatar.success': 'feedback.success.subtle',
}

/**
 * Get the Nordlys color path for a NativeBase color path
 * Returns null if no mapping exists (pass through to token helper)
 */
export function getNordlysColorPath(nbColorPath) {
  // Check if it needs remapping
  if (COLOR_PATH_REMAPPING[nbColorPath]) {
    return COLOR_PATH_REMAPPING[nbColorPath]
  }

  // Otherwise return as-is (will be handled by token helper)
  return nbColorPath
}
