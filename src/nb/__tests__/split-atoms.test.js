import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('nb/split-atoms', () => {
  it('splits barrel imports into individual atom imports', () => {
    const output = testTransform('nb/split-atoms', 'nb/split-atoms', 'tsx', {
      barrelImport: '@source/common/src/components',
      atomPrefix: '@source/common/src/components/',
    })

    // Barrel import split into individual imports
    expect(output).not.toMatch(
      /{ Box, Button as Btn, Typography }.*from '@source\/common\/src\/components'/,
    )

    // Individual atom imports created
    expect(output).toMatch(/@source\/common\/src\/components\/Box/)
    expect(output).toMatch(/@source\/common\/src\/components\/Button/)
    expect(output).toMatch(/@source\/common\/src\/components\/Typography/)

    // Type import handled correctly
    expect(output).toMatch(/import type.*ButtonProps/)

    // Alias preserved
    expect(output).toMatch(/Button as Btn/)

    // Non-barrel imports preserved
    expect(output).toContain("from '@source/common/src/other'")

    // JSX still works
    expect(output).toContain('<Box>')
    expect(output).toContain('<Btn>')
    expect(output).toContain('<Typography>')
  })
})
