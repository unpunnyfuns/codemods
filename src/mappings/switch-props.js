/**
 * Prop mappings for Switch component migration
 *
 * NativeBase/Common Switch → Nordlys Switch
 * Note: Custom transformation logic handles children→Switch.Label and label→Switch.Description
 */

// STYLE_PROPS: None - Switch doesn't accept style props in Nordlys
export const STYLE_PROPS = {}

// TRANSFORM_PROPS: Renamed on element
export const TRANSFORM_PROPS = {
  isChecked: 'value',
  onToggle: 'onValueChange',
  isDisabled: 'disabled',
}

// DIRECT_PROPS: Passed through unchanged
export const DIRECT_PROPS = [
  'testID',
  'accessibilityLabel',
  'accessibilityHint',
]

// DROP_PROPS: Removed entirely
export const DROP_PROPS = [
  'label', // Extracted to Switch.Description via custom logic
  'switchPosition',
  'hStackProps',
  'childrenProps',
  'labelProps',
  'LeftElement',

  // Pseudo props
  '_hover',
  '_pressed',
  '_disabled',
  '_focus',
  '_invalid',
  '_checked',
  '_indeterminate',
]
