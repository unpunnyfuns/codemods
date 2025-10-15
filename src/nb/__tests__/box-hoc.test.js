import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('box HOC migration', () => {
  it('migrates HOC-wrapped Box (Animated.createAnimatedComponent)', () => {
    const output = testTransform('nb/box', 'nb/box-hoc', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
