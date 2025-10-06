import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/input', () => {
  it('migrates Input component', () => {
    // Don't override sourceImport - use default 'native-base' from input.js config
    const output = testTransform('nb/input', 'nb/input', 'tsx', {
      targetImport: '@target/components/Input',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Element kept as Input
    expect(output).toContain('<Input')

    // Import source changed - Input from target
    expect(output).toMatch(/import \{[^}]*Input[^}]*\} from '@target\/components\/Input'/)
    expect(output).not.toContain("from 'native-base'")

    // placeholder transformed to label with specific values
    expect(output).toContain('label="Enter name"')
    expect(output).toContain('label="Email address"')
    expect(output).not.toContain('placeholder=')

    // onChangeText transformed to onChange
    expect(output).toContain('onChange={setName}')
    expect(output).toContain('onChange={setEmail}')
    expect(output).not.toMatch(/onChangeText=/)

    // value preserved with specific values
    expect(output).toContain('value={name}')
    expect(output).toContain('value={email}')

    // keyboardType preserved
    expect(output).toContain('keyboardType="email-address"')

    // Direct props preserved
    expect(output).toContain('testID="password-input"')
  })
})
