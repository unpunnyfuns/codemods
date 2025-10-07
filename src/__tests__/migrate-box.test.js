import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('migrate-box', () => {
  it('migrates Box to View with StyleSheet styles', () => {
    const transformPath = resolve(__dirname, '../migrate-box.js')
    const { actual, expected } = testTransform(transformPath, 'migrate-box', 'tsx')

    expect(actual).toBe(expected)
  })
})
