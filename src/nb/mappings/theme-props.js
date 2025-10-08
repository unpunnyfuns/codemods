/**
 * NativeBase theme system props to DROP during migration
 *
 * These props are specific to NativeBase's theming system and don't directly
 * map to Nordlys's component API. Users need to manually migrate these to
 * Nordlys's equivalent props/patterns.
 */

/**
 * Theme props found across multiple components
 * These control the visual variant/style of components
 */
export const themeProps = [
  'colorScheme', // NativeBase color theme key (e.g., 'primary', 'secondary', 'blue')
  'variant', // Component variant (e.g., 'solid', 'outline', 'ghost', 'link')
  'size', // Component size token (e.g., 'xs', 'sm', 'md', 'lg', 'xl')
]

/**
 * ALL theme props to drop
 */
export const allThemeProps = themeProps
