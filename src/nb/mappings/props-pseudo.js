/**
 * Comprehensive list of NativeBase pseudo-props to DROP during migration
 *
 * NativeBase uses pseudo-props for:
 * 1. Interaction state styling (_hover, _pressed, _focus, _focusVisible)
 * 2. Component state styling (_disabled, _invalid, _readOnly, _loading)
 * 3. Nested component styling (_text, _icon, _stack, _input, _spinner)
 *
 * Nordlys doesn't support this pattern - users need to handle state-based styling differently.
 */

/**
 * Interaction state pseudo-props
 * Used for styling components based on user interaction
 */
export const interactionPseudoProps = ['_hover', '_pressed', '_focus', '_focusVisible']

/**
 * Component state pseudo-props
 * Used for styling components based on their state
 */
export const statePseudoProps = [
  '_disabled',
  '_invalid',
  '_readOnly',
  '_loading',
  '_checked',
  '_indeterminate',
]

/**
 * Nested component pseudo-props
 * Used for styling nested/child components
 */
export const nestedComponentPseudoProps = [
  '_text',
  '_icon',
  '_stack',
  '_input',
  '_spinner',
  '_backdrop',
  '_content',
  '_closeButton',
  '_web',
  '_ios',
  '_android',
]

/**
 * ALL pseudo-props to drop
 * Complete list combining all categories
 */
export const allPseudoProps = [
  ...interactionPseudoProps,
  ...statePseudoProps,
  ...nestedComponentPseudoProps,
]
