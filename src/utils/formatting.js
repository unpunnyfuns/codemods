/**
 * Shared utilities for formatting output
 */

import { execSync } from 'node:child_process'

/**
 * Convert AST back to source with consistent formatting using Biome
 */
export function toFormattedSource(root) {
  const source = root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })

  // Apply Biome formatting and import organization via CLI
  try {
    const formatted = execSync('npx biome check --write --stdin-file-path=file.tsx', {
      input: source,
      encoding: 'utf8',
    })
    return formatted
  } catch {
    // If formatting fails, return original source
    return source
  }
}
