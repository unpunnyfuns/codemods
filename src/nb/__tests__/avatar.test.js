import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('nb/avatar', () => {
  it('migrates Avatar to Nordlys with icon/image object transformations', () => {
    const output = testTransform('nb/avatar', 'nb/avatar', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
