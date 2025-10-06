/**
 * Target Model
 *
 * Target-specific API constraints and design tokens.
 * This is the TARGET layer - what target components accept/restrict.
 */

// Space Tokens
export const SPACE_TOKENS = ['zero', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'auto']

export const SPACE_TOKEN_VALUES = {
  zero: 0,
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 32,
  '2xl': 64,
  '3xl': 128,
}

// Radius Tokens
export const RADIUS_TOKENS = ['sm', 'md', 'lg', 'xl', '2xl']

export const RADIUS_TOKEN_VALUES = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 24,
  '2xl': 32,
}

// Color System
export const COLOR_SYSTEM = {
  tokenHelper: 'color',
  supportsNestedPaths: true,
  supportsBracketNotation: true,
}

// Component-Specific Constraints

/**
 * Button: Does not accept style props
 * Styling is controlled via variant/size props only
 */
export const BUTTON_NO_STYLE_PROPS = true

/**
 * Switch: Does not accept style props
 * Styling is controlled internally
 */
export const SWITCH_NO_STYLE_PROPS = true

/**
 * Avatar: Does not accept style props
 * Styling is controlled via size prop only
 */
export const AVATAR_NO_STYLE_PROPS = true

/**
 * Typography: Restricts certain style props
 * Font properties are managed internally by target Typography
 */
export const TYPOGRAPHY_RESTRICTED_PROPS = {
  managed: ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform'],
  allowed: [
    'color',
    'textAlign',
    'textDecorationLine',
    'textDecorationStyle',
    'textDecorationColor',
  ],
}

/**
 * Helper Functions
 */

/**
 * Check if a token is a valid space token
 */
export function isValidSpaceToken(token) {
  return SPACE_TOKENS.includes(token)
}

/**
 * Check if a token is a valid radius token
 */
export function isValidRadiusToken(token) {
  return RADIUS_TOKENS.includes(token)
}

/**
 * Check if a prop is restricted for Typography component
 * Returns true if the prop is managed internally (should be dropped)
 */
export function isRestrictedTypographyProp(propName) {
  return TYPOGRAPHY_RESTRICTED_PROPS.managed.includes(propName)
}

/**
 * Get the numeric value for a design token
 * @param {'space' | 'radius'} type - The token type
 * @param {string} token - The token name (e.g., 'sm', 'md', 'lg')
 * @returns {number | null} - The numeric value or null if not found
 */
export function getTokenValue(type, token) {
  if (type === 'space') {
    return SPACE_TOKEN_VALUES[token] ?? null
  }
  if (type === 'radius') {
    return RADIUS_TOKEN_VALUES[token] ?? null
  }
  return null
}
