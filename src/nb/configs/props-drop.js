// Building blocks for drop props
// Each component codemod composes what it needs

export {
  allPseudoProps,
  interactionPseudoProps,
  nestedComponentPseudoProps,
  platformPseudoProps,
  statePseudoProps,
  themePseudoProps,
} from './props-pseudo.js'

export { themeProps } from './props-theme.js'

// Props that don't map to React Native
export const unsupportedProps = ['shadow']
