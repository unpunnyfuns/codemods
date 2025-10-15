import { describe, expect, it } from 'vitest'
import { testTransform } from '../../__tests__/test-helper.js'

describe('box migration', () => {
  it('migrates Box to View with StyleSheet styles', () => {
    const output = testTransform('nb/box', 'nb/box', 'tsx')
    expect(output).toMatchSnapshot()
  })

  it('does not process local components that use Box in JSX', () => {
    const output = testTransform('nb/box', 'nb/box-local-component', 'tsx')
    expect(output).toMatchSnapshot()
  })

  it('adds View import when some elements are migrated and some are skipped', () => {
    const output = testTransform('nb/box', 'nb/box-partial-migration', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
