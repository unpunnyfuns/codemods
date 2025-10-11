/**
 * NativeBase Props Model
 *
 * Documents what props NativeBase styled-system accepts.
 * Extracted from: NativeBase/src/theme/styled-system.ts
 *
 * This is the SOURCE for our migrations - defines what NativeBase components accept.
 */

/**
 * Token Scales
 *
 * NativeBase token definitions from feref custom theme.
 * Source: feref/packages/common/src/config/theme/index.ts
 */

export const NB_SPACE_TOKENS = {
  '2xs': '2px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '32px',
  '2xl': '64px',
  '3xl': '128px',
  14: '56px',
  18: '72px',
}

// NativeBase default numeric space scale (0-10 → pixels)
// Used by Icon component for token→pixel conversion
export const NB_SPACE_SCALE_NUMERIC = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
}

export const NB_RADII_TOKENS = {
  sm: 4,
  md: 8,
  lg: 12,
}

export const NB_COLOR_STRUCTURE = {
  base: [
    'blue',
    'pink',
    'darkPink',
    'gray',
    'white',
    'black',
    'lightBlue',
    'green',
    'yellow',
    'red',
  ],
  semantic: [
    'background',
    'bottomTabBar',
    'avatar',
    'badge',
    'button',
    'buttonTab',
    'chips',
    'checkbox',
    'radioButton',
    'switch',
    'divider',
    'icon',
    'input',
    'text',
    'skeleton',
    'uploadZone',
    'account',
    'cell',
    'stackedBarGraph',
    'accountAccent',
    'card',
    'sheet',
    'stepper',
    'bubble',
    'alert',
  ],
}

/**
 * Spacing Props
 *
 * All margin, padding, and gap props with their shortcuts.
 * Scale: space (theme.space)
 */
export const SPACING_PROPS = [
  // Margin
  'margin',
  'm',
  'marginTop',
  'mt',
  'marginRight',
  'mr',
  'marginBottom',
  'mb',
  'marginLeft',
  'ml',
  'marginX',
  'mx',
  'marginY',
  'my',
  'marginStart',
  'ms',
  'marginEnd',
  'me',
  // Padding
  'padding',
  'p',
  'paddingTop',
  'pt',
  'paddingRight',
  'pr',
  'paddingBottom',
  'pb',
  'paddingLeft',
  'pl',
  'paddingX',
  'px',
  'paddingY',
  'py',
  'paddingStart',
  'ps',
  'paddingEnd',
  'pe',
  // Gap
  'gap',
]

/**
 * Layout Props
 *
 * Width, height, overflow, display, etc.
 * Scale: sizes (theme.sizes) for width/height
 */
export const LAYOUT_PROPS = [
  'width',
  'w',
  'height',
  'h',
  'minWidth',
  'minW',
  'minHeight',
  'minH',
  'maxWidth',
  'maxW',
  'maxHeight',
  'maxH',
  'size', // Sets both width and height
  'boxSize', // Alias for size
  'overflow',
  'overflowX',
  'overflowY',
  'display',
  'textAlign',
]

/**
 * Flexbox Props
 *
 * All flexbox layout props.
 * No scale, direct values.
 */
export const FLEXBOX_PROPS = [
  'alignItems',
  'alignContent',
  'justifyItems',
  'justifyContent',
  'flexWrap',
  'flexDirection',
  'flexDir', // Shortcut for flexDirection
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'justifySelf',
  'alignSelf',
  'order',
]

/**
 * Position Props
 *
 * Positioning props.
 * Scale: space (theme.space) for top/right/bottom/left
 */
export const POSITION_PROPS = [
  'position',
  'zIndex',
  'top',
  'right',
  'bottom',
  'left',
  'start',
  'end',
]

/**
 * Color Props
 *
 * Color, background, opacity, tint.
 * Scale: colors (theme.colors)
 */
export const COLOR_PROPS = [
  'color',
  'tintColor',
  'backgroundColor',
  'bg', // Shortcut for backgroundColor
  'bgColor', // Alias for bg
  'background', // Alias for bg
  'opacity',
  'textDecorationColor',
]

/**
 * Border Props
 *
 * All border-related props including radius.
 * Scale: radii (theme.radii) for borderRadius, colors for borderColor
 */
export const BORDER_PROPS = [
  // Basic border
  'borderWidth',
  'borderStyle',
  'borderColor',
  'borderRadius',
  // Radius shortcuts
  'rounded', // Alias for borderRadius
  'borderTopRadius',
  'borderBottomRadius',
  'borderLeftRadius',
  'borderRightRadius',
  'roundedTop',
  'roundedBottom',
  'roundedLeft',
  'roundedRight',
  'roundedTopLeft',
  'roundedTopRight',
  'roundedBottomLeft',
  'roundedBottomRight',
  // Corner-specific
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  // Side-specific shorthand (web-only)
  'borderTop',
  'borderRight',
  'borderBottom',
  'borderLeft',
  'borderX',
  'borderY',
  // Side-specific full props
  'borderTopWidth',
  'borderTopColor',
  'borderTopStyle',
  'borderBottomWidth',
  'borderBottomColor',
  'borderBottomStyle',
  'borderLeftWidth',
  'borderLeftColor',
  'borderLeftStyle',
  'borderRightWidth',
  'borderRightColor',
  'borderRightStyle',
]

/**
 * Background Props (Web-only)
 *
 * CSS background properties (not supported in React Native).
 */
export const BACKGROUND_PROPS = [
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundAttachment',
  'backgroundBlendMode',
  'bgImage', // backgroundImage shortcut
  'bgImg', // backgroundImage alias
  'bgBlendMode',
  'bgSize',
  'bgPosition',
  'bgPos',
  'bgRepeat',
  'bgAttachment',
]

/**
 * Typography Props (Text-only)
 *
 * Font and text styling props.
 * Scale: fonts, fontSizes, fontWeights, lineHeights, letterSpacings
 */
export const TYPOGRAPHY_PROPS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'fontStyle',
  'textTransform',
  'textDecoration', // Maps to textDecorationLine
  'txtDecor', // Shortcut for textDecoration
  'textDecorationLine',
  // Web-only
  'wordBreak',
  'overflowWrap',
  'textOverflow',
  'whiteSpace',
]

/**
 * Extra Props (Mostly web-only)
 *
 * Shadow, outline, cursor, etc.
 */
export const EXTRA_PROPS = [
  'outline',
  'outlineWidth',
  'outlineColor',
  'outlineStyle',
  'shadow', // NativeBase shadow shorthand
  'cursor',
  'overflow',
  'userSelect',
]

/**
 * All Styled Props
 */
export const ALL_STYLED_PROPS = [
  ...SPACING_PROPS,
  ...LAYOUT_PROPS,
  ...FLEXBOX_PROPS,
  ...POSITION_PROPS,
  ...COLOR_PROPS,
  ...BORDER_PROPS,
  ...BACKGROUND_PROPS,
  ...TYPOGRAPHY_PROPS,
  ...EXTRA_PROPS,
]

/**
 * React Native Compatibility
 */

// Props that work in React Native
export const RN_COMPATIBLE = [
  ...SPACING_PROPS,
  ...FLEXBOX_PROPS,
  ...POSITION_PROPS,
  // Layout (subset)
  'width',
  'w',
  'height',
  'h',
  'minWidth',
  'minW',
  'minHeight',
  'minH',
  'maxWidth',
  'maxW',
  'maxHeight',
  'maxH',
  'size',
  'boxSize',
  'overflow',
  'display',
  // Color (subset)
  'backgroundColor',
  'bg',
  'bgColor',
  'background',
  'opacity',
  // Border
  ...BORDER_PROPS.filter(
    (p) =>
      !['borderTop', 'borderRight', 'borderBottom', 'borderLeft', 'borderX', 'borderY'].includes(p),
  ),
  // Typography (RN Text only)
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'fontStyle',
  'textTransform',
  'textDecorationLine',
]

// Props that only work on Text components
export const TEXT_ONLY = [
  'color',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'fontStyle',
  'textTransform',
  'textDecoration',
  'txtDecor',
  'textDecorationLine',
  'textDecorationColor',
]

// Props that only work on Image components
export const IMAGE_ONLY = ['tintColor']

// Props that are web-only (CSS, not RN)
export const WEB_ONLY = [
  ...BACKGROUND_PROPS,
  'borderTop',
  'borderRight',
  'borderBottom',
  'borderLeft',
  'borderX',
  'borderY',
  'overflowX',
  'overflowY',
  'wordBreak',
  'overflowWrap',
  'textOverflow',
  'whiteSpace',
  'outline',
  'outlineWidth',
  'outlineColor',
  'outlineStyle',
  'cursor',
  'userSelect',
]
