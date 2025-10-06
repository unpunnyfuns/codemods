import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/typography', () => {
  it('migrates Typography with spacing props to wrapped version', () => {
    const output = testTransform('nb/typography', 'nb/typography', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Typography',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })
    expect(output).toMatchSnapshot()
  })
})
