import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('box migration', () => {
  it('migrates Box to View with StyleSheet styles', () => {
    const output = testTransform('nb/box', 'nb/box', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
