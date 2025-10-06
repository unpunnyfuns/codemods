import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('box migration', () => {
  it('migrates Box to View with StyleSheet styles', () => {
    const output = testTransform('nb/box', 'nb/box', 'tsx', {
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })
    expect(output).toMatchSnapshot()
  })

  it('does not process local components that use Box in JSX', () => {
    const output = testTransform('nb/box', 'nb/box-local-component', 'tsx', {
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })
    expect(output).toMatchSnapshot()
  })

  it('adds View import when some elements are migrated and some are skipped', () => {
    const output = testTransform('nb/box', 'nb/box-partial-migration', 'tsx', {
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })
    expect(output).toMatchSnapshot()
  })

  it('handles variant borderRadius and disableTopRounding/disableBottomRounding props', () => {
    const output = testTransform('nb/box', 'nb/box-variant', 'tsx', {
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })
    expect(output).toMatchSnapshot()
  })
})
