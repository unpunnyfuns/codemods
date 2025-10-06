import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('migrate-stack', () => {
  it('migrates HStack to Stack with full prop mapping', () => {
    const transformPath = resolve(__dirname, '../migrate-stack.js')
    const { actual, expected } = testTransform(transformPath, 'migrate-stack', 'tsx')

    expect(actual).toBe(expected)
  })
})
