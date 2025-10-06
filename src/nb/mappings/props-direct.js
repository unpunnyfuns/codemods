// Props passed through unchanged

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
