import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { testTransform } from './test-helper.js'

describe('migrate-switch', () => {
  it('migrates Switch to Nordlys with children wrapping and prop transformations', () => {
    const transformPath = resolve(__dirname, '../migrate-switch.js')
    const { actual, expected } = testTransform(transformPath, 'migrate-switch', 'tsx')

    expect(actual).toBe(expected)
  })
})
