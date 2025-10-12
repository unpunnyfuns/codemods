/**
 * Context for managing StyleSheet generation and related imports
 */

import { addOrExtendStyleSheet } from '@puns/shiftkit/rn'
import { addNamedImport } from '@puns/shiftkit'

export function createStyleContext() {
  const elementStyles = []
  const usedTokenHelpers = new Set()

  return {
    /**
     * Add a style definition
     */
    addStyle(name, styles) {
      elementStyles.push({ name, styles })
    },

    /**
     * Add token helpers that were used
     */
    addHelpers(helpers) {
      if (Array.isArray(helpers)) {
        for (const h of helpers) {
          usedTokenHelpers.add(h)
        }
      } else if (helpers instanceof Set) {
        for (const h of helpers) {
          usedTokenHelpers.add(h)
        }
      } else {
        usedTokenHelpers.add(helpers)
      }
    },

    /**
     * Get the number of styles that have been added
     */
    get length() {
      return elementStyles.length
    },

    /**
     * Check if any styles have been added
     */
    hasStyles() {
      return elementStyles.length > 0
    },

    /**
     * Apply all accumulated styles and imports to the root AST
     */
    applyToRoot(root, options, j) {
      const { wrap = true, tokenImport = '@hb-frontend/nordlys' } = options

      if (elementStyles.length > 0) {
        if (wrap) {
          addNamedImport(root, 'react-native', 'View', j)
        }
        addNamedImport(root, 'react-native', 'StyleSheet', j)
        for (const h of usedTokenHelpers) {
          addNamedImport(root, tokenImport, h, j)
        }
        addOrExtendStyleSheet(root, elementStyles, j)
      }
    },
  }
}
