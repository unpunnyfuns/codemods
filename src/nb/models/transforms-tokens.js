/**
 * NativeBase → Nordlys Token Transformations
 *
 * Part of the transformation layer: Source (NativeBase) → Target (Nordlys) mappings.
 *
 * Token scale conversions:
 * - Maps by semantic name (xl→xl, 2xl→2xl, 3xl→3xl)
 * - Pixel values are IDENTICAL between both systems
 * - NB:      2xs(2), xs(4), sm(8), md(12), lg(16), xl(32), 2xl(64), 3xl(128)
 * - Nordlys: 2xs(2), xs(4), sm(8), md(12), lg(16), xl(32), 2xl(64), 3xl(128)
 *
 * Semantic mapping preserves design intent across both systems.
 */

export const SPACE_TOKEN_MAP = {
  '2xs': '2xs',
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl', // Semantic mapping: xl→xl (32px in both)
  '2xl': '2xl', // Semantic mapping: 2xl→2xl (64px in both)
  '3xl': '3xl', // Semantic mapping: 3xl→3xl (128px in both)
}

// Radius tokens - mostly aligned but NB has "full" for pill shapes
export const RADIUS_TOKEN_MAP = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  full: '2xl', // NB full=9999px for pills, Nordlys 2xl=32px is closest
}

export function convertSpaceToken(nbToken) {
  const converted = SPACE_TOKEN_MAP[nbToken]
  if (converted) {
    return converted
  }

  if (typeof nbToken === 'string') {
    console.warn(`⚠️  Unknown NativeBase space token: "${nbToken}" - passing through unchanged`)
  }

  return nbToken
}

export function convertRadiusToken(nbToken) {
  const converted = RADIUS_TOKEN_MAP[nbToken]
  if (converted) {
    return converted
  }

  console.warn(`⚠️  Unknown NativeBase radius token: "${nbToken}" - passing through unchanged`)
  return nbToken
}
