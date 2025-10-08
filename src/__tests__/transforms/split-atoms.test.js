import { describe, expect, it } from 'vitest'
import { testTransform } from '../test-helper.js'

describe('transforms/split-atoms', () => {
  it('splits barrel imports into individual atom imports', () => {
    const output = testTransform('transforms/split-atoms', 'transforms/split-atoms', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
