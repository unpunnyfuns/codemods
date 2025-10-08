/**
 * Common props that are passed through unchanged
 * Standard React Native props that work across most components
 */

export const eventHandlers = ['onPress', 'onLongPress', 'onLayout', 'onFocus', 'onBlur']

export const accessibility = [
  'testID',
  'accessibilityLabel',
  'accessibilityHint',
  'accessibilityRole',
  'accessibilityState',
  'accessibilityValue',
  'accessible',
  'importantForAccessibility',
]

export const directProps = [...eventHandlers, ...accessibility]
