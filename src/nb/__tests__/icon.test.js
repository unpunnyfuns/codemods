import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/icon', () => {
  it('migrates Icon component', () => {
    const output = testTransform('nb/icon', 'nb/icon', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Icon',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Element kept as Icon
    expect(output).toContain('<Icon')

    // Import source changed - Icon from target
    expect(output).toMatch(/import \{[^}]*Icon[^}]*\} from '@target\/components\/Icon'/)
    expect(output).not.toContain("from '@source/components'")

    // name prop preserved
    expect(output).toContain('name="CheckCircleSolid"')
    expect(output).toContain('name="ArrowRight"')

    // width/height token "4" converted to 16px
    expect(output).toContain('width={16}')
    expect(output).toContain('height={16}')

    // color mapped - blue.500 → core.blue.HB5
    expect(output).toMatch(/color=['"]core\.blue\.HB5['"]/)
    expect(output).not.toMatch(/color=['"]blue\.500['"]/)
    // Other colors preserved or mapped
    expect(output).toMatch(/color=['"]icon\.primary['"]/)
    expect(output).toMatch(/color=['"]icon\.secondary['"]/)
    expect(output).toMatch(/color=['"]text\.primary['"]/)
    // red.500 not mapped (unmapped NB color stays as-is)
    expect(output).toMatch(/color=['"]red\.500['"]/)
    expect(output).not.toContain('color="blue.500"')

    // Direct props preserved
    expect(output).toContain('testID="arrow-icon"')
  })
})
