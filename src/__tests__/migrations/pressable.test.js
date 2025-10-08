import { describe, expect, it } from 'vitest'
import { testTransform } from '../test-helper.js'

describe('migrations/pressable', () => {
  it('migrates Pressable to React Native with StyleSheet and default accessibilityRole', () => {
    const output = testTransform('migrations/pressable', 'migrations/pressable', 'js')
    expect(output).toMatchSnapshot()
  })
})
