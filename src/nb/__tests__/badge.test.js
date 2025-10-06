import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/badge', () => {
  it('migrates Badge component', () => {
    // Don't override sourceImport - use default 'native-base' from badge.js config
    const output = testTransform('nb/badge', 'nb/badge', 'tsx', {
      targetImport: '@target/components/Badge',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Element kept as Badge
    expect(output).toContain('<Badge')

    // Import source changed - Badge from target
    expect(output).toMatch(/import \{[^}]*Badge[^}]*\} from '@target\/components\/Badge'/)
    expect(output).not.toContain("from 'native-base'")

    // Children extracted to text prop with specific values
    expect(output).toMatch(/text=['"]New['"]/)
    expect(output).toMatch(/text=['"]Success['"]/)
    expect(output).toMatch(/text=['"]Large['"]/)
    expect(output).toMatch(/text=['"]Active['"]/)
    expect(output).toContain('text={count}')

    // colorScheme mapped to state
    expect(output).toMatch(/state=['"]success['"]/)
    expect(output).not.toContain('colorScheme=')

    // Indicator dot (rounded+no text) becomes styled View, not Badge
    expect(output).toContain('backgroundColor: color.icon.brand')

    // Direct props preserved
    expect(output).toMatch(/testID=['"]status-badge['"]/)
  })
})
