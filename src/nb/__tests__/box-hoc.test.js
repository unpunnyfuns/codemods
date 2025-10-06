import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('box HOC migration', () => {
  it('migrates HOC-wrapped Box (Animated.createAnimatedComponent)', () => {
    const output = testTransform('nb/box', 'nb/box-hoc', 'tsx', {
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Direct Box migrated to View
    expect(output).toContain('<View')
    expect(output).not.toMatch(/<Box[^>]*>/)

    // Import source changed - View from react-native
    expect(output).toMatch(/import \{[^}]*View[^}]*\} from 'react-native'/)
    expect(output).not.toContain("from 'native-base'")

    // AnimatedBox HOC wrapper updated to use View
    expect(output).toContain('Animated.createAnimatedComponent(View)')
    expect(output).not.toContain('Animated.createAnimatedComponent(Box)')

    // Styles extracted
    expect(output).toMatch(/style=\{styles\.\w+\}/)
    expect(output).toContain('StyleSheet.create')
  })
})
