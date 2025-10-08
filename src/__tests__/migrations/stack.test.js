import { describe, expect, it } from 'vitest'
import { testTransform } from '../test-helper.js'

describe('migrations/stack', () => {
  it('migrates HStack to Stack with full prop mapping', () => {
    const output = testTransform('migrations/stack', 'migrations/stack', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
