/**
 * Prop mappings for Box → View migration
 */

import * as commonDirectProps from './common/common-direct-props.js'
import * as commonDropProps from './common/common-drop-props.js'
import * as commonStyleProps from './common/common-style-props.js'

// STYLE_PROPS: Extracted to StyleSheet with optional value mapping
export const STYLE_PROPS = {
  // Spacing (inherited from common, with space token helper)
  ...commonStyleProps.SPACING,

  // Sizing (inherited from common)
  ...commonStyleProps.SIZING,

  // Layout/Flex (inherited from common)
  ...commonStyleProps.LAYOUT,

  // Border (inherited from common, with radius token helper)
  ...commonStyleProps.BORDER,

  // Color/Background props with color token helper
  bgColor: { styleName: 'backgroundColor', tokenHelper: 'color' },
  bg: { styleName: 'backgroundColor', tokenHelper: 'color' },
  backgroundColor: { styleName: 'backgroundColor', tokenHelper: 'color' },

  // Border colors
  borderColor: { styleName: 'borderColor', tokenHelper: 'color' },
  borderTopColor: { styleName: 'borderTopColor', tokenHelper: 'color' },
  borderBottomColor: { styleName: 'borderBottomColor', tokenHelper: 'color' },
  borderLeftColor: { styleName: 'borderLeftColor', tokenHelper: 'color' },
  borderRightColor: { styleName: 'borderRightColor', tokenHelper: 'color' },
}

// TRANSFORM_PROPS: Renamed on element with optional value mapping
export const TRANSFORM_PROPS = {}

// DIRECT_PROPS: Passed through unchanged
export const DIRECT_PROPS = [
  ...commonDirectProps.COMMON,
  'safeAreaBottom', // Box-specific safe area prop
]

// DROP_PROPS: Removed entirely
export const DROP_PROPS = [
  ...commonDropProps.COMMON,
  // Box-specific drops
  'disableTopRounding', // Handled by borderTopRadius: 0
  'disableBottomRounding', // Handled by borderBottomRadius: 0
]
