import { describe, expect, it } from 'vitest'
import { testTransform } from '../test-helper.js'

describe('box migration', () => {
  it('migrates Box to View with StyleSheet styles', () => {
    const output = testTransform('migrations/box', 'migrations/box', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
