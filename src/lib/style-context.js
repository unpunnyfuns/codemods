/**
 * Context for managing StyleSheet generation and related imports
 */

import { addNamedImport } from './imports.js'
import { addOrExtendStyleSheet } from './rn/rn.js'

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
     * Returns the variable name used for the StyleSheet
     */
    applyToRoot(root, options, j) {
      const { wrap = true, tokenImport } = options

      if (!tokenImport && usedTokenHelpers.size > 0) {
        throw new Error('tokenImport is required when using token helpers')
      }

      if (elementStyles.length > 0) {
        if (wrap) {
          addNamedImport(root, 'react-native', 'View', j)
        }
        addNamedImport(root, 'react-native', 'StyleSheet', j)
        for (const h of usedTokenHelpers) {
          addNamedImport(root, tokenImport, h, j)
        }
        const stylesVarName = addOrExtendStyleSheet(root, elementStyles, j)

        // If a different variable name was used (e.g., 'componentStyles' instead of 'styles'),
        // update all style references in the AST
        if (stylesVarName && stylesVarName !== 'styles') {
          root
            .find(j.MemberExpression, {
              object: { type: 'Identifier', name: 'styles' },
            })
            .forEach((path) => {
              // Only update if it's a style reference (like styles.button0)
              // Check if the property name matches one of our generated style names
              const propertyName = path.node.property.name
              if (elementStyles.some((s) => s.name === propertyName)) {
                path.node.object.name = stylesVarName
              }
            })
        }

        return stylesVarName
      }

      return undefined
    },
  }
}
