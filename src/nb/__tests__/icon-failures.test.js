import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/icon safe failure handling', () => {
  it('migrates Icon but drops spread attributes with warning', () => {
    const input = `
import { Icon } from 'native-base'

export function Example() {
  const iconProps = { color: 'red.500', testID: 'test' }
  return <Icon name="Star" width={5} height={5} {...iconProps} />
}
`
    const output = testTransform('nb/icon', null, 'tsx', {
      ...DEFAULT_TEST_OPTIONS,
      sourceImport: 'native-base',
      sourceInput: input,
    })

    // Should migrate the Icon
    expect(output).toContain('<Icon')
    expect(output).toContain('name="Star"')
    expect(output).toContain('width={5}')
    expect(output).toContain('height={5}')
    expect(output).toContain("from '@target/components/TestComponent'")

    // Should drop the spread attribute
    expect(output).not.toContain('...iconProps')

    // Should add default color
    expect(output).toContain('color=')
  })

  it('migrates Icon with multiple spreads, drops all spreads', () => {
    const input = `
import { Icon } from 'native-base'

export function Example() {
  const props1 = { testID: 'test1' }
  const props2 = { color: 'blue.500' }
  return <Icon name="Heart" width={5} height={5} {...props1} {...props2} />
}
`
    const output = testTransform('nb/icon', null, 'tsx', {
      ...DEFAULT_TEST_OPTIONS,
      sourceImport: 'native-base',
      sourceInput: input,
    })

    // Should migrate the Icon
    expect(output).toContain('<Icon')
    expect(output).toContain('name="Heart"')
    expect(output).toContain("from '@target/components/TestComponent'")

    // Should drop both spread attributes
    expect(output).not.toContain('...props1')
    expect(output).not.toContain('...props2')

    // Should add default color
    expect(output).toContain('color=')
  })

  it('successfully migrates Icon without spread props', () => {
    const input = `
import { Icon } from 'native-base'

export function Example() {
  return <Icon name="Check" width={5} height={5} color="green.500" testID="check-icon" />
}
`
    const output = testTransform('nb/icon', null, 'tsx', {
      ...DEFAULT_TEST_OPTIONS,
      sourceImport: 'native-base',
      sourceInput: input,
    })

    // Should migrate successfully
    expect(output).toContain('<Icon')
    expect(output).toContain('name="Check"')
    expect(output).toContain('width={5}')
    expect(output).toContain('height={5}')
    expect(output).toContain('testID="check-icon"')
    expect(output).toContain("from '@target/components/TestComponent'")
  })
})
