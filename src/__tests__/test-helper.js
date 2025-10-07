import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import jscodeshift from 'jscodeshift'

/**
 * Test a codemod transform against input/output fixtures
 * Note: Formats output for comparison - production transforms don't format
 */
export function testTransform(transformPath, fixtureName, extension = 'js') {
  const transform = require(transformPath).default
  const fixturesPath = resolve(__dirname, '../__testfixtures__')

  const inputPath = resolve(fixturesPath, `${fixtureName}.input.${extension}`)
  const outputPath = resolve(fixturesPath, `${fixtureName}.output.${extension}`)

  const input = readFileSync(inputPath, 'utf8')
  const expectedOutput = readFileSync(outputPath, 'utf8')

  const fileInfo = {
    path: inputPath,
    source: input,
  }

  const api = {
    jscodeshift: jscodeshift.withParser('tsx'),
    j: jscodeshift.withParser('tsx'),
    stats: () => {},
    report: () => {},
  }

  const options = {}

  const actualOutput = transform(fileInfo, api, options)

  // Simple normalization: remove semicolons, normalize quotes
  // This is just for test comparison - your project formats the real output
  const normalize = (code) => code.replace(/;$/gm, '').replace(/'/g, "'")

  return {
    actual: normalize(actualOutput),
    expected: normalize(expectedOutput),
  }
}
