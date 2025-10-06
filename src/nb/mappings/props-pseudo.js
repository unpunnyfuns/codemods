// NativeBase pseudo-props to drop

// Interaction state
export const interactionPseudoProps = ['_hover', '_pressed', '_focus', '_focusVisible']

// Component state
export const statePseudoProps = [
  '_disabled',
  '_invalid',
  '_readOnly',
  '_loading',
  '_checked',
  '_indeterminate',
]

// Nested component styling
export const nestedComponentPseudoProps = [
  '_text',
  '_icon',
  '_stack',
  '_input',
  '_spinner',
  '_backdrop',
  '_content',
  '_closeButton',
]

// Platform conditionals
export const platformPseudoProps = ['_web', '_ios', '_android']

// Theme conditionals
export const themePseudoProps = ['_light', '_dark']

// All pseudo-props
export const allPseudoProps = [
  ...interactionPseudoProps,
  ...statePseudoProps,
  ...nestedComponentPseudoProps,
  ...platformPseudoProps,
  ...themePseudoProps,
]
