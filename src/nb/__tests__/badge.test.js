import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('nb/badge', () => {
  it('migrates Badge component', () => {
    const output = testTransform('nb/badge', 'nb/badge', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
