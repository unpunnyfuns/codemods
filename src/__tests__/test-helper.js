import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import jscodeshift from 'jscodeshift'

/**
 * Normalize code with Biome formatter
 * This ensures both actual and expected outputs are formatted identically
 * before comparison, making tests resilient to formatting differences
 */
function normalizeWithBiome(code) {
  try {
    const result = execSync('npx biome check --write --stdin-file-path=test.tsx', {
      input: code,
      encoding: 'utf8',
    })
    return result
  } catch {
    return code
  }
}

/**
 * Test a codemod transform against input/output fixtures
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

  // Normalize both outputs through Biome to ensure consistent formatting
  return {
    actual: normalizeWithBiome(actualOutput),
    expected: normalizeWithBiome(expectedOutput),
  }
}
