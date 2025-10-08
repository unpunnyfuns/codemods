import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('migrate-stack', () => {
  it('migrates HStack to Stack with full prop mapping', () => {
    const output = testTransform('migrate-stack', 'migrate-stack', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
