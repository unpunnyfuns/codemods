import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { testTransform } from './test-helper.js'

describe('migrate-pressable', () => {
  it('migrates Pressable to React Native with StyleSheet and default accessibilityRole', () => {
    const transformPath = resolve(__dirname, '../migrate-pressable.js')
    const { actual, expected } = testTransform(transformPath, 'migrate-pressable', 'js')

    expect(actual).toBe(expected)
  })
})
