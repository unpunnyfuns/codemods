import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/switch', () => {
  it('migrates Switch to target with children wrapping and prop transformations', () => {
    const output = testTransform('nb/switch', 'nb/switch', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Switch',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Element kept as Switch
    expect(output).toContain('<Switch')

    // Import source changed - Switch from target
    expect(output).toMatch(/import \{[^}]*Switch[^}]*\} from '@target\/components\/Switch'/)
    // Typography still imported from @source (not transformed by switch codemod)
    expect(output).toContain("from '@source/components'")

    // isChecked transformed to value
    expect(output).toContain('value={true}')
    expect(output).toContain('value={false}')
    expect(output).not.toMatch(/isChecked=/)

    // onToggle transformed to onValueChange with specific handler
    expect(output).toContain('onValueChange={(val) => console.log(val)}')
    expect(output).not.toMatch(/onToggle=/)

    // isDisabled transformed to disabled
    expect(output).toContain('disabled')
    expect(output).not.toMatch(/isDisabled/)

    // Children wrapped in Switch.Label compound component
    expect(output).toContain('<Switch.Label>')
    expect(output).toContain('Main label')

    // label prop becomes Switch.Description
    expect(output).toContain('<Switch.Description>')
    expect(output).toContain('Additional info')

    // Direct props preserved
    expect(output).toContain('testID="switch1"')
  })
})
