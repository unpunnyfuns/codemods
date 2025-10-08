import { describe, expect, it } from 'vitest'
import { testTransform } from '../test-helper.js'

describe('migrations/switch', () => {
  it('migrates Switch to Nordlys with children wrapping and prop transformations', () => {
    const output = testTransform('migrations/switch', 'migrations/switch', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
