import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('nb/stack', () => {
  it('migrates HStack to Stack with full prop mapping', () => {
    const output = testTransform('nb/stack', 'nb/stack', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
