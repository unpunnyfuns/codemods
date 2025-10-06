// Token scale conversions between NativeBase and Nordlys
//
// The scales don't align 1:1. NB goes 2xs to 3xl (8 steps), Nordlys adds zero and
// has different xl/2xl/3xl values. Had to map by pixel values not names.
//
// NB: 2xs(2), xs(4), sm(8), md(12), lg(16), xl(32), 2xl(64), 3xl(128)
// Nordlys: zero(0), 2xs(2), xs(4), sm(8), md(12), lg(16), xl(24), 2xl(32), 3xl(48)
//
// Problems found during migration:
// - NB xl(32) has no match, using Nordlys 2xl(32)
// - NB 2xl(64) doesn't exist in Nordlys, clamping to 3xl(48)
// - NB uses numeric tokens "14" and "18" for icon sizes (56px, 72px)

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

// Radius tokens - mostly aligned but NB has "full" for pill shapes
export const RADIUS_TOKEN_MAP = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  full: '2xl', // NB full=9999px for pills, Nordlys 2xl=20px is closest
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
