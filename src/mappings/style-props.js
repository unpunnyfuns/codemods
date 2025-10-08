/**
 * Common NativeBase style prop mappings
 * These are reusable across most NativeBase components
 */

export const spacing = {
  // Margin - full names
  margin: { styleName: 'margin', tokenHelper: 'space' },
  marginTop: { styleName: 'marginTop', tokenHelper: 'space' },
  marginBottom: { styleName: 'marginBottom', tokenHelper: 'space' },
  marginLeft: { styleName: 'marginLeft', tokenHelper: 'space' },
  marginRight: { styleName: 'marginRight', tokenHelper: 'space' },

  // Margin - shortcuts
  m: { styleName: 'margin', tokenHelper: 'space' },
  mt: { styleName: 'marginTop', tokenHelper: 'space' },
  mb: { styleName: 'marginBottom', tokenHelper: 'space' },
  ml: { styleName: 'marginLeft', tokenHelper: 'space' },
  mr: { styleName: 'marginRight', tokenHelper: 'space' },
  mx: { styleName: 'marginHorizontal', tokenHelper: 'space' },
  my: { styleName: 'marginVertical', tokenHelper: 'space' },

  // Margin - NativeBase specific (expand to multiple)
  marginX: { properties: ['marginLeft', 'marginRight'], tokenHelper: 'space' },
  marginY: { properties: ['marginTop', 'marginBottom'], tokenHelper: 'space' },

  // Padding - full names
  padding: { styleName: 'padding', tokenHelper: 'space' },
  paddingTop: { styleName: 'paddingTop', tokenHelper: 'space' },
  paddingBottom: { styleName: 'paddingBottom', tokenHelper: 'space' },
  paddingLeft: { styleName: 'paddingLeft', tokenHelper: 'space' },
  paddingRight: { styleName: 'paddingRight', tokenHelper: 'space' },

  // Padding - shortcuts
  p: { styleName: 'padding', tokenHelper: 'space' },
  pt: { styleName: 'paddingTop', tokenHelper: 'space' },
  pb: { styleName: 'paddingBottom', tokenHelper: 'space' },
  pl: { styleName: 'paddingLeft', tokenHelper: 'space' },
  pr: { styleName: 'paddingRight', tokenHelper: 'space' },
  px: { styleName: 'paddingHorizontal', tokenHelper: 'space' },
  py: { styleName: 'paddingVertical', tokenHelper: 'space' },
}

export const sizing = {
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

export const color = {
  bg: { styleName: 'backgroundColor', tokenHelper: 'color' },
  bgColor: { styleName: 'backgroundColor', tokenHelper: 'color' },
  background: { styleName: 'backgroundColor', tokenHelper: 'color' },
  backgroundColor: { styleName: 'backgroundColor', tokenHelper: 'color' },
}

export const border = {
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

export const layout = {
  space: 'gap',
}

export const flexbox = {
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

export const position = {
  position: 'position',
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  zIndex: 'zIndex',
}

export const extra = {
  overflow: 'overflow',
  opacity: 'opacity',
}
