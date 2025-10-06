import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/split-atoms', () => {
  it('splits barrel imports into individual atom imports', () => {
    const output = testTransform('nb/split-atoms', 'nb/split-atoms', 'tsx', {
      barrelImport: DEFAULT_TEST_OPTIONS.barrelImport,
      atomPrefix: DEFAULT_TEST_OPTIONS.atomPrefix,
    })
    expect(output).toMatchSnapshot()
  })
})
