/**
 * Prop mappings for Avatar component migration
 *
 * NativeBase/Common Avatar → Nordlys Avatar
 * Note: Custom transformation logic handles iconName/imageUri/imageSource → object expressions
 */

// STYLE_PROPS: None - Avatar doesn't accept style props in Nordlys
export const STYLE_PROPS = {}

// TRANSFORM_PROPS: None - transformations are handled via custom logic
export const TRANSFORM_PROPS = {}

// DIRECT_PROPS: Passed through unchanged
export const DIRECT_PROPS = [
  'size',
  'testID',
  'accessibilityLabel',
]

// DROP_PROPS: Removed entirely
export const DROP_PROPS = [
  // Avatar-specific props transformed via custom logic
  'iconName', // → icon={{ name, fill }}
  'imageUri', // → image={{ source: { uri } }}
  'imageSource', // → image={{ source }}
  'letters', // Not supported in Nordlys

  // Color/style props not supported
  'lettersColor',
  'bgColor',
  'bg',
  'isSecondaryColor',

  // Image props not supported
  'placeholder',
  'resizeMode',
  'source',

  // Size props not supported
  'w',
  'h',
  'width',
  'height',

  // Pseudo props
  '_hover',
  '_pressed',
  '_focus',
]
