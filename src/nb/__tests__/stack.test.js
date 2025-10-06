import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/stack', () => {
  it('migrates HStack to Stack with full prop mapping', () => {
    const output = testTransform('nb/stack', 'nb/stack', 'tsx', {
      // Don't override sourceImport - use default 'native-base' from stack.js config
      targetImport: '@target/components/Stack',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Element changed from HStack to Stack
    expect(output).toContain('<Stack')
    expect(output).not.toContain('<HStack')

    // Import source changed - Stack from target
    expect(output).toMatch(/import \{[^}]*Stack[^}]*\} from '@target\/components\/Stack'/)
    expect(output).not.toContain("from 'native-base'")

    // Direction prop added (HStack -> direction="horizontal")
    expect(output).toMatch(/direction=['"]horizontal['"]/)

    // Spacing prop mapped (space -> gap) with specific value
    expect(output).toContain('gap={2}')
    expect(output).not.toContain('space=')

    // Alignment props extracted to styles
    expect(output).toContain('alignItems:')
    expect(output).toContain('justifyContent:')

    // Direct props preserved
    expect(output).toContain('testID="test-stack"')

    // Styles extracted for spacing props
    expect(output).toMatch(/style=\{styles\.\w+\}/)
    expect(output).toContain('StyleSheet.create')

    // Token helpers used for border radius
    expect(output).toMatch(/radius\.\w+/)
  })

  it('preserves key prop on Stack components in lists', () => {
    const output = testTransform('nb/stack', 'nb/stack-key-prop', 'tsx', {
      targetImport: '@target/components/Stack',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Elements migrated
    expect(output).toContain('<Stack')
    expect(output).not.toContain('<VStack')
    expect(output).not.toContain('<HStack')

    // Key props preserved
    expect(output).toMatch(/key=\{item\}/)
    expect(output).toMatch(/key=\{`h-\$\{item\}`\}/)

    // Direction prop added for both orientations
    expect(output).toContain("direction='horizontal'")
    expect(output).toContain("direction='vertical'")
  })
})
