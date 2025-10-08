import { describe, expect, it } from 'vitest'
import { testTransform } from '../test-helper.js'

describe('migrations/avatar', () => {
  it('migrates Avatar to Nordlys with icon/image object transformations', () => {
    const output = testTransform('migrations/avatar', 'migrations/avatar', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
