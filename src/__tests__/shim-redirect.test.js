import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('shim-redirect', () => {
  it('redirects @org/common/src/components imports to native-base shim', () => {
    const transformPath = resolve(__dirname, '../shim-redirect.js')
    const { actual, expected } = testTransform(transformPath, 'shim-redirect')

    expect(actual).toBe(expected)
  })
})
