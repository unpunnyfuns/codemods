import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('nb/button', () => {
  it('migrates Button with leftIcon and children to nordlys Button', () => {
    const output = testTransform('nb/button', 'nb/button', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
