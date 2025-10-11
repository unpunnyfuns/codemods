import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('nb/icon', () => {
  it('migrates Icon component', () => {
    const output = testTransform('nb/icon', 'nb/icon', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
