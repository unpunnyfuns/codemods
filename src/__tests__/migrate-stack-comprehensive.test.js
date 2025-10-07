import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('migrate-stack-comprehensive', () => {
  it('handles all edge cases: multi-property expansion, tokens, flexbox, position', () => {
    const transformPath = '../migrate-stack.js'
    const { actual, expected } = testTransform(transformPath, 'migrate-stack-comprehensive', 'tsx')

    expect(actual).toBe(expected)
  })
})
