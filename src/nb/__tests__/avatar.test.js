import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/avatar', () => {
  it('migrates Avatar to target with icon/image object transformations', () => {
    const output = testTransform('nb/avatar', 'nb/avatar', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Avatar',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Element kept as Avatar
    expect(output).toContain('<Avatar')

    // Avatar import stays at @source since avatar.js doesn't redirect imports
    // (redirecting imports would require the redirect-imports transform)
    expect(output).toContain("from '@source/components'")

    // iconName transformed to icon object with specific value
    expect(output).toMatch(/icon=\{/)
    expect(output).toContain('name: "user"')
    expect(output).not.toContain('iconName=')

    // imageUri/imageSource transformed to image object
    expect(output).toMatch(/image=\{/)
    expect(output).toContain('source:')

    // Size prop preserved with specific values
    expect(output).toContain('size="md"')
    expect(output).toContain('size="lg"')
    expect(output).toContain('size="sm"')

    // letters not transformed (not supported)
    expect(output).toContain('letters="AB"')

    // Style props extracted
    expect(output).toContain('StyleSheet.create')
  })
})
