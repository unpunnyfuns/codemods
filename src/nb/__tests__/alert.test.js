import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('nb/alert', () => {
  it('migrates Alert component', () => {
    const output = testTransform('nb/alert', 'nb/alert', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
