/**
 * Shared utilities for formatting output
 */

/**
 * Convert AST back to source with consistent formatting
 */
export function toFormattedSource(root) {
  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}
