// NativeBase Props Model - SOURCE
// What NativeBase styled-system accepts

// Token scales

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

// Numeric space scale
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

// Spacing
export const SPACING_PROPS = [
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
  'gap',
]

// Layout
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
  'size',
  'boxSize',
  'overflow',
  'overflowX',
  'overflowY',
  'display',
  'textAlign',
]

// Flexbox
export const FLEXBOX_PROPS = [
  'alignItems',
  'alignContent',
  'justifyItems',
  'justifyContent',
  'flexWrap',
  'flexDirection',
  'flexDir',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'justifySelf',
  'alignSelf',
  'order',
]

// Position
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

// Color
export const COLOR_PROPS = [
  'color',
  'tintColor',
  'backgroundColor',
  'bg',
  'bgColor',
  'background',
  'opacity',
  'textDecorationColor',
]

// Border
export const BORDER_PROPS = [
  'borderWidth',
  'borderStyle',
  'borderColor',
  'borderRadius',
  'rounded',
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
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderTop',
  'borderRight',
  'borderBottom',
  'borderLeft',
  'borderX',
  'borderY',
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

// Background props
export const BACKGROUND_PROPS = [
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundAttachment',
  'backgroundBlendMode',
  'bgImage',
  'bgImg',
  'bgBlendMode',
  'bgSize',
  'bgPosition',
  'bgPos',
  'bgRepeat',
  'bgAttachment',
]

// Typography: font and text styling props
export const TYPOGRAPHY_PROPS = [
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
  'wordBreak',
  'overflowWrap',
  'textOverflow',
  'whiteSpace',
]

// Extra
export const EXTRA_PROPS = [
  'outline',
  'outlineWidth',
  'outlineColor',
  'outlineStyle',
  'shadow',
  'cursor',
  'overflow',
  'userSelect',
]

// All styled props combined
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

// React Native compatible props
export const RN_COMPATIBLE = [
  ...SPACING_PROPS,
  ...FLEXBOX_PROPS,
  ...POSITION_PROPS,
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
  'backgroundColor',
  'bg',
  'bgColor',
  'background',
  'opacity',
  ...BORDER_PROPS.filter(
    (p) =>
      !['borderTop', 'borderRight', 'borderBottom', 'borderLeft', 'borderX', 'borderY'].includes(p),
  ),
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

// Web-only props
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
