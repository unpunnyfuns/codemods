// Nordlys Props Model - TARGET
// What Nordlys components support

// Design tokens (space, radius, color)

// Space tokens
export const SPACE_TOKENS = ['zero', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']

// Space token values
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

// Radius tokens
export const RADIUS_TOKENS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']

// Radius token values
export const RADIUS_TOKEN_VALUES = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
}

// Color tokens - semantic paths
export const COLOR_SYSTEM = {
  tokenHelper: 'color',
  supportsNestedPaths: true,
  supportsBracketNotation: true,
}

// React Native View style props

// Layout
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
  'position',
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
  'borderStyle',
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

// Color
export const COLOR_PROPS = ['backgroundColor', 'opacity']

// Transform
export const TRANSFORM_PROPS = [
  'transform',
  'transformMatrix',
  'rotation',
  'scaleX',
  'scaleY',
  'translateX',
  'translateY',
]

// Shadow and elevation
export const SHADOW_PROPS = [
  'shadowColor',
  'shadowOffset',
  'shadowOpacity',
  'shadowRadius',
  'elevation',
]

// All React Native View style props
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

// Props using space tokens
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

// Props using radius tokens
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

// Props using color tokens
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

// Props expecting numeric values only
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

// Props expecting dimension values
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
  percentage: /^\d+(\.\d+)?%$/,
  numeric: true,
  keywords: ['auto'],
}

// React Native Text style props
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
  'includeFontPadding',
  'textBreakStrategy',
]

// Component constraints

// Button: no style props
export const BUTTON_NO_STYLE_PROPS = true

// Switch: no style props
export const SWITCH_NO_STYLE_PROPS = true

// Avatar: no style props
export const AVATAR_NO_STYLE_PROPS = true

// Typography: limited style props
export const TYPOGRAPHY_RESTRICTED_PROPS = {
  managed: ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight'],
  allowed: ['color', 'textAlign', 'textTransform', 'textDecorationLine'],
  wrapForLayout: true,
}
