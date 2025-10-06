import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/pressable', () => {
  it('migrates Pressable to React Native with StyleSheet and default accessibilityRole', () => {
    const output = testTransform('nb/pressable', 'nb/pressable', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Element kept as Pressable
    expect(output).toContain('<Pressable')

    // Import source changed - Pressable from react-native
    expect(output).toMatch(/import \{[^}]*Pressable[^}]*\} from 'react-native'/)
    expect(output).not.toContain("from '@source/components'")

    // Style props extracted to StyleSheet
    expect(output).toMatch(/style=\{styles\.\w+\}/)
    expect(output).toContain('StyleSheet.create')

    // Pseudo props dropped
    expect(output).not.toMatch(/_hover=/)
    expect(output).not.toMatch(/_pressed=/)

    // accessibilityRole added (or preserved if already exists)
    expect(output).toContain('accessibilityRole=')

    // onPress preserved
    expect(output).toContain('onPress=')
  })
})
