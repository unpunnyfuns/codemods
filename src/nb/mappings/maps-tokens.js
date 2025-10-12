/**
 * Token Conversion Mappings
 *
 * Converts NativeBase token names to Nordlys token names.
 * Handles scale differences between the two design systems.
 *
 * Source: nativebase-props.js (NB_SPACE_TOKENS, NB_RADII_TOKENS)
 * Target: nordlys-props.js (SPACE_TOKEN_VALUES, RADIUS_TOKEN_VALUES)
 */

/**
 * Space Token Conversions
 *
 * Maps NativeBase space token names to Nordlys space token names.
 * Handles differences in scale and naming.
 *
 * NB scale: 2xs(2px), xs(4px), sm(8px), md(12px), lg(16px), xl(32px), 2xl(64px), 3xl(128px)
 * Nordlys scale: zero(0), 2xs(2), xs(4), sm(8), md(12), lg(16), xl(24), 2xl(32), 3xl(48)
 *
 * Key differences:
 * - NB xl(32px) -> Nordlys 2xl(32)
 * - NB 2xl(64px) -> Nordlys 3xl(48) - closest match, warn about truncation
 * - NB 3xl(128px) -> Nordlys 3xl(48) - no equivalent, warn
 * - NB numeric tokens (14, 18) -> closest Nordlys match
 */
export const SPACE_TOKEN_MAP = {
  '2xs': '2xs',
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: '2xl',
  '2xl': '3xl',
  '3xl': '3xl',
  14: 'xl',
  18: '2xl',
}

/**
 * Radius Token Conversions
 *
 * Maps NativeBase radii token names to Nordlys radius token names.
 *
 * NB scale: sm(4), md(8), lg(12)
 * Nordlys scale: xs(2), sm(4), md(8), lg(12), xl(16), 2xl(20)
 *
 * These map 1:1 for existing tokens.
 */
export const RADIUS_TOKEN_MAP = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
}

/**
 * Convert NativeBase space token to Nordlys space token
 *
 * @param {string|number} nbToken - NativeBase token name
 * @returns {string} Nordlys token name
 */
export function convertSpaceToken(nbToken) {
  const converted = SPACE_TOKEN_MAP[nbToken]
  if (converted) {
    return converted
  }

  // Warn about unmapped tokens
  if (typeof nbToken === 'string') {
    console.warn(`⚠️  Unknown NativeBase space token: "${nbToken}" - passing through unchanged`)
  }

  return nbToken
}

/**
 * Convert NativeBase radius token to Nordlys radius token
 *
 * @param {string} nbToken - NativeBase token name
 * @returns {string} Nordlys token name
 */
export function convertRadiusToken(nbToken) {
  const converted = RADIUS_TOKEN_MAP[nbToken]
  if (converted) {
    return converted
  }

  // Warn about unmapped tokens
  console.warn(`⚠️  Unknown NativeBase radius token: "${nbToken}" - passing through unchanged`)

  return nbToken
}
