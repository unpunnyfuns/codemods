import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { testTransform } from './test-helper.js'

describe('migrate-avatar', () => {
  it('migrates Avatar to Nordlys with icon/image object transformations', () => {
    const transformPath = resolve(__dirname, '../migrate-avatar.js')
    const { actual, expected } = testTransform(transformPath, 'migrate-avatar', 'tsx')

    expect(actual).toBe(expected)
  })
})
