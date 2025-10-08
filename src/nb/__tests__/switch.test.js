import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('nb/switch', () => {
  it('migrates Switch to Nordlys with children wrapping and prop transformations', () => {
    const output = testTransform('nb/switch', 'nb/switch', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
