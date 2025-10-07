/**
 * Prop mappings for Pressable component migration
 *
 * NativeBase Pressable → React Native Pressable
 * Common wrapper sets accessibilityRole="button" by default
 */

import * as commonDirectProps from './common/common-direct-props.js'
import * as commonDropProps from './common/common-drop-props.js'
import * as commonStyleProps from './common/common-style-props.js'

// STYLE_PROPS: Extracted to StyleSheet
export const STYLE_PROPS = {
  ...commonStyleProps.SPACING,
  ...commonStyleProps.SIZING,
  ...commonStyleProps.COLOR,
  ...commonStyleProps.BORDER,
  ...commonStyleProps.LAYOUT,
  ...commonStyleProps.FLEXBOX,
  ...commonStyleProps.POSITION,
  ...commonStyleProps.EXTRA,
}

// TRANSFORM_PROPS: None for Pressable
export const TRANSFORM_PROPS = {}

// DIRECT_PROPS: Passed through unchanged
export const DIRECT_PROPS = [
  ...commonDirectProps.COMMON,
  'onPress',
  'onPressIn',
  'onPressOut',
  'onLongPress',
  'disabled',
  'hitSlop',
  'pressRetentionOffset',
  'android_disableSound',
  'android_ripple',
  'unstable_pressDelay',
]

// DROP_PROPS: Removed entirely
export const DROP_PROPS = [
  ...commonDropProps.COMMON,
  'isDisabled', // Use 'disabled' instead
]
