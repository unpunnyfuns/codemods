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
 * @param {string} fixturePath - Path to fixture (e.g., 'nb/box') - can be null if sourceInput provided
 * @param {string} extension - File extension for fixture (default: 'js')
 * @param {object} options - Options to pass to transform (default: {}). Can include sourceInput.
 */
export function testTransform(transformPath, fixturePath, extension = 'js', options = {}) {
  const transform = require(resolve(__dirname, `../${transformPath}.js`)).default
  const j = jscodeshift.withParser('tsx')

  // Support direct source input or file-based fixtures
  let input
  let inputPath

  if (options.sourceInput) {
    input = options.sourceInput
    inputPath = 'inline-test.tsx'
    // Remove sourceInput from options passed to transform
    // biome-ignore lint/correctness/noUnusedVariables: destructuring to remove property
    const { sourceInput, ...transformOptions } = options
    options = transformOptions
  } else {
    // Fixtures colocated with module directories
    // 'nb/box' -> src/nb/__testfixtures__/box.input.tsx
    // 'remove-unused/mixed' -> src/__testfixtures__/remove-unused/mixed.input.tsx
    const parts = fixturePath.split('/')
    const [first, ...rest] = parts

    // Check if first part is a module directory (has __testfixtures__ subfolder)
    // Known module directories: nb
    const moduleDirectories = ['nb']

    if (moduleDirectories.includes(first) && rest.length > 0) {
      inputPath = resolve(__dirname, `../${first}/__testfixtures__/${rest.join('/')}.input.${extension}`)
    } else {
      // Root __testfixtures__ with optional subdirectory
      inputPath = resolve(__dirname, `../__testfixtures__/${fixturePath}.input.${extension}`)
    }
    input = readFileSync(inputPath, 'utf8')
  }

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
