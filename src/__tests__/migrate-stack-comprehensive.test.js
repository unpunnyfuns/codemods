import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('migrate-stack-comprehensive', () => {
  it('handles all edge cases: multi-property expansion, tokens, flexbox, position', () => {
    const output = testTransform('migrate-stack', 'migrate-stack-comprehensive', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
