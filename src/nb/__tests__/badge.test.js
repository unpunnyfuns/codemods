import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/badge', () => {
  it('migrates Badge component', () => {
    const output = testTransform('nb/badge', 'nb/badge', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Badge',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })
    expect(output).toMatchSnapshot()
  })
})
