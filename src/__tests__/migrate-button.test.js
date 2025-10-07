import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { testTransform } from './test-helper.js'

describe('migrate-button', () => {
  it('migrates Button with leftIcon and children to nordlys Button', () => {
    const transformPath = resolve(__dirname, '../migrate-button.js')
    const { actual, expected } = testTransform(transformPath, 'migrate-button', 'tsx')

    expect(actual).toBe(expected)
  })
})
