import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/stack-comprehensive', () => {
  it('handles all edge cases: multi-property expansion, tokens, flexbox, position', () => {
    const output = testTransform('nb/stack', 'nb/stack-comprehensive', 'tsx', {
      // Don't override sourceImport - use default 'native-base' from stack.js config
      targetImport: '@target/components/Stack',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })
    expect(output).toMatchSnapshot()
  })
})
