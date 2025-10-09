/**
 * Common NativeBase props to drop during migration
 *
 * Combines:
 * - Pseudo-props for interaction/state/nested styling
 * - Theme system props (colorScheme, variant, size)
 * - Platform/theme overrides
 * - Component-agnostic NativeBase props (shadow, etc.)
 */

import { allPseudoProps } from './props-pseudo.js'
import { allThemeProps } from './props-theme.js'

export const platformOverrides = ['_web', '_ios', '_android']

export const themeOverrides = ['_light', '_dark']

export const componentSpecific = [
  'shadow', // NativeBase shadow system - use style-based shadows in Nordlys
  'justifyItems', // CSS Grid property - not supported in React Native (use alignItems)
  'justifySelf', // CSS Grid property - not supported in React Native (use alignSelf)
]

export const dropProps = [
  ...allPseudoProps,
  ...allThemeProps,
  ...platformOverrides,
  ...themeOverrides,
  ...componentSpecific,
]
