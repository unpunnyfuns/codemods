/**
 * Comprehensive list of NativeBase pseudo-props to DROP during migration
 *
 * NativeBase uses pseudo-props for:
 * 1. Interaction state styling (_hover, _pressed, _focus, _focusVisible)
 * 2. Component state styling (_disabled, _invalid, _readOnly, _loading)
 * 3. Nested component styling (_text, _icon, _stack, _input, _spinner)
 *
 * Aurora doesn't support this pattern - users need to handle state-based styling differently.
 */

/**
 * Interaction state pseudo-props
 * Used for styling components based on user interaction
 */
export const interactionPseudoProps = [
  '_hover', // Applied when component is hovered
  '_pressed', // Applied when component is pressed/clicked
  '_focus', // Applied when component receives focus
  '_focusVisible', // Applied when focus ring should be visible (keyboard navigation)
]

/**
 * Component state pseudo-props
 * Used for styling components based on their state
 */
export const statePseudoProps = [
  '_disabled', // Applied when component is disabled
  '_invalid', // Applied when form input is invalid
  '_readOnly', // Applied when input is read-only
  '_loading', // Applied when component is in loading state
  '_checked', // Applied when checkbox/radio is checked
  '_indeterminate', // Applied when checkbox is in indeterminate state
]

/**
 * Nested component pseudo-props
 * Used for styling nested/child components
 */
export const nestedComponentPseudoProps = [
  '_text', // Props passed to nested Text component
  '_icon', // Props passed to nested Icon component
  '_stack', // Props passed to nested Stack/HStack/VStack component
  '_input', // Props passed to nested Input component
  '_spinner', // Props passed to nested Spinner component
  '_backdrop', // Props passed to Modal backdrop
  '_content', // Props passed to Modal/Popover content
  '_closeButton', // Props passed to close button
  '_web', // Web-specific props
  '_ios', // iOS-specific props
  '_android', // Android-specific props
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
