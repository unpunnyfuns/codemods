import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/button', () => {
  it('migrates Button with leftIcon and children to nordlys Button', () => {
    const output = testTransform('nb/button', 'nb/button', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Button',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })
    expect(output).toMatchSnapshot()
  })
})
