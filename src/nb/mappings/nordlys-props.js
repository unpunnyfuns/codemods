/**
 * Nordlys Props Model
 *
 * Documents what Nordlys components support for style props.
 * Based on React Native View + Nordlys design token system.
 *
 * This is the TARGET for our NativeBase migrations - defines what's valid in the output.
 */

/**
 * Nordlys Design Tokens
 *
 * Token helpers imported from @hb-frontend/nordlys
 */

// Space tokens (spacing, gap, margin, padding)
export const SPACE_TOKENS = ['zero', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']

// Space token numeric values (for runtime conversion)
export const SPACE_TOKEN_VALUES = {
  zero: 0,
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
}

// Radius tokens (borderRadius)
export const RADIUS_TOKENS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']

// Radius token numeric values (for runtime conversion)
export const RADIUS_TOKEN_VALUES = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
}

// Color tokens - semantic paths in color system
// Examples: color.background.primary, color.blue[500], color.feedback.error.default
export const COLOR_SYSTEM = {
  // Nordlys uses nested color paths like:
  // - background.primary, background.secondary, background.tertiary
  // - blue[500], blue[600] (numeric scales with bracket notation)
  // - feedback.error.default, feedback.success.subtle
  // - white.HW1, core.neutral.HN1
  tokenHelper: 'color',
  supportsNestedPaths: true,
  supportsBracketNotation: true, // color.blue['500']
}

/**
 * React Native View Style Props
 *
 * Base set of style properties that React Native View supports.
 * Nordlys components built on View inherit these.
 */

// Layout & Flexbox
export const LAYOUT_PROPS = [
  'display',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'overflow',
  'aspectRatio',
  'direction',
]

export const FLEXBOX_PROPS = [
  'flex',
  'flexDirection',
  'flexWrap',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignContent',
  'alignItems',
  'alignSelf',
  'justifyContent',
  'gap',
  'rowGap',
  'columnGap',
]

// Spacing
export const SPACING_PROPS = [
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingHorizontal',
  'paddingVertical',
  'paddingStart',
  'paddingEnd',
]

// Position
export const POSITION_PROPS = [
  'position', // 'absolute' | 'relative'
  'top',
  'right',
  'bottom',
  'left',
  'start',
  'end',
  'zIndex',
]

// Border
export const BORDER_PROPS = [
  'borderWidth',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStartWidth',
  'borderEndWidth',
  'borderStyle', // 'solid' | 'dotted' | 'dashed'
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderStartColor',
  'borderEndColor',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderTopStartRadius',
  'borderTopEndRadius',
  'borderBottomStartRadius',
  'borderBottomEndRadius',
]

// Color & Visual
export const COLOR_PROPS = ['backgroundColor', 'opacity']

// Transform (limited in RN compared to web)
export const TRANSFORM_PROPS = [
  'transform', // array of transform objects
  'transformMatrix',
  'rotation',
  'scaleX',
  'scaleY',
  'translateX',
  'translateY',
]

// Shadow (iOS) & Elevation (Android)
export const SHADOW_PROPS = [
  // iOS
  'shadowColor',
  'shadowOffset',
  'shadowOpacity',
  'shadowRadius',
  // Android
  'elevation',
]

/**
 * Props That React Native View Supports
 */
export const ALL_VIEW_STYLE_PROPS = [
  ...LAYOUT_PROPS,
  ...FLEXBOX_PROPS,
  ...SPACING_PROPS,
  ...POSITION_PROPS,
  ...BORDER_PROPS,
  ...COLOR_PROPS,
  ...TRANSFORM_PROPS,
  ...SHADOW_PROPS,
]

/**
 * Props That Expect Nordlys Tokens
 */

// Props that use space tokens (space.md, space.lg, etc.)
export const PROPS_USING_SPACE_TOKENS = [
  'gap',
  'rowGap',
  'columnGap',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingHorizontal',
  'paddingVertical',
  'paddingStart',
  'paddingEnd',
  'top',
  'right',
  'bottom',
  'left',
  'start',
  'end',
]

// Props that use radius tokens (radius.md, radius.lg, etc.)
export const PROPS_USING_RADIUS_TOKENS = [
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderTopStartRadius',
  'borderTopEndRadius',
  'borderBottomStartRadius',
  'borderBottomEndRadius',
]

// Props that use color tokens (color.background.primary, color.blue[500], etc.)
export const PROPS_USING_COLOR_TOKENS = [
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderStartColor',
  'borderEndColor',
  'shadowColor',
]

/**
 * Constraints & Limitations
 */

// Props that expect numeric values (not tokens)
export const NUMERIC_ONLY_PROPS = [
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'borderWidth',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStartWidth',
  'borderEndWidth',
  'zIndex',
  'opacity',
  'shadowOpacity',
  'shadowRadius',
  'elevation',
]

// Props that expect dimensions (numbers, percentages, or specific string values)
// These should NOT accept semantic space tokens like "sm", "md", "lg"
export const DIMENSION_PROPS = [
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'top',
  'right',
  'bottom',
  'left',
  'start',
  'end',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingHorizontal',
  'paddingVertical',
  'paddingStart',
  'paddingEnd',
]

// Valid dimension values
export const DIMENSION_VALUES = {
  // Percentages
  percentage: /^\d+(\.\d+)?%$/,
  // Numbers (allow space tokens via token helper, but not as string literals)
  numeric: true,
  // Special keywords
  keywords: ['auto'],
}

/**
 * Props Not Supported on React Native View (but exist in web CSS)
 */
export const UNSUPPORTED_ON_VIEW = [
  'textAlign', // Only works on Text components, not View
  'textAlignVertical', // Android Text only
  'textDecorationLine', // Text only
  'textDecorationStyle', // Text only
  'textDecorationColor', // Text only
  'textShadowColor', // Text only
  'textShadowOffset', // Text only
  'textShadowRadius', // Text only
  'textTransform', // Text only
  'fontFamily', // Text only
  'fontSize', // Text only
  'fontStyle', // Text only
  'fontWeight', // Text only
  'fontVariant', // Text only
  'letterSpacing', // Text only
  'lineHeight', // Text only
  'includeFontPadding', // Android Text only
  'color', // Text only (for text color)
  'tintColor', // Image only
]

/**
 * React Native Text Style Props
 *
 * Props that work on Text components (Nordlys Typography)
 */
export const TEXT_STYLE_PROPS = [
  'color',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'fontVariant',
  'textShadowOffset',
  'textShadowRadius',
  'textShadowColor',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textAlignVertical',
  'textDecorationLine',
  'textDecorationStyle',
  'textDecorationColor',
  'textTransform',
  'writingDirection',
  // Android-specific
  'includeFontPadding',
  'textBreakStrategy',
]

/**
 * Nordlys Component Constraints
 *
 * Some Nordlys components are more restrictive than base React Native
 */

// Nordlys Button - doesn't accept style props at all
// Must be wrapped in View if style props needed
export const BUTTON_NO_STYLE_PROPS = true

// Nordlys Switch - doesn't accept style props at all
// Must be wrapped in View if style props needed
export const SWITCH_NO_STYLE_PROPS = true

// Nordlys Avatar - doesn't accept style props at all
// Must be wrapped in View if style props needed
export const AVATAR_NO_STYLE_PROPS = true

// Nordlys Typography - accepts limited style props
// Should wrap in View for layout props (margin, padding, width, etc.)
export const TYPOGRAPHY_RESTRICTED_PROPS = {
  // Typography manages these internally - don't allow override
  managed: ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight'],
  // Only these style props allowed on Typography
  allowed: ['color', 'textAlign', 'textTransform', 'textDecorationLine'],
  // Layout props should go on wrapper View
  wrapForLayout: true,
}
