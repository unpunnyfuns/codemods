import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/stack-comprehensive', () => {
  it('handles all edge cases: multi-property expansion, tokens, flexbox, position', () => {
    const output = testTransform('nb/stack', 'nb/stack-comprehensive', 'tsx', {
      // Don't override sourceImport - use default 'native-base' from stack.js config
      targetImport: '@target/components/Stack',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Elements migrated
    expect(output).toContain('<Stack')
    expect(output).not.toContain('<VStack')
    expect(output).not.toContain('<HStack')

    // Import source changed
    expect(output).toContain("from '@target/components/Stack'")
    expect(output).not.toContain("from 'native-base'")

    // Direction prop added
    expect(output).toContain("direction='horizontal'")
    expect(output).toContain("direction='vertical'")

    // Multi-property expansion (roundedTop -> borderTopLeftRadius + borderTopRightRadius)
    expect(output).toContain('borderTopLeftRadius:')
    expect(output).toContain('borderTopRightRadius:')
    expect(output).toContain('borderBottomLeftRadius:')
    expect(output).toContain('borderBottomRightRadius:')

    // marginX/marginY expansion
    expect(output).toContain('marginHorizontal:')
    expect(output).toContain('marginVertical:')

    // Flexbox props
    expect(output).toContain('flex:')
    expect(output).toContain('flexGrow:')
    expect(output).toContain('flexShrink:')
    expect(output).toContain('flexWrap:')
    expect(output).toContain('alignSelf:')

    // Position props
    expect(output).toContain('position:')
    expect(output).toContain('top:')
    expect(output).toContain('left:')
    expect(output).toContain('zIndex:')

    // StyleSheet created
    expect(output).toContain('StyleSheet.create')
  })
})
