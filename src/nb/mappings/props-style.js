/**
 * NativeBase → Nordlys Style Prop Mappings
 *
 * Complete mappings derived from:
 * - SOURCE: nativebase-styled-props.js (NativeBase model)
 * - TARGET: nordlys-props.js (Nordlys model)
 *
 * Mapping format:
 * - String: Direct map (e.g., 'flex' → style.flex)
 * - { styleName: 'x' }: Rename prop (e.g., bg → style.backgroundColor)
 * - { styleName: 'x', tokenHelper: 'space' }: Use token (e.g., p → style.padding with space.md)
 * - { styleName: 'x', valueMap: {...} }: Transform values (e.g., full → 100%)
 * - { properties: ['x', 'y'] }: Expand to multiple (e.g., mx → marginLeft, marginRight)
 *
 * Used by: categorizeProps() in props.js
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

  // Margin - NativeBase long-form shortcuts (map to RN native shorthands)
  marginX: { styleName: 'marginHorizontal', tokenHelper: 'space' },
  marginY: { styleName: 'marginVertical', tokenHelper: 'space' },

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

  // Padding - NativeBase long-form shortcuts (map to RN native shorthands)
  paddingX: { styleName: 'paddingHorizontal', tokenHelper: 'space' },
  paddingY: { styleName: 'paddingVertical', tokenHelper: 'space' },

  // Gap (flexbox gap)
  gap: { styleName: 'gap', tokenHelper: 'space' },
}

// Value mapping for dimension values
const dimensionValues = {
  full: '100%',
}

export const sizing = {
  // Full names
  width: { styleName: 'width', valueMap: dimensionValues },
  height: { styleName: 'height', valueMap: dimensionValues },
  minWidth: { styleName: 'minWidth', valueMap: dimensionValues },
  minHeight: { styleName: 'minHeight', valueMap: dimensionValues },
  maxWidth: { styleName: 'maxWidth', valueMap: dimensionValues },
  maxHeight: { styleName: 'maxHeight', valueMap: dimensionValues },

  // Shortcuts
  w: { styleName: 'width', valueMap: dimensionValues },
  h: { styleName: 'height', valueMap: dimensionValues },
  minW: { styleName: 'minWidth', valueMap: dimensionValues },
  minH: { styleName: 'minHeight', valueMap: dimensionValues },
  maxW: { styleName: 'maxWidth', valueMap: dimensionValues },
  maxH: { styleName: 'maxHeight', valueMap: dimensionValues },

  // Multi-property
  size: { properties: ['width', 'height'], valueMap: dimensionValues },
  boxSize: { properties: ['width', 'height'], valueMap: dimensionValues },
}

export const color = {
  bg: { styleName: 'backgroundColor', tokenHelper: 'color' },
  bgColor: { styleName: 'backgroundColor', tokenHelper: 'color' },
  background: { styleName: 'backgroundColor', tokenHelper: 'color' },
  backgroundColor: { styleName: 'backgroundColor', tokenHelper: 'color' },
}

export const border = {
  // Base border properties
  borderWidth: 'borderWidth',
  borderStyle: 'borderStyle',
  borderColor: { styleName: 'borderColor', tokenHelper: 'color' },

  // Border radius - single
  borderRadius: { styleName: 'borderRadius', tokenHelper: 'radius' },
  rounded: { styleName: 'borderRadius', tokenHelper: 'radius' },

  // Border radius - specific corners
  borderTopLeftRadius: { styleName: 'borderTopLeftRadius', tokenHelper: 'radius' },
  borderTopRightRadius: { styleName: 'borderTopRightRadius', tokenHelper: 'radius' },
  borderBottomLeftRadius: { styleName: 'borderBottomLeftRadius', tokenHelper: 'radius' },
  borderBottomRightRadius: { styleName: 'borderBottomRightRadius', tokenHelper: 'radius' },

  // Border radius - rounded* shortcuts (specific corners)
  roundedTopLeft: { styleName: 'borderTopLeftRadius', tokenHelper: 'radius' },
  roundedTopRight: { styleName: 'borderTopRightRadius', tokenHelper: 'radius' },
  roundedBottomLeft: { styleName: 'borderBottomLeftRadius', tokenHelper: 'radius' },
  roundedBottomRight: { styleName: 'borderBottomRightRadius', tokenHelper: 'radius' },

  // Border radius - multi-corner (expand to multiple)
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

  // Side-specific borders (width, color, style)
  borderTopWidth: 'borderTopWidth',
  borderTopColor: { styleName: 'borderTopColor', tokenHelper: 'color' },
  borderTopStyle: 'borderTopStyle',
  borderBottomWidth: 'borderBottomWidth',
  borderBottomColor: { styleName: 'borderBottomColor', tokenHelper: 'color' },
  borderBottomStyle: 'borderBottomStyle',
  borderLeftWidth: 'borderLeftWidth',
  borderLeftColor: { styleName: 'borderLeftColor', tokenHelper: 'color' },
  borderLeftStyle: 'borderLeftStyle',
  borderRightWidth: 'borderRightWidth',
  borderRightColor: { styleName: 'borderRightColor', tokenHelper: 'color' },
  borderRightStyle: 'borderRightStyle',
}

export const layout = {
  // Display and overflow
  display: 'display',
  overflow: 'overflow',

  // TEXT_ONLY - Only works on Text components
  textAlign: 'textAlign',
}

export const flexbox = {
  alignItems: 'alignItems',
  alignContent: 'alignContent',
  alignSelf: 'alignSelf',
  justifyItems: 'justifyItems',
  justifyContent: 'justifyContent',
  justifySelf: 'justifySelf',
  flex: 'flex',
  flexGrow: 'flexGrow',
  flexShrink: 'flexShrink',
  flexBasis: 'flexBasis',
  flexDirection: 'flexDirection',
  flexDir: 'flexDirection',
  flexWrap: 'flexWrap',
  order: 'order',
}

export const position = {
  position: 'position',
  top: { styleName: 'top', tokenHelper: 'space' },
  right: { styleName: 'right', tokenHelper: 'space' },
  bottom: { styleName: 'bottom', tokenHelper: 'space' },
  left: { styleName: 'left', tokenHelper: 'space' },
  zIndex: 'zIndex',
}

export const text = {
  // TEXT_ONLY - All text props only work on Text components, not View
  color: { styleName: 'color', tokenHelper: 'color' },
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  fontStyle: 'fontStyle',
  fontWeight: 'fontWeight',
  letterSpacing: 'letterSpacing',
  lineHeight: 'lineHeight',
  textAlign: 'textAlign',
  textDecorationLine: 'textDecorationLine',
  textDecoration: 'textDecorationLine',
  txtDecor: 'textDecorationLine',
  textDecorationColor: { styleName: 'textDecorationColor', tokenHelper: 'color' },
  textTransform: 'textTransform',
}

export const extra = {
  opacity: 'opacity',

  // IMAGE_ONLY - Only works on Image components
  tintColor: { styleName: 'tintColor', tokenHelper: 'color' },
}
