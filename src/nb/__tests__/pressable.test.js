import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('nb/pressable', () => {
  it('migrates Pressable to React Native with StyleSheet and default accessibilityRole', () => {
    const output = testTransform('nb/pressable', 'nb/pressable', 'js')
    expect(output).toMatchSnapshot()
  })
})
