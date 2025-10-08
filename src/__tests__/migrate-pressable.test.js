import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('migrate-pressable', () => {
  it('migrates Pressable to React Native with StyleSheet and default accessibilityRole', () => {
    const output = testTransform('migrate-pressable', 'migrate-pressable', 'js')
    expect(output).toMatchSnapshot()
  })
})
