import { describe, expect, it } from 'vitest'
import { testTransform } from '../test-helper.js'

describe('migrations/button', () => {
  it('migrates Button with leftIcon and children to nordlys Button', () => {
    const output = testTransform('migrations/button', 'migrations/button', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
