/**
 * Shared utilities for manipulating JSX elements
 */

/**
 * Check if any JSX elements have attributes/props
 */
export function hasAttributes(jsxElements) {
  let hasAttrs = false
  jsxElements.forEach((path) => {
    const attributes = path.node.openingElement.attributes || []
    if (attributes.length > 0) {
      hasAttrs = true
    }
  })
  return hasAttrs
}
