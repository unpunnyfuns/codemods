import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('migrate-avatar', () => {
  it('migrates Avatar to Nordlys with icon/image object transformations', () => {
    const output = testTransform('migrate-avatar', 'migrate-avatar', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
