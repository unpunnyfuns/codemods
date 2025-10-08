import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import jscodeshift from 'jscodeshift'

/**
 * Test a codemod transform with normalized output for snapshot testing
 * Normalization: parse → reformat with consistent options
 * This ensures formatting differences don't cause test failures
 *
 * @param {string} transformPath - Path to transform relative to src/ (e.g., 'migrations/box' or 'transforms/split-atoms')
 * @param {string} fixturePath - Path to fixture relative to __testfixtures__/ (e.g., 'migrations/box' or 'transforms/split-atoms')
 * @param {string} extension - File extension for fixture (default: 'js')
 */
export function testTransform(transformPath, fixturePath, extension = 'js') {
  const transform = require(resolve(__dirname, `../${transformPath}.js`)).default
  const j = jscodeshift.withParser('tsx')

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

  const options = {}

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
