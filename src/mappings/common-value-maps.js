/**
 * Common value mappings for NativeBase → Aurora token transformations
 *
 * These are examples - customize based on your actual token scales.
 * Import and use these in component-specific prop mappings.
 */

// Example: NativeBase spacing scale → Aurora spacing scale
export const SPACING_SCALE = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
}

// Example: NativeBase border radius tokens → Aurora values
export const BORDER_RADIUS = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
}

// Example: NativeBase size tokens → Aurora size values
export const SIZE_TOKENS = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
  '2xl': 64,
}

// Example: Color token transformations
// For more complex color mappings, you may need nested objects
export const COLOR_TOKENS = {
  'primary.500': '#0066CC',
  'gray.100': '#F7FAFC',
  'gray.200': '#EDF2F7',
  // Add more as needed
}
