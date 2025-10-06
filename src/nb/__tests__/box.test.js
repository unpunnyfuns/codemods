import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('box migration', () => {
  it('migrates Box to View with StyleSheet styles', () => {
    const output = testTransform('nb/box', 'nb/box', 'tsx', {
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Element changed
    expect(output).toContain('<View')
    expect(output).not.toContain('<Box')

    // Imports updated - View and StyleSheet both from react-native
    expect(output).toMatch(/import \{[^}]*View[^}]*\} from 'react-native'/)
    expect(output).toMatch(/import \{[^}]*StyleSheet[^}]*\} from 'react-native'/)
    expect(output).not.toContain("from 'native-base'")

    // Styles extracted
    expect(output).toMatch(/style=\{styles\.\w+\}/)
    expect(output).toContain('StyleSheet.create')

    // Token imports added
    expect(output).toContain("from '@design-tokens'")

    // Prop transformations (p -> padding, bg -> backgroundColor, etc.)
    expect(output).toContain('padding:')
    expect(output).toContain('backgroundColor:')
    expect(output).toContain('borderRadius:')

    // Token helpers used
    expect(output).toMatch(/space\.\w+/)
    expect(output).toMatch(/color\./)
    expect(output).toMatch(/radius\.\w+/)
  })

  it('does not process local components that use Box in JSX', () => {
    const output = testTransform('nb/box', 'nb/box-local-component', 'tsx', {
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Native-base import still present (because HStack not migrated)
    expect(output).toContain("from 'native-base'")

    // Box elements are migrated to View
    expect(output).toContain('<View')

    // Local component Section should still exist
    expect(output).toContain('const Section')

    // HStack not migrated (different codemod)
    expect(output).toContain('<HStack')
  })

  it('adds View import when some elements are migrated and some are skipped', () => {
    const output = testTransform('nb/box', 'nb/box-partial-migration', 'tsx', {
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // Some Box elements migrated to View
    expect(output).toContain('<View')

    // Native-base import still present for skipped elements
    expect(output).toContain("from 'native-base'")
    expect(output).toContain('<Box')

    // View import added
    expect(output).toMatch(/import \{[^}]*View[^}]*\} from 'react-native'/)

    // Skipped element has TODO comment
    expect(output).toContain('TODO')
    expect(output).toContain('textAlign')
  })

  it('handles variant borderRadius and disableTopRounding/disableBottomRounding props', () => {
    const output = testTransform('nb/box', 'nb/box-variant', 'tsx', {
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })

    // All Box elements migrated to View
    expect(output).toContain('<View')
    expect(output).not.toContain('<Box')

    // Native-base import removed
    expect(output).not.toContain("from 'native-base'")

    // Border radius props transformed
    expect(output).toMatch(
      /borderRadius|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius/,
    )

    // disableTopRounding/disableBottomRounding props removed from elements (converted to styles)
    expect(output).not.toMatch(/disableTopRounding=/)
    expect(output).not.toMatch(/disableBottomRounding=/)
  })
})
