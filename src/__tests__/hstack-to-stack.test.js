import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('hstack-to-stack', () => {
  it('converts HStack to Stack with direction="row" when no props exist', () => {
    const transformPath = resolve(__dirname, '../hstack-to-stack.js')
    const { actual, expected } = testTransform(transformPath, 'hstack-to-stack', 'tsx')

    expect(actual).toBe(expected)
  })
})
