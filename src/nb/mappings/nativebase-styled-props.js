/**
 * Complete NativeBase StyledProps extracted from styled-system.ts
 *
 * REFERENCE DOCUMENTATION ONLY - Not currently used by codemods
 *
 * This is the definitive list of all props that NativeBase's styled system supports.
 * Extracted verbatim from: NativeBase/src/theme/styled-system.ts
 *
 * Use this as a reference when creating new component-specific prop mappings.
 *
 * Format:
 * - `true` means pass through the prop name as-is to RN style
 * - `{ property: 'x' }` means rename to 'x'
 * - `{ properties: ['x', 'y'] }` means expand to multiple properties
 * - `scale: 'x'` indicates it uses theme scale (colors, space, sizes, etc.)
 *
 * NOTE: Our codemods differ from NativeBase's behavior for mx/my/px/py:
 * - NativeBase expands: mx → ['marginLeft', 'marginRight']
 * - Our codemods map: mx → marginHorizontal (uses RN native shorthand)
 * This is intentional - React Native supports these properties natively,
 * so we use them instead of expanding to multiple properties.
 */

// SPACING PROPS
export const SPACING = {
  // Margin
  margin: { property: 'margin', scale: 'space' },
  m: { property: 'margin', scale: 'space' },
  marginTop: { property: 'marginTop', scale: 'space' },
  mt: { property: 'marginTop', scale: 'space' },
  marginRight: { property: 'marginRight', scale: 'space' },
  mr: { property: 'marginRight', scale: 'space' },
  marginBottom: { property: 'marginBottom', scale: 'space' },
  mb: { property: 'marginBottom', scale: 'space' },
  marginLeft: { property: 'marginLeft', scale: 'space' },
  ml: { property: 'marginLeft', scale: 'space' },
  marginX: { properties: ['marginLeft', 'marginRight'], scale: 'space' },
  mx: { properties: ['marginLeft', 'marginRight'], scale: 'space' },
  marginY: { properties: ['marginTop', 'marginBottom'], scale: 'space' },
  my: { properties: ['marginTop', 'marginBottom'], scale: 'space' },

  // Padding
  padding: { property: 'padding', scale: 'space' },
  p: { property: 'padding', scale: 'space' },
  paddingTop: { property: 'paddingTop', scale: 'space' },
  pt: { property: 'paddingTop', scale: 'space' },
  paddingRight: { property: 'paddingRight', scale: 'space' },
  pr: { property: 'paddingRight', scale: 'space' },
  paddingBottom: { property: 'paddingBottom', scale: 'space' },
  pb: { property: 'paddingBottom', scale: 'space' },
  paddingLeft: { property: 'paddingLeft', scale: 'space' },
  pl: { property: 'paddingLeft', scale: 'space' },
  paddingX: { properties: ['paddingLeft', 'paddingRight'], scale: 'space' },
  px: { properties: ['paddingLeft', 'paddingRight'], scale: 'space' },
  paddingY: { properties: ['paddingTop', 'paddingBottom'], scale: 'space' },
  py: { properties: ['paddingTop', 'paddingBottom'], scale: 'space' },

  // Gap
  gap: { property: 'gap', scale: 'space' },
}

// LAYOUT PROPS
export const LAYOUT = {
  width: { property: 'width', scale: 'sizes' },
  w: { property: 'width', scale: 'sizes' },
  height: { property: 'height', scale: 'sizes' },
  h: { property: 'height', scale: 'sizes' },
  minWidth: { property: 'minWidth', scale: 'sizes' },
  minW: { property: 'minWidth', scale: 'sizes' },
  minHeight: { property: 'minHeight', scale: 'sizes' },
  minH: { property: 'minHeight', scale: 'sizes' },
  maxWidth: { property: 'maxWidth', scale: 'sizes' },
  maxW: { property: 'maxWidth', scale: 'sizes' },
  maxHeight: { property: 'maxHeight', scale: 'sizes' },
  maxH: { property: 'maxHeight', scale: 'sizes' },
  size: { properties: ['width', 'height'], scale: 'sizes' },
  boxSize: { properties: ['width', 'height'], scale: 'sizes' },
  overflow: true,
  overflowX: true,
  overflowY: true,
  display: true,
  textAlign: true,
}

// FLEXBOX PROPS
export const FLEXBOX = {
  alignItems: true,
  alignContent: true,
  justifyItems: true,
  justifyContent: true,
  flexWrap: true,
  flexDirection: true,
  flexDir: { property: 'flexDirection' },
  flex: true,
  flexGrow: true,
  flexShrink: true,
  flexBasis: true,
  justifySelf: true,
  alignSelf: true,
  order: true,
}

// POSITION PROPS
export const POSITION = {
  position: true,
  zIndex: { property: 'zIndex' },
  top: { property: 'top', scale: 'space' },
  right: { property: 'right', scale: 'space' },
  bottom: { property: 'bottom', scale: 'space' },
  left: { property: 'left', scale: 'space' },
}

// COLOR PROPS
export const COLOR = {
  color: { property: 'color', scale: 'colors' },
  tintColor: { property: 'tintColor', scale: 'colors' },
  backgroundColor: { property: 'backgroundColor', scale: 'colors' },
  bg: { property: 'backgroundColor', scale: 'colors' },
  bgColor: { property: 'backgroundColor', scale: 'colors' },
  background: { property: 'backgroundColor', scale: 'colors' },
  opacity: { property: 'opacity', scale: 'opacity' },
  textDecorationColor: { property: 'textDecorationColor', scale: 'colors' },
}

// BORDER PROPS
export const BORDER = {
  borderWidth: { property: 'borderWidth', scale: 'borderWidths' },
  borderStyle: { property: 'borderStyle', scale: 'borderStyles' },
  borderColor: { property: 'borderColor', scale: 'colors' },
  borderRadius: { property: 'borderRadius', scale: 'radii' },

  // Radius shorthands
  rounded: { property: 'borderRadius', scale: 'radii' },
  borderTopRadius: { properties: ['borderTopLeftRadius', 'borderTopRightRadius'], scale: 'radii' },
  borderBottomRadius: {
    properties: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
    scale: 'radii',
  },
  borderLeftRadius: {
    properties: ['borderTopLeftRadius', 'borderBottomLeftRadius'],
    scale: 'radii',
  },
  borderRightRadius: {
    properties: ['borderTopRightRadius', 'borderBottomRightRadius'],
    scale: 'radii',
  },
  roundedTop: { properties: ['borderTopLeftRadius', 'borderTopRightRadius'], scale: 'radii' },
  roundedBottom: {
    properties: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
    scale: 'radii',
  },
  roundedLeft: { properties: ['borderTopLeftRadius', 'borderBottomLeftRadius'], scale: 'radii' },
  roundedRight: { properties: ['borderTopRightRadius', 'borderBottomRightRadius'], scale: 'radii' },
  roundedTopLeft: { property: 'borderTopLeftRadius', scale: 'radii' },
  roundedTopRight: { property: 'borderTopRightRadius', scale: 'radii' },
  roundedBottomLeft: { property: 'borderBottomLeftRadius', scale: 'radii' },
  roundedBottomRight: { property: 'borderBottomRightRadius', scale: 'radii' },
  borderTopLeftRadius: { property: 'borderTopLeftRadius', scale: 'radii' },
  borderTopRightRadius: { property: 'borderTopRightRadius', scale: 'radii' },
  borderBottomLeftRadius: { property: 'borderBottomLeftRadius', scale: 'radii' },
  borderBottomRightRadius: { property: 'borderBottomRightRadius', scale: 'radii' },

  // Side-specific
  borderTop: { property: 'borderTop', scale: 'borders' },
  borderRight: { property: 'borderRight', scale: 'borders' },
  borderBottom: { property: 'borderBottom', scale: 'borders' },
  borderLeft: { property: 'borderLeft', scale: 'borders' },
  borderX: { properties: ['borderLeft', 'borderRight'], scale: 'borders' },
  borderY: { properties: ['borderTop', 'borderBottom'], scale: 'borders' },

  borderTopWidth: { property: 'borderTopWidth', scale: 'borderWidths' },
  borderTopColor: { property: 'borderTopColor', scale: 'colors' },
  borderTopStyle: { property: 'borderTopStyle', scale: 'borderStyles' },
  borderBottomWidth: { property: 'borderBottomWidth', scale: 'borderWidths' },
  borderBottomColor: { property: 'borderBottomColor', scale: 'colors' },
  borderBottomStyle: { property: 'borderBottomStyle', scale: 'borderStyles' },
  borderLeftWidth: { property: 'borderLeftWidth', scale: 'borderWidths' },
  borderLeftColor: { property: 'borderLeftColor', scale: 'colors' },
  borderLeftStyle: { property: 'borderLeftStyle', scale: 'borderStyles' },
  borderRightWidth: { property: 'borderRightWidth', scale: 'borderWidths' },
  borderRightColor: { property: 'borderRightColor', scale: 'colors' },
  borderRightStyle: { property: 'borderRightStyle', scale: 'borderStyles' },
}

// BACKGROUND PROPS (mostly web-only)
export const BACKGROUND = {
  backgroundSize: true,
  backgroundPosition: true,
  backgroundRepeat: true,
  backgroundAttachment: true,
  backgroundBlendMode: true,
  bgImage: { property: 'backgroundImage' },
  bgImg: { property: 'backgroundImage' },
  bgBlendMode: { property: 'backgroundBlendMode' },
  bgSize: { property: 'backgroundSize' },
  bgPosition: { property: 'backgroundPosition' },
  bgPos: { property: 'backgroundPosition' },
  bgRepeat: { property: 'backgroundRepeat' },
  bgAttachment: { property: 'backgroundAttachment' },
}

// TYPOGRAPHY PROPS
export const TYPOGRAPHY = {
  fontFamily: { property: 'fontFamily', scale: 'fonts' },
  fontSize: { property: 'fontSize', scale: 'fontSizes' },
  fontWeight: { property: 'fontWeight', scale: 'fontWeights' },
  lineHeight: { property: 'lineHeight', scale: 'lineHeights' },
  letterSpacing: { property: 'letterSpacing', scale: 'letterSpacings' },
  textAlign: true,
  fontStyle: true,
  textTransform: true,
  textDecoration: { property: 'textDecorationLine' },
  txtDecor: { property: 'textDecorationLine' },
  textDecorationLine: true,

  // Web-only (should drop for RN)
  wordBreak: true,
  overflowWrap: true,
  textOverflow: true,
  whiteSpace: true,
}

// EXTRA PROPS (mostly web-only)
export const EXTRA = {
  outline: true,
  outlineWidth: true,
  outlineColor: true,
  outlineStyle: true,
  shadow: { scale: 'shadows' },
  cursor: true,
  overflow: true,
  userSelect: { property: 'userSelect' },
}

// ALL STYLED PROPS COMBINED
export const ALL_STYLED_PROPS = {
  ...SPACING,
  ...LAYOUT,
  ...FLEXBOX,
  ...POSITION,
  ...COLOR,
  ...BORDER,
  ...BACKGROUND,
  ...TYPOGRAPHY,
  ...EXTRA,
}

// Props to DROP for React Native (web-only CSS props)
export const WEB_ONLY_PROPS = [
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
