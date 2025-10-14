import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('remove-unused', () => {
  it('removes unused imports', () => {
    const output = testTransform('remove-unused', 'remove-unused/unused-imports', 'tsx')
    expect(output).toMatchSnapshot()
  })

  it('removes unused variables', () => {
    const output = testTransform('remove-unused', 'remove-unused/unused-variables', 'tsx')
    expect(output).toMatchSnapshot()
  })

  it('removes both imports and variables', () => {
    const output = testTransform('remove-unused', 'remove-unused/mixed', 'tsx')
    expect(output).toMatchSnapshot()
  })

  it('preserves used identifiers', () => {
    const output = testTransform('remove-unused', 'remove-unused/all-used', 'tsx')
    expect(output).toMatchSnapshot()
  })

  it('preserves StyleSheet styles variable', () => {
    const output = testTransform('remove-unused', 'remove-unused/styles', 'tsx')
    expect(output).toMatchSnapshot()
  })

  it('preserves types used in generics', () => {
    const output = testTransform('remove-unused', 'remove-unused/generics', 'tsx')
    expect(output).toMatchSnapshot()
  })

  it('preserves advanced TypeScript type usage', () => {
    const output = testTransform('remove-unused', 'remove-unused/typescript-advanced', 'tsx')
    expect(output).toMatchSnapshot()
  })

  it('preserves types in type literals', () => {
    const output = testTransform('remove-unused', 'remove-unused/type-literal', 'tsx')
    expect(output).toMatchSnapshot()
  })
})
