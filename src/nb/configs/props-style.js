// NativeBase to target style prop mappings
// Generated from source-nativebase.js and target.js models

import { FLEXBOX_PROPS, SPACING_PROPS } from '../models/source-nativebase.js'
import { generateMappings } from './generate-mappings.js'

// Value mapping for dimension values
const dimensionValues = {
  full: '100%',
}

// Value mapping for border radius values
const radiusValues = {
  full: 9999,
}

// Spacing props
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

// Sizing props
const sizingProps = [
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

// Color props
const colorProps = ['bg', 'bgColor', 'background', 'backgroundColor']
export const color = generateMappings(colorProps, {
  tokenHelper: 'color',
  shortcuts: {
    bg: 'backgroundColor',
    bgColor: 'backgroundColor',
    background: 'backgroundColor',
  },
})

// Border props
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
    valueMap: radiusValues,
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

// Layout props
const layoutProps = ['display', 'overflow', 'textAlign']
export const layout = generateMappings(layoutProps, {})

// Flexbox props
export const flexbox = generateMappings(FLEXBOX_PROPS, {
  shortcuts: {
    flexDir: 'flexDirection',
  },
})

// Position props
const positionCoordinateProps = ['top', 'right', 'bottom', 'left', 'start', 'end']
const positionOtherProps = ['position', 'zIndex']
export const position = {
  ...generateMappings(positionOtherProps, {}),
  ...generateMappings(positionCoordinateProps, {}),
}

// Text props
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

// Extra props
const extraProps = ['opacity', 'tintColor']
export const extra = generateMappings(extraProps, {
  renames: {
    tintColor: 'tintColor',
  },
})
