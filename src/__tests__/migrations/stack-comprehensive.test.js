import { describe, expect, it } from 'vitest'
import { testTransform } from '../test-helper.js'

describe('migrations/stack-comprehensive', () => {
  it('handles all edge cases: multi-property expansion, tokens, flexbox, position', () => {
    const output = testTransform('migrations/stack', 'migrations/stack-comprehensive', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
