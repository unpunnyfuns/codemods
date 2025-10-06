import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/alert', () => {
  it('migrates Alert component', () => {
    const output = testTransform('nb/alert', 'nb/alert', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Alert',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })
    expect(output).toMatchSnapshot()
  })
})
