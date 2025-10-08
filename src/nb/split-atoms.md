# Split Atoms

Splits barrel imports from `@org/common/src/components` into individual atom imports.

## Usage

```bash
./run.sh nb/split-atoms "src/**/*.tsx"
```

## Example

### Before

```tsx
import { Box, Button as Btn, Typography } from '@org/common/src/components'
import type { ButtonProps, TypographyProps } from '@org/common/src/components/'

export function MyComponent(props: ButtonProps) {
  return (
    <Box>
      <Btn>Click me</Btn>
      <Typography>Hello</Typography>
    </Box>
  )
}
```

### After

```tsx
import { Box } from '@org/common/src/components/atoms/Box'
import { Button as Btn } from '@org/common/src/components/atoms/Button'
import { Typography } from '@org/common/src/components/atoms/Typography'
import type { ButtonProps } from '@org/common/src/components/atoms/Button'
import type { TypographyProps } from '@org/common/src/components/atoms/Typography'

export function MyComponent(props: ButtonProps) {
  return (
    <Box>
      <Btn>Click me</Btn>
      <Typography>Hello</Typography>
    </Box>
  )
}
```

## Notes

- Handles trailing slashes in import paths
- Preserves aliases (`Button as Btn`)
- Preserves type-only imports
- Splits mixed value/type imports
- Hardcoded `ATOMS` Map maintained in codemod file
