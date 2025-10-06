/**
 * React Native Props Model
 *
 * Documents what React Native core components support.
 * This is the platform layer - constraints that both NativeBase and target must respect.
 *
 * Source: React Native documentation
 * https://reactnative.dev/docs/view-style-props
 * https://reactnative.dev/docs/text-style-props
 * https://reactnative.dev/docs/image-style-props
 */

/**
 * View Component
 * Base component for layout - most RN components are built on View
 */

// Style properties supported by React Native View
export const VIEW_STYLE_PROPS = {
  // Layout & Flexbox
  display: true,
  width: true,
  height: true,
  minWidth: true,
  minHeight: true,
  maxWidth: true,
  maxHeight: true,
  overflow: true,
  aspectRatio: true,
  direction: true,
  flex: true,
  flexDirection: true,
  flexWrap: true,
  flexGrow: true,
  flexShrink: true,
  flexBasis: true,
  alignContent: true,
  alignItems: true,
  alignSelf: true,
  justifyContent: true,
  gap: true,
  rowGap: true,
  columnGap: true,

  // Spacing
  margin: true,
  marginTop: true,
  marginRight: true,
  marginBottom: true,
  marginLeft: true,
  marginHorizontal: true,
  marginVertical: true,
  marginStart: true,
  marginEnd: true,
  padding: true,
  paddingTop: true,
  paddingRight: true,
  paddingBottom: true,
  paddingLeft: true,
  paddingHorizontal: true,
  paddingVertical: true,
  paddingStart: true,
  paddingEnd: true,

  // Position
  position: true,
  top: true,
  right: true,
  bottom: true,
  left: true,
  start: true,
  end: true,
  zIndex: true,

  // Border
  borderWidth: true,
  borderTopWidth: true,
  borderRightWidth: true,
  borderBottomWidth: true,
  borderLeftWidth: true,
  borderStartWidth: true,
  borderEndWidth: true,
  borderStyle: true,
  borderColor: true,
  borderTopColor: true,
  borderRightColor: true,
  borderBottomColor: true,
  borderLeftColor: true,
  borderStartColor: true,
  borderEndColor: true,
  borderRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  borderTopStartRadius: true,
  borderTopEndRadius: true,
  borderBottomStartRadius: true,
  borderBottomEndRadius: true,

  // Color & Visual
  backgroundColor: true,
  opacity: true,

  // Transform
  transform: true,
  transformMatrix: true,
  rotation: true,
  scaleX: true,
  scaleY: true,
  translateX: true,
  translateY: true,

  // Shadow (iOS) & Elevation (Android)
  shadowColor: true,
  shadowOffset: true,
  shadowOpacity: true,
  shadowRadius: true,
  elevation: true,
}

/**
 * Text Component
 * For displaying text - supports text-specific styling
 */

export const TEXT_STYLE_PROPS = {
  // Inherits View layout props
  ...VIEW_STYLE_PROPS,

  // Text-specific styling
  color: true,
  fontFamily: true,
  fontSize: true,
  fontStyle: true,
  fontWeight: true,
  fontVariant: true,
  textShadowOffset: true,
  textShadowRadius: true,
  textShadowColor: true,
  letterSpacing: true,
  lineHeight: true,
  textAlign: true,
  textAlignVertical: true,
  textDecorationLine: true,
  textDecorationStyle: true,
  textDecorationColor: true,
  textTransform: true,
  writingDirection: true,

  // Android-specific
  includeFontPadding: true,
  textBreakStrategy: true,
}

// Text doesn't support these View props
export const INVALID_TEXT_STYLE_PROPS = [
  // No background on inline text in RN
  // (actually it IS supported, but uncommon)
]

/**
 * Image Component
 * For displaying images
 */

export const IMAGE_STYLE_PROPS = {
  // Inherits some View layout props
  width: true,
  height: true,
  margin: true,
  marginTop: true,
  marginRight: true,
  marginBottom: true,
  marginLeft: true,
  marginHorizontal: true,
  marginVertical: true,
  padding: true,
  paddingTop: true,
  paddingRight: true,
  paddingBottom: true,
  paddingLeft: true,
  paddingHorizontal: true,
  paddingVertical: true,
  borderWidth: true,
  borderTopWidth: true,
  borderRightWidth: true,
  borderBottomWidth: true,
  borderLeftWidth: true,
  borderRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderBottomLeftRadius: true,
  borderBottomRightRadius: true,
  backgroundColor: true,
  opacity: true,

  // Image-specific
  resizeMode: true,
  tintColor: true,
  overlayColor: true, // Android only
}

/**
 * ScrollView Component
 * Scrollable container - extends View
 */

export const SCROLLVIEW_STYLE_PROPS = {
  ...VIEW_STYLE_PROPS,
  // ScrollView accepts all View style props
}

/**
 * TouchableOpacity, Pressable
 * Interactive components - extend View
 */

export const PRESSABLE_STYLE_PROPS = {
  ...VIEW_STYLE_PROPS,
  // Pressable accepts all View style props
}

/**
 * TextInput Component
 * Text input field
 */

export const TEXT_INPUT_STYLE_PROPS = {
  // Mix of View and Text props
  ...VIEW_STYLE_PROPS,
  color: true,
  fontFamily: true,
  fontSize: true,
  fontStyle: true,
  fontWeight: true,
  letterSpacing: true,
  lineHeight: true,
  textAlign: true,
  textAlignVertical: true,
  textDecorationLine: true,
  textDecorationColor: true,
  textShadowColor: true,
  textShadowOffset: true,
  textShadowRadius: true,
  includeFontPadding: true,
}

/**
 * Value Type Constraints
 * What types of values different props accept
 */

// Props that ONLY accept numbers (no strings, no tokens)
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
  'rotation',
  'scaleX',
  'scaleY',
  'translateX',
  'translateY',
]

// Props that accept dimensions (numbers, percentages, 'auto')
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
  'gap',
  'rowGap',
  'columnGap',
  'fontSize',
  'lineHeight',
  'letterSpacing',
]

// Props that accept color values
export const COLOR_PROPS = [
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderStartColor',
  'borderEndColor',
  'shadowColor',
  'color', // Text only
  'tintColor', // Image only
  'overlayColor', // Image only (Android)
  'textShadowColor',
  'textDecorationColor',
]

/**
 * Helper Functions
 */

/**
 * Check if a style prop is valid for a specific React Native component
 */
export function isValidStyleProp(componentType, propName) {
  switch (componentType) {
    case 'View':
    case 'ScrollView':
    case 'Pressable':
    case 'TouchableOpacity':
      return VIEW_STYLE_PROPS[propName] === true
    case 'Text':
      return TEXT_STYLE_PROPS[propName] === true
    case 'Image':
      return IMAGE_STYLE_PROPS[propName] === true
    case 'TextInput':
      return TEXT_INPUT_STYLE_PROPS[propName] === true
    default:
      return false
  }
}

/**
 * Get all valid style props for a specific React Native component
 * Returns the style props object for the component type
 */
export function getStylePropsByComponent(componentType) {
  switch (componentType) {
    case 'View':
    case 'ScrollView':
    case 'Pressable':
    case 'TouchableOpacity':
      return VIEW_STYLE_PROPS
    case 'Text':
      return TEXT_STYLE_PROPS
    case 'Image':
      return IMAGE_STYLE_PROPS
    case 'TextInput':
      return TEXT_INPUT_STYLE_PROPS
    default:
      return {}
  }
}

/**
 * Compose multiple style prop objects into one
 * Useful for building component-specific prop sets declaratively
 */
export function composeStyleProps(...categories) {
  return Object.assign({}, ...categories)
}
