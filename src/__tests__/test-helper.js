import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import jscodeshift from 'jscodeshift'

// Default test options for transforms that require them
export const DEFAULT_TEST_OPTIONS = {
  sourceImport: '@source/components',
  targetImport: '@target/components/TestComponent',
  tokenImport: '@design-tokens',
  barrelImport: '@source/components',
  atomPrefix: '@source/components/atoms/',
}

/**
 * Test a codemod transform with normalized output for snapshot testing
 * Normalization: parse -> reformat with consistent options
 * This ensures formatting differences don't cause test failures
 *
 * @param {string} transformPath - Path to transform relative to src/ (e.g., 'nb/box' or 'transforms/redirect-imports')
 * @param {string} fixturePath - Path to fixture (e.g., 'nb/box')
 * @param {string} extension - File extension for fixture (default: 'js')
 * @param {object} options - Options to pass to transform (default: {})
 */
export function testTransform(transformPath, fixturePath, extension = 'js', options = {}) {
  const transform = require(resolve(__dirname, `../${transformPath}.js`)).default
  const j = jscodeshift.withParser('tsx')

  // All fixtures live in src/__testfixtures__/${fixturePath}
  const fixturesPath = resolve(__dirname, '../__testfixtures__')
  const inputPath = resolve(fixturesPath, `${fixturePath}.input.${extension}`)

  const input = readFileSync(inputPath, 'utf8')

  const fileInfo = {
    path: inputPath,
    source: input,
  }

  const api = {
    jscodeshift: j,
    j,
    stats: () => {},
    report: () => {},
  }

  const output = transform(fileInfo, api, options)

  // Normalize by round-tripping through jscodeshift with consistent formatting
  // This makes snapshots formatting-independent
  return j(output).toSource({
    quote: 'single',
    trailingComma: true,
    arrowParensAlways: false,
    tabWidth: 2,
    useTabs: false,
  })
}
