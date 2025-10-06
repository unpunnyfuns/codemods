import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/button', () => {
  it('migrates Button with leftIcon and children to target Button', () => {
    const output = testTransform('nb/button', 'nb/button', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Button',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Element migrated (Button stays as Button but from different import)
    expect(output).toContain('<Button')

    // Import source changed - Button from target
    expect(output).toMatch(/import \{[^}]*Button[^}]*\} from '@target\/components\/Button'/)
    expect(output).not.toContain("from '@source/components'")

    // leftIcon transformed to icon prop (leftIcon dropped, icon extracted)
    expect(output).toMatch(/icon=\{?['"]PlusOutlined['"]\}?/)
    // leftIcon removed from JSX (only appears in dropped comment)
    expect(output).not.toMatch(/<Button[^>]*leftIcon=/)

    // Children extracted to text prop with specific values
    expect(output).toContain("text={t('addNew')}")
    expect(output).toMatch(/text=\{?['"]Simple text['"]\}?/)
    expect(output).toContain('text={text}')

    // Variant and size preserved with specific values
    expect(output).toMatch(/variant=['"]secondary['"]/)
    expect(output).toMatch(/variant=['"]primary['"]/)
    expect(output).toMatch(/size=\{?["']?md["']?\}?/)
    expect(output).toMatch(/size=\{?["']?lg["']?\}?/)

    // isDisabled stays as isDisabled (this codemod doesn't transform it)
    expect(output).toContain('isDisabled')

    // Direct props preserved
    expect(output).toMatch(/testID=['"]button1['"]/)
    expect(output).toContain('onPress={() => {}}')

    // Spacing prop extracted to style with View wrapper
    expect(output).toMatch(/style=\{styles\.\w+\}/)
    expect(output).toContain('marginTop:')
    expect(output).toContain('space.xl')
  })
})
