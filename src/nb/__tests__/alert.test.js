import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/alert', () => {
  it('migrates Alert component', () => {
    // Don't override sourceImport - use default 'native-base' from alert.js config
    const output = testTransform('nb/alert', 'nb/alert', 'tsx', {
      targetImport: '@target/components/Alert',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Element kept as Alert
    expect(output).toContain('<Alert')

    // Import source changed - Alert from target
    expect(output).toMatch(/import \{[^}]*Alert[^}]*\} from '@target\/components\/Alert'/)
    expect(output).not.toContain("from 'native-base'")

    // Compound components (Alert.Title, Alert.Description) transformed to props
    expect(output).toMatch(/title=['"]Success['"]/)
    expect(output).toMatch(/title=['"]Error['"]/)
    expect(output).toMatch(/description=['"]Your changes have been saved['"]/)
    expect(output).toContain('description={errorMessage}')
    expect(output).not.toContain('<Alert.Title')
    expect(output).not.toContain('<Alert.Description')
    expect(output).not.toContain('<Alert.Icon')

    // Status prop preserved with specific values
    expect(output).toContain('status="success"')
    expect(output).toContain('status="error"')
    expect(output).toContain('status="warning"')

    // Direct props preserved
    expect(output).toContain('testID="info-alert"')

    // Layout props extracted to wrapper
    expect(output).toMatch(/style=\{styles\.\w+\}/)
    expect(output).toContain('StyleSheet.create')
  })
})
