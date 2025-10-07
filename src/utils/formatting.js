/**
 * Shared utilities for formatting output
 */

/**
 * Convert AST back to source
 * Note: Output is unformatted - run your project's formatter afterwards
 */
export function toFormattedSource(root) {
  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}
