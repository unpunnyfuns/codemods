import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('nb/input', () => {
  it('migrates Input component', () => {
    const output = testTransform('nb/input', 'nb/input', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
