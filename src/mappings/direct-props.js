/**
 * Common props that are passed through unchanged
 * Standard React Native props that work across most components
 */

export const EVENT_HANDLERS = ['onPress', 'onLongPress', 'onLayout', 'onFocus', 'onBlur']

export const ACCESSIBILITY = [
  'testID',
  'accessibilityLabel',
  'accessibilityHint',
  'accessibilityRole',
  'accessibilityState',
  'accessibilityValue',
  'accessible',
  'importantForAccessibility',
]

export const COMMON = [...EVENT_HANDLERS, ...ACCESSIBILITY]
