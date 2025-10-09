/**
 * Shared utilities for manipulating JSX elements
 */

/**
 * Check if any JSX elements have attributes/props
 */
export function hasAttributes(jsxElements) {
  return jsxElements.some((path) => {
    const attributes = path.node.openingElement.attributes || []
    return attributes.length > 0
  })
}
