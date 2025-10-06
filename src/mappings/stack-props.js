/**
 * Prop mappings for Stack component (HStack/VStack) migration
 *
 * Note: Currently only handles prop name mapping. For value transformation
 * (e.g., align="start" → alignItems="flex-start"), enhance migrate-nb-component
 * to support value mappings in TRANSFORM_PROPS.
 */

import * as commonStyleProps from './common-style-props.js'
import * as commonDirectProps from './common-direct-props.js'
import * as commonDropProps from './common-drop-props.js'

// STYLE_PROPS: Extracted to StyleSheet with optional value mapping
export const STYLE_PROPS = {
  ...commonStyleProps.SPACING,

  // Space with optional value mapping for token scales
  // Uncomment and customize when Aurora tokens are available
  // space: {
  //   styleName: 'gap',
  //   valueMap: {
  //     1: 4,   // NativeBase space={1} → Aurora gap: 4
  //     2: 8,   // NativeBase space={2} → Aurora gap: 8
  //     3: 12,
  //     4: 16,
  //   }
  // },

  // Using simple mapping for now (no value transformation)
  space: 'gap',
}

// TRANSFORM_PROPS: Renamed on element with optional value mapping
export const TRANSFORM_PROPS = {
  align: {
    propName: 'alignItems',
    valueMap: {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      stretch: 'stretch',
      baseline: 'baseline',
    },
  },
  justify: {
    propName: 'justifyContent',
    valueMap: {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      between: 'space-between',
      around: 'space-around',
      evenly: 'space-evenly',
    },
  },
  reversed: 'reverse',
}

// DIRECT_PROPS: Passed through unchanged
export const DIRECT_PROPS = commonDirectProps.COMMON

// DROP_PROPS: Removed entirely
export const DROP_PROPS = [
  ...commonDropProps.COMMON,
  // Stack-specific
  'divider',
  '_text',
  '_stack',
]
