import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import jscodeshift from 'jscodeshift'
import transform from '../redirect-imports.js'

function runTransform(source, options = {}) {
  const fileInfo = { path: 'test.js', source }
  const api = {
    jscodeshift: jscodeshift.withParser('tsx'),
    j: jscodeshift.withParser('tsx'),
    stats: () => {},
    report: () => {},
  }
  return transform(fileInfo, api, options)
}

describe('redirect-imports', () => {
  it('redirects imports without renaming (nb-redirect case)', () => {
    const input = `import type { ButtonProps } from 'native-base'
import { Box, Button } from 'native-base'
import { View } from 'react-native'

export function MyComponent() {
  return (
    <View>
      <Box>
        <Button>Click me</Button>
      </Box>
    </View>
  )
}`

    const actual = runTransform(input, {
      sourceImport: 'native-base',
      targetImport: '@org/common/src/components/native-base',
    })

    expect(actual).toContain("from '@org/common/src/components/native-base'")
    expect(actual).toContain('<Box>')
    expect(actual).toContain('<Button>')
  })

  it('redirects imports with trailing slash (shim-redirect case)', () => {
    const input = `import { Box, Button } from '@org/common/src/components'
import { Typography } from '@org/common/src/components/'

export function MyComponent() {
  return (
    <Box>
      <Button>Click me</Button>
      <Typography>Hello</Typography>
    </Box>
  )
}`

    const actual = runTransform(input, {
      sourceImport: '@org/common/src/components',
      targetImport: '@org/common/src/components/native-base',
    })

    expect(actual).toContain("from '@org/common/src/components/native-base'")
    expect(actual).toContain('<Box>')
    expect(actual).toContain('<Typography>')
  })

  it('redirects and renames a single import', () => {
    const input = `import { Box, Button } from 'native-base'

export function MyComponent() {
  return (
    <Box>
      <Button>Click</Button>
    </Box>
  )
}`

    const actual = runTransform(input, {
      sourceImport: 'native-base',
      targetImport: '@new/path',
      sourceName: 'Box',
      targetName: 'Container',
    })

    expect(actual).toContain("from '@new/path'")
    expect(actual).toContain('Container')
    expect(actual).toContain('<Container>')
    expect(actual).toContain('Button') // unchanged
    expect(actual).toContain('<Button>') // unchanged
    expect(actual).not.toContain('<Box>')
  })

  it('handles aliased imports with renaming', () => {
    const input = `import { Box as MyBox } from 'native-base'

export function MyComponent() {
  return <MyBox />
}`

    const actual = runTransform(input, {
      sourceImport: 'native-base',
      targetImport: '@new/path',
      sourceName: 'Box',
      targetName: 'Container',
    })

    expect(actual).toContain("from '@new/path'")
    expect(actual).toContain('<Container />')
    expect(actual).not.toContain('MyBox')
  })

  it('redirects without renaming when sourceName not provided', () => {
    const input = `import { Box, Button } from 'native-base'

export function MyComponent() {
  return (
    <Box>
      <Button>Click</Button>
    </Box>
  )
}`

    const actual = runTransform(input, {
      sourceImport: 'native-base',
      targetImport: '@new/path',
    })

    expect(actual).toContain("from '@new/path'")
    expect(actual).toContain('<Box>')
    expect(actual).toContain('<Button>')
  })
})
