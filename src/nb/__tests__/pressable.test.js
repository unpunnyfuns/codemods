import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/pressable', () => {
  it('migrates Pressable to React Native with StyleSheet and default accessibilityRole', () => {
    const output = testTransform('nb/pressable', 'nb/pressable', 'js', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })
    expect(output).toMatchSnapshot()
  })
})
