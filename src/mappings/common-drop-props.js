/**
 * Common NativeBase props to drop
 * These have no equivalent in React Native or target components
 */

export const PSEUDO_PROPS = [
  '_hover',
  '_pressed',
  '_focus',
  '_disabled',
  '_invalid',
  '_checked',
  '_readOnly',
]

export const PLATFORM_OVERRIDES = [
  '_web',
  '_ios',
  '_android',
]

export const THEME_OVERRIDES = [
  '_light',
  '_dark',
]

export const COMMON = [
  ...PSEUDO_PROPS,
  ...PLATFORM_OVERRIDES,
  ...THEME_OVERRIDES,
]
