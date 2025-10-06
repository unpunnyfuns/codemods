// Props passed through unchanged

export const reactSpecialProps = ['key', 'ref']

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

export const directProps = [...reactSpecialProps, ...eventHandlers, ...accessibility]
