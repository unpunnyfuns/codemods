/**
 * Prop mappings for Stack component (HStack/VStack) migration
 *
 * Supports:
 * - Prop name mapping (align → alignItems)
 * - Value transformation (align="start" → alignItems="flex-start")
 * - Token helpers (e.g., space={2} → gap: spacing(2))
 */

import * as commonDirectProps from './common-direct-props.js'
import * as commonDropProps from './common-drop-props.js'
import * as commonStyleProps from './common-style-props.js'
import * as commonValueMaps from './common-value-maps.js'

// STYLE_PROPS: Extracted to StyleSheet with value mapping where needed
export const STYLE_PROPS = {
  ...commonStyleProps.SPACING,
  ...commonStyleProps.SIZING,
  ...commonStyleProps.COLOR,
  ...commonStyleProps.BORDER,
  ...commonStyleProps.LAYOUT,
  ...commonStyleProps.FLEXBOX,
  ...commonStyleProps.POSITION,
  ...commonStyleProps.EXTRA,

  // Stack-specific props with value mapping
  align: {
    styleName: 'alignItems',
    valueMap: commonValueMaps.ALIGN_VALUES,
  },
  justify: {
    styleName: 'justifyContent',
    valueMap: commonValueMaps.JUSTIFY_VALUES,
  },
}

// Remove space from STYLE_PROPS since it should stay on element
delete STYLE_PROPS.space

// TRANSFORM_PROPS: Renamed on element (for props that can't go in StyleSheet)
export const TRANSFORM_PROPS = {
  // space prop stays on element as gap
  space: 'gap',
}

// DIRECT_PROPS: Passed through unchanged
export const DIRECT_PROPS = commonDirectProps.COMMON

// DROP_PROPS: Removed entirely
export const DROP_PROPS = [
  ...commonDropProps.COMMON,
  // Stack-specific
  'divider',
  'reversed', // Not supported in Aurora Stack
  '_text',
  '_stack',
]
