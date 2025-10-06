import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('remove-unused', () => {
  it('removes unused imports', () => {
    const output = testTransform('remove-unused', 'remove-unused/unused-imports', 'tsx')

    // Text is used in JSX
    expect(output).toContain("import { Text } from 'native-base'")

    // useState and useEffect are used
    expect(output).toContain('useState')
    expect(output).toContain('useEffect')

    // The codemod preserves underscore-prefixed bindings in destructuring
    // (they're part of the pattern, not standalone variables)
    expect(output).toContain('[count, _setCount]')
  })

  it('removes unused variables', () => {
    const output = testTransform('remove-unused', 'remove-unused/unused-variables', 'tsx')

    // Used variables preserved
    expect(output).toContain('const result = 42')
    expect(output).toContain('const temp = 100')

    // Underscore-prefixed standalone unused variables removed
    expect(output).not.toContain("const _unused = 'never used'")
    expect(output).not.toContain('const _alsoUnused = false')

    // In multipleDeclarations, a and c used
    expect(output).toContain('const a = 1')
    expect(output).toContain('c = 3')
  })

  it('removes both imports and variables', () => {
    const output = testTransform('remove-unused', 'remove-unused/mixed', 'tsx')

    // Used imports preserved
    expect(output).toContain("import { Text } from 'native-base'")
    expect(output).toContain('useState')

    // Used variables preserved
    expect(output).toContain('config')

    // Standalone unused variable removed
    expect(output).not.toContain("const _temp = 'unused'")
  })

  it('preserves used identifiers', () => {
    const output = testTransform('remove-unused', 'remove-unused/all-used', 'tsx')

    // All imports preserved (all used)
    expect(output).toContain("import { Button, Text } from 'native-base'")
    expect(output).toContain('useState')

    // All variables preserved (all used)
    expect(output).toContain('count')
    expect(output).toContain('setCount')
    expect(output).toContain('doubled')
  })

  it('preserves StyleSheet styles variable', () => {
    const output = testTransform('remove-unused', 'remove-unused/styles', 'tsx')

    // StyleSheet and View imports preserved
    expect(output).toContain("import { StyleSheet, View } from 'react-native'")

    // styles variable preserved (even though it looks unused to naive analysis)
    expect(output).toContain('const styles = StyleSheet.create')
    expect(output).toContain('styles.container')
  })

  it('preserves types used in generics', () => {
    const output = testTransform('remove-unused', 'remove-unused/generics', 'tsx')

    // Types used in generics preserved
    expect(output).toContain('PhoneNumberFormValues')
    expect(output).toContain('Screens')

    // useForm and useRoute preserved
    expect(output).toContain('useForm')
    expect(output).toContain('useRoute')
  })

  it('preserves advanced TypeScript type usage', () => {
    const output = testTransform('remove-unused', 'remove-unused/typescript-advanced', 'tsx')

    // Types used in type annotations preserved
    expect(output).toContain('EncryptionDetailsResponseProps')
    expect(output).toContain('SharedValue')
    expect(output).toContain('RootStack')
    expect(output).toContain('PreventSecondApplicationSheetProps')

    // The codemod removes types only used in underscore-prefixed variables
    // (Screens used in _screenName, OnboardingFlowContextState used in _context)
  })

  it('preserves types in type literals', () => {
    const output = testTransform('remove-unused', 'remove-unused/type-literal', 'tsx')

    // Type used in type literal preserved
    expect(output).toContain('PreventSecondApplicationSheetProps')

    // The type is used in it.each generic
    expect(output).toContain('it.each')
    expect(output).toContain("variant: PreventSecondApplicationSheetProps['variant']")
  })
})
