import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('nb/stack-comprehensive', () => {
  it('handles all edge cases: multi-property expansion, tokens, flexbox, position', () => {
    const output = testTransform('nb/stack', 'nb/stack-comprehensive', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
