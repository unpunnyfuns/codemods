import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('migrate-button', () => {
  it('migrates Button with leftIcon and children to nordlys Button', () => {
    const output = testTransform('migrate-button', 'migrate-button', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
