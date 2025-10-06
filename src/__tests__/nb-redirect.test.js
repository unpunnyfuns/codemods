import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('nb-redirect', () => {
  it('redirects native-base imports to the shim', () => {
    const transformPath = resolve(__dirname, '../nb-redirect.js')
    const { actual, expected } = testTransform(transformPath, 'nb-redirect', 'tsx')

    expect(actual).toBe(expected)
  })
})
