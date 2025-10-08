import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('migrate-box', () => {
  it('migrates Box to View with StyleSheet styles', () => {
    const output = testTransform('migrate-box', 'migrate-box', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
