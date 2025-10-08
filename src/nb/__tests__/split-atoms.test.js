import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('nb/split-atoms', () => {
  it('splits barrel imports into individual atom imports', () => {
    const output = testTransform('nb/split-atoms', 'nb/split-atoms', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
