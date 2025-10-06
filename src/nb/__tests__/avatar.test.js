import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/avatar', () => {
  it('migrates Avatar to Nordlys with icon/image object transformations', () => {
    const output = testTransform('nb/avatar', 'nb/avatar', 'tsx', {
      sourceImport: DEFAULT_TEST_OPTIONS.sourceImport,
      targetImport: '@target/components/Avatar',
      tokenImport: DEFAULT_TEST_OPTIONS.tokenImport,
    })
    expect(output).toMatchSnapshot()
  })
})
