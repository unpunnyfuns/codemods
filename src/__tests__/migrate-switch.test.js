import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('migrate-switch', () => {
  it('migrates Switch to Nordlys with children wrapping and prop transformations', () => {
    const output = testTransform('migrate-switch', 'migrate-switch', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
