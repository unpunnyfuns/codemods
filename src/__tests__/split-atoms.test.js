import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('split-atoms', () => {
  it('splits barrel imports into individual atom imports', () => {
    const output = testTransform('split-atoms', 'split-atoms', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
