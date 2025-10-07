/**
 * Common NativeBase props to drop during migration
 *
 * Combines:
 * - Pseudo-props for interaction/state/nested styling
 * - Theme system props (colorScheme, variant, size)
 * - Platform/theme overrides
 * - Component-agnostic NativeBase props (shadow, etc.)
 */

import * as pseudoProps from './pseudo-props.js'
import * as themeProps from './theme-props.js'

export const PLATFORM_OVERRIDES = ['_web', '_ios', '_android']

export const THEME_OVERRIDES = ['_light', '_dark']

export const COMPONENT_SPECIFIC = [
  'shadow', // NativeBase shadow system - use style-based shadows in Aurora
]

export const COMMON = [
  ...pseudoProps.ALL_PSEUDO_PROPS,
  ...themeProps.ALL_THEME_PROPS,
  ...PLATFORM_OVERRIDES,
  ...THEME_OVERRIDES,
  ...COMPONENT_SPECIFIC,
]
