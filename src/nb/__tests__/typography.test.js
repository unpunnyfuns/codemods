import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/typography', () => {
  it('migrates Typography with spacing props to wrapped version', () => {
    const output = testTransform('nb/typography', 'nb/typography', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Typography',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Element kept as Typography
    expect(output).toContain('<Typography')

    // Import source changed
    expect(output).toContain("from '@target/components/Typography'")
    expect(output).not.toContain("from '@source/components'")

    // Type and size preserved
    expect(output).toContain('type=')
    expect(output).toContain('size=')

    // Colors mapped
    expect(output).toContain('color=')

    // Spacing props extracted to View wrapper styles
    expect(output).toContain('<View')
    expect(output).toMatch(/style=\{styles\.\w+\}/)
    expect(output).toContain('StyleSheet.create')

    // textAlign transformed to align
    expect(output).toContain('align=')
  })

  it('migrates action type and text.brand color', () => {
    const output = testTransform('nb/typography', 'nb/typography-action', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Typography',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // action type → interactive
    expect(output).toMatch(/type=['"]interactive['"]/)
    expect(output).not.toMatch(/type=['"]action['"]/)

    // text.brand → brand.primary
    expect(output).toMatch(/color=['"]brand\.primary['"]/)
    expect(output).not.toContain('text.brand')

    // textAlign → align
    expect(output).toMatch(/align=['"]center['"]/)
    expect(output).not.toMatch(/textAlign=/)
  })

  it('migrates colors in conditional expressions', () => {
    const output = testTransform('nb/typography', 'nb/typography-conditional', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Typography',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Conditional expression preserved with mapped colors
    expect(output).toMatch(/color=\{isActive \? 'brand\.primary' : 'text\.primary'\}/)

    // Original colors transformed
    expect(output).not.toContain("'text.brand'")
  })

  it('adds default type and size when missing', () => {
    const output = testTransform('nb/typography', 'nb/typography-missing-props', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Typography',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // All Typography elements have type and size
    const typographyMatches = output.match(/<Typography[^>]*>/g) || []
    expect(typographyMatches.length).toBeGreaterThan(0)

    // Each should have type and size
    for (const match of typographyMatches) {
      expect(match).toMatch(/type=/)
      expect(match).toMatch(/size=/)
    }
  })
})
