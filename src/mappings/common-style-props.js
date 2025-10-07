/**
 * Common NativeBase style prop mappings
 * These are reusable across most NativeBase components
 */

export const SPACING = {
  // Margin - full names
  margin: 'margin',
  marginTop: 'marginTop',
  marginBottom: 'marginBottom',
  marginLeft: 'marginLeft',
  marginRight: 'marginRight',

  // Margin - shortcuts
  m: 'margin',
  mt: 'marginTop',
  mb: 'marginBottom',
  ml: 'marginLeft',
  mr: 'marginRight',
  mx: 'marginHorizontal',
  my: 'marginVertical',

  // Margin - NativeBase specific (expand to multiple)
  marginX: { properties: ['marginLeft', 'marginRight'] },
  marginY: { properties: ['marginTop', 'marginBottom'] },

  // Padding - full names
  padding: 'padding',
  paddingTop: 'paddingTop',
  paddingBottom: 'paddingBottom',
  paddingLeft: 'paddingLeft',
  paddingRight: 'paddingRight',

  // Padding - shortcuts
  p: 'padding',
  pt: 'paddingTop',
  pb: 'paddingBottom',
  pl: 'paddingLeft',
  pr: 'paddingRight',
  px: 'paddingHorizontal',
  py: 'paddingVertical',
}

export const SIZING = {
  // Full names
  width: 'width',
  height: 'height',
  minWidth: 'minWidth',
  minHeight: 'minHeight',
  maxWidth: 'maxWidth',
  maxHeight: 'maxHeight',

  // Shortcuts
  w: 'width',
  h: 'height',
  minW: 'minWidth',
  minH: 'minHeight',
  maxW: 'maxWidth',
  maxH: 'maxHeight',

  // Multi-property
  size: { properties: ['width', 'height'] },
  boxSize: { properties: ['width', 'height'] },
}

export const COLOR = {
  bg: 'backgroundColor',
  bgColor: 'backgroundColor',
  background: 'backgroundColor',
  backgroundColor: 'backgroundColor',
}

export const BORDER = {
  // Simple borders
  borderColor: 'borderColor',
  borderWidth: 'borderWidth',

  // Single radius (with token helper)
  borderRadius: {
    styleName: 'borderRadius',
    tokenHelper: 'radius',
  },
  rounded: {
    styleName: 'borderRadius',
    tokenHelper: 'radius',
  },

  // Specific corner radius
  borderTopLeftRadius: {
    styleName: 'borderTopLeftRadius',
    tokenHelper: 'radius',
  },
  borderTopRightRadius: {
    styleName: 'borderTopRightRadius',
    tokenHelper: 'radius',
  },
  borderBottomLeftRadius: {
    styleName: 'borderBottomLeftRadius',
    tokenHelper: 'radius',
  },
  borderBottomRightRadius: {
    styleName: 'borderBottomRightRadius',
    tokenHelper: 'radius',
  },

  // Multi-corner radius (expand to multiple)
  borderTopRadius: {
    properties: ['borderTopLeftRadius', 'borderTopRightRadius'],
    tokenHelper: 'radius',
  },
  borderBottomRadius: {
    properties: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
    tokenHelper: 'radius',
  },
  borderLeftRadius: {
    properties: ['borderTopLeftRadius', 'borderBottomLeftRadius'],
    tokenHelper: 'radius',
  },
  borderRightRadius: {
    properties: ['borderTopRightRadius', 'borderBottomRightRadius'],
    tokenHelper: 'radius',
  },
  roundedTop: {
    properties: ['borderTopLeftRadius', 'borderTopRightRadius'],
    tokenHelper: 'radius',
  },
  roundedBottom: {
    properties: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
    tokenHelper: 'radius',
  },
  roundedLeft: {
    properties: ['borderTopLeftRadius', 'borderBottomLeftRadius'],
    tokenHelper: 'radius',
  },
  roundedRight: {
    properties: ['borderTopRightRadius', 'borderBottomRightRadius'],
    tokenHelper: 'radius',
  },
}

export const LAYOUT = {
  space: 'gap',
}

export const FLEXBOX = {
  alignItems: 'alignItems',
  alignContent: 'alignContent',
  alignSelf: 'alignSelf',
  justifyContent: 'justifyContent',
  justifyItems: 'justifyItems',
  justifySelf: 'justifySelf',
  flex: 'flex',
  flexGrow: 'flexGrow',
  flexShrink: 'flexShrink',
  flexBasis: 'flexBasis',
  flexDirection: 'flexDirection',
  flexWrap: 'flexWrap',
  order: 'order',
  display: 'display',
}

export const POSITION = {
  position: 'position',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  zIndex: 'zIndex',
}

export const EXTRA = {
  overflow: 'overflow',
  opacity: 'opacity',
}
