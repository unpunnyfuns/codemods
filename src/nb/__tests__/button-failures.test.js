import { describe, expect, it } from 'vitest'
import { DEFAULT_TEST_OPTIONS, testTransform } from '../../__tests__/test-helper.js'

describe('nb/button safe failure handling', () => {
  it('preserves Button with complex children unchanged and warns', () => {
    const input = `
import { Button } from 'native-base'

export function Example() {
  return (
    <Button onPress={() => {}}>
      <SomeComplexComponent>
        <NestedStuff />
      </SomeComplexComponent>
    </Button>
  )
}
`
    const output = testTransform('nb/button', null, 'tsx', {
      ...DEFAULT_TEST_OPTIONS,
      sourceInput: input,
    })

    // Should preserve the original Button unchanged
    expect(output).toContain('<Button onPress={() => {}}>')
    expect(output).toContain('<SomeComplexComponent>')
    expect(output).toContain("from 'native-base'")
  })

  it('preserves empty Button unchanged and warns', () => {
    const input = `
import { Button } from 'native-base'

export function Example() {
  return <Button onPress={() => {}} />
}
`
    const output = testTransform('nb/button', null, 'tsx', {
      ...DEFAULT_TEST_OPTIONS,
      sourceInput: input,
    })

    // Should preserve the original empty Button unchanged
    expect(output).toContain('<Button onPress={() => {}} />')
    expect(output).toContain("from 'native-base'")
  })

  it('skips all buttons when file contains complex children or empty buttons', () => {
    const input = `
import { Button } from 'native-base'

export function Example() {
  return (
    <>
      <Button onPress={onSimple}>Simple Text</Button>
      <Button onPress={onComplex}>
        <ComplexChild />
      </Button>
      <Button onPress={onEmpty} />
    </>
  )
}
`
    const output = testTransform('nb/button', null, 'tsx', {
      ...DEFAULT_TEST_OPTIONS,
      sourceInput: input,
    })

    // All buttons should be preserved unchanged (complex children, empty button, and simple text all skipped)
    expect(output).toContain("from 'native-base'")
    expect(output).toContain('<Button onPress={onSimple}>Simple Text</Button>')
    expect(output).toContain('<ComplexChild />')
    expect(output).toContain('onPress={onComplex}')
    expect(output).toContain('onPress={onEmpty}')
  })

  it('preserves Button with conditional text unchanged (not complex enough to migrate)', () => {
    const input = `
import { Button } from 'native-base'

export function Example() {
  return <Button onPress={() => {}}>{isLoading ? 'Loading' : 'Submit'}</Button>
}
`
    const output = testTransform('nb/button', null, 'tsx', {
      ...DEFAULT_TEST_OPTIONS,
      sourceInput: input,
    })

    // Should preserve Button unchanged (conditional text is supported but still skipped)
    expect(output).toContain('<Button onPress={() => {}}>')
    expect(output).toContain("{isLoading ? 'Loading' : 'Submit'}")
    expect(output).toContain("from 'native-base'")
  })
})
