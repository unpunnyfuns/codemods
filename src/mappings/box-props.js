/**
 * Prop mappings for Box component migration
 *
 * Box is the fundamental layout component in NativeBase.
 * It's essentially a styled View with all StyledProps available.
 */

import * as commonDirectProps from './common-direct-props.js'
import * as commonDropProps from './common-drop-props.js'
import * as commonStyleProps from './common-style-props.js'

// STYLE_PROPS: Extracted to StyleSheet
export const STYLE_PROPS = {
  ...commonStyleProps.SPACING,
  ...commonStyleProps.SIZING,
  ...commonStyleProps.COLOR,
  ...commonStyleProps.BORDER,
  ...commonStyleProps.LAYOUT,
}

// TRANSFORM_PROPS: Renamed on element (none for Box)
export const TRANSFORM_PROPS = {}

// DIRECT_PROPS: Passed through unchanged
export const DIRECT_PROPS = commonDirectProps.COMMON

// DROP_PROPS: Removed entirely
export const DROP_PROPS = [
  ...commonDropProps.COMMON,
  // Box-specific
  '_text', // Nested Text styling
  'linearGradient', // Gradient support (complex, handle separately if needed)
]
