import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('split-atoms', () => {
  it('splits barrel imports into individual atom imports', () => {
    const transformPath = resolve(__dirname, '../split-atoms.js')
    const { actual, expected } = testTransform(transformPath, 'split-atoms', 'tsx')

    expect(actual).toBe(expected)
  })
})
