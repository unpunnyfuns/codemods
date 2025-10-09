/**
 * Building blocks for drop props
 * Each component codemod should explicitly compose what it needs
 *
 * DON'T blindly import a combined list - prop behavior is component-specific.
 * For example, 'size' is a layout prop for Stack but a theme variant for Button.
 *
 * Building blocks:
 * - allPseudoProps: _hover, _pressed, etc.
 * - themeProps: colorScheme, variant, size (theme variants)
 * - platformOverrides: _web, _ios, _android
 * - themeOverrides: _light, _dark
 * - componentAgnostic: shadow, justifyItems, etc.
 */

import { allPseudoProps } from './props-pseudo.js'
import { themeProps } from './props-theme.js'

export { allPseudoProps, themeProps }

export const platformOverrides = ['_web', '_ios', '_android']

export const themeOverrides = ['_light', '_dark']

export const componentAgnostic = [
  // NativeBase shadow system - use style-based shadows in Nordlys
  'shadow',
  // CSS Grid property - not supported in React Native (use alignItems)
  'justifyItems',
  // CSS Grid property - not supported in React Native (use alignSelf)
  'justifySelf',
]
