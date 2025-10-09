/**
 * NativeBase theme system props
 *
 * These props are specific to NativeBase's theming system and don't directly
 * map to Nordlys's component API.
 *
 * NOTE: 'size' is context-dependent:
 * - For Button/Input: theme variant to drop
 * - For Stack/Box: layout prop (width/height) to transform
 *
 * Each component should decide whether to include these in drop list.
 */

/**
 * Theme variant props found across multiple components
 */
export const themeProps = [
  // NativeBase color theme key (e.g., 'primary', 'secondary', 'blue')
  'colorScheme',
  // Component variant (e.g., 'solid', 'outline', 'ghost', 'link')
  'variant',
  // Component size token (e.g., 'xs', 'sm', 'md', 'lg', 'xl') - CONTEXT DEPENDENT
  'size',
]
