import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('migrate-nb-component', () => {
  it('migrates NativeBase component props to StyleSheet styles', () => {
    const transformPath = resolve(__dirname, '../migrate-nb-component.js')
    const { actual, expected } = testTransform(transformPath, 'migrate-nb-component', 'tsx')

    expect(actual).toBe(expected)
  })
})
