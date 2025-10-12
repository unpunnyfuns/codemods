/**
 * NativeBase -> Nordlys Style Prop Mappings
 *
 * Generated from models using transformation rules.
 *
 * SOURCE: nativebase-props.js (NativeBase model)
 * TARGET: nordlys-props.js (Nordlys model)
 * CONVERSIONS: maps-tokens.js, maps-color.js, maps-values.js
 *
 * Value transformation priority (Option B):
 * 1. valueMap (explicit string -> value)
 * 2. tokenHelper (named token conversion)
 * 3. pass-through (numbers, expressions)
 *
 * Used by: categorizeProps() in props.js
 */

import { generateMappings } from './generate-mappings.js'
import { FLEXBOX_PROPS, SPACING_PROPS } from './nativebase-props.js'

// Value mapping for dimension values
const dimensionValues = {
  full: '100%',
}

/**
 * Spacing Props (margin, padding, gap)
 * Source: NativeBase SPACING_PROPS
 * Token: space (with scale conversion via maps-tokens.js)
 */
export const spacing = generateMappings(SPACING_PROPS, {
  tokenHelper: 'space',
  shortcuts: {
    m: 'margin',
    mt: 'marginTop',
    mb: 'marginBottom',
    ml: 'marginLeft',
    mr: 'marginRight',
    mx: 'marginHorizontal',
    my: 'marginVertical',
    ms: 'marginStart',
    me: 'marginEnd',
    p: 'padding',
    pt: 'paddingTop',
    pb: 'paddingBottom',
    pl: 'paddingLeft',
    pr: 'paddingRight',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    ps: 'paddingStart',
    pe: 'paddingEnd',
  },
  renames: {
    marginX: 'marginHorizontal',
    marginY: 'marginVertical',
    paddingX: 'paddingHorizontal',
    paddingY: 'paddingVertical',
  },
})

/**
 * Sizing Props (width, height, min/max)
 * Source: Subset of NativeBase LAYOUT_PROPS
 * ValueMap: full -> 100%
 */
const sizingProps = [
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'size',
  'boxSize',
]
export const sizing = generateMappings(sizingProps, {
  valueMap: dimensionValues,
  shortcuts: {
    w: 'width',
    h: 'height',
    minW: 'minWidth',
    minH: 'minHeight',
    maxW: 'maxWidth',
    maxH: 'maxHeight',
  },
  expansions: {
    size: ['width', 'height'],
    boxSize: ['width', 'height'],
  },
})

/**
 * Color Props (background)
 * Source: NativeBase COLOR_PROPS
 * Token: color (with path remapping via maps-color.js)
 */
const colorProps = ['bg', 'bgColor', 'background', 'backgroundColor']
export const color = generateMappings(colorProps, {
  tokenHelper: 'color',
  shortcuts: {
    bg: 'backgroundColor',
    bgColor: 'backgroundColor',
    background: 'backgroundColor',
  },
})

/**
 * Border Props
 * Source: NativeBase BORDER_PROPS (subset - RN compatible)
 * Tokens: color for borderColor, radius for borderRadius
 */
const borderColorProps = [
  'borderColor',
  'borderTopColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderRightColor',
]
const borderRadiusProps = [
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
]
const borderWidthStyleProps = [
  'borderWidth',
  'borderStyle',
  'borderTopWidth',
  'borderTopStyle',
  'borderBottomWidth',
  'borderBottomStyle',
  'borderLeftWidth',
  'borderLeftStyle',
  'borderRightWidth',
  'borderRightStyle',
]

export const border = {
  ...generateMappings(borderWidthStyleProps, {}),
  ...generateMappings(borderColorProps, { tokenHelper: 'color' }),
  ...generateMappings(borderRadiusProps, {
    tokenHelper: 'radius',
    shortcuts: {
      rounded: 'borderRadius',
      roundedTop: 'borderTopRadius',
      roundedBottom: 'borderBottomRadius',
      roundedLeft: 'borderLeftRadius',
      roundedRight: 'borderRightRadius',
      roundedTopLeft: 'borderTopLeftRadius',
      roundedTopRight: 'borderTopRightRadius',
      roundedBottomLeft: 'borderBottomLeftRadius',
      roundedBottomRight: 'borderBottomRightRadius',
    },
    expansions: {
      borderTopRadius: ['borderTopLeftRadius', 'borderTopRightRadius'],
      borderBottomRadius: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
      borderLeftRadius: ['borderTopLeftRadius', 'borderBottomLeftRadius'],
      borderRightRadius: ['borderTopRightRadius', 'borderBottomRightRadius'],
      roundedTop: ['borderTopLeftRadius', 'borderTopRightRadius'],
      roundedBottom: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
      roundedLeft: ['borderTopLeftRadius', 'borderBottomLeftRadius'],
      roundedRight: ['borderTopRightRadius', 'borderBottomRightRadius'],
    },
  }),
}

/**
 * Layout Props (display, overflow)
 * Source: NativeBase LAYOUT_PROPS (subset - non-sizing)
 */
const layoutProps = ['display', 'overflow', 'textAlign']
export const layout = generateMappings(layoutProps, {})

/**
 * Flexbox Props
 * Source: NativeBase FLEXBOX_PROPS
 */
export const flexbox = generateMappings(FLEXBOX_PROPS, {
  shortcuts: {
    flexDir: 'flexDirection',
  },
})

/**
 * Position Props
 * Source: NativeBase POSITION_PROPS
 * Token: space for top/right/bottom/left
 */
const positionCoordinateProps = ['top', 'right', 'bottom', 'left', 'start', 'end']
const positionOtherProps = ['position', 'zIndex']
export const position = {
  ...generateMappings(positionOtherProps, {}),
  ...generateMappings(positionCoordinateProps, { tokenHelper: 'space' }),
}

/**
 * Text Props (typography)
 * Source: NativeBase TYPOGRAPHY_PROPS (TEXT_ONLY)
 * Token: color for text color
 */
const textColorProps = ['color', 'textDecorationColor']
const textOtherProps = [
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textDecorationLine',
  'textDecoration',
  'txtDecor',
  'textTransform',
]
export const text = {
  ...generateMappings(textOtherProps, {
    shortcuts: {
      textDecoration: 'textDecorationLine',
      txtDecor: 'textDecorationLine',
    },
  }),
  ...generateMappings(textColorProps, { tokenHelper: 'color' }),
}

/**
 * Extra Props (opacity, tintColor)
 * Source: Remaining props
 */
const extraProps = ['opacity', 'tintColor']
export const extra = generateMappings(extraProps, {
  renames: {
    tintColor: 'tintColor', // IMAGE_ONLY
  },
})
