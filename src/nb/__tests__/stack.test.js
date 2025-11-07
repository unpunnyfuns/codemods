import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/stack', () => {
  it('migrates HStack to Stack with full prop mapping', () => {
    const output = testTransform('nb/stack', 'nb/stack', 'tsx', {
      // Don't override sourceImport - use default 'native-base' from stack.js config
      targetImport: '@target/components/Stack',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })
    expect(output).toMatchSnapshot()
  })
})
