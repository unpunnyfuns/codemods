# Split Atoms

Splits barrel imports from `@org/common/src/components` into individual atom imports.

## Usage

```bash
./run.sh nb/split-atoms "src/**/*.tsx"
```

## Transformation

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

## How It Works

### Import Path Matching

Finds imports from `@org/common/src/components` (handles trailing slashes):
- `@org/common/src/components` ✅
- `@org/common/src/components/` ✅

### Component/Type Resolution

The codemod maintains a hardcoded `ATOMS` Map that defines:
1. Component names (e.g., `Box`, `Button`, `Typography`)
2. Associated type names (e.g., `ButtonProps`, `TypographyProps`)

Each component/type import is split into:
```
@org/common/src/components/atoms/{ComponentName}
```

### Aliased Imports

Aliases are preserved:
```tsx
import { Button as Btn } from '@org/common/src/components'
→
import { Button as Btn } from '@org/common/src/components/atoms/Button'
```

### Type Imports

Type-only imports are preserved:
```tsx
import type { ButtonProps } from '@org/common/src/components'
→
import type { ButtonProps } from '@org/common/src/components/atoms/Button'
```

Mixed imports are split by type:
```tsx
import { Button, type ButtonProps } from '@org/common/src/components'
→
import { Button } from '@org/common/src/components/atoms/Button'
import type { ButtonProps } from '@org/common/src/components/atoms/Button'
```

## Supported Atoms

The following components and their types are recognized:

- **Actionsheet** - `ActionsheetContentProps`, `ActionsheetItemProps`, `ActionsheetProps`
- **Alert** - `AlertProps`
- **Avatar** - `AvatarProps`
- **Badge** - `BadgeProps`, `BadgeTypeProp`
- **Box** - `BoxProps`
- **Button** - `ButtonProps`
- **Checkbox** - `CheckboxGroupProps`, `CheckboxProps`
- **Chip** - `ChipProps`
- **CircleFlag** - `CircleFlagName`, `CircleFlagProps`
- **FilterChip** - `FilterChipProps`
- **Icon** - `IconProps`
- **Input** - `InputProps`
- **Loader** - (no types)
- **Pressable** - `PressableProps`
- **Radio** - `RadioGroupProps`, `RadioProps`
- **ScrollView** - `ScrollViewProps`
- **SectionList** - `SectionListProps`
- **Slider** - `SliderProps`
- **Switch** - `SwitchProps`
- **Typography** - `TypographyProps`, `TypographySize`, `TypographyType`

## Notes

- The `ATOMS` Map is hardcoded and maintained manually
- Imports not in the ATOMS Map are left unchanged
- Import order is preserved (components first, then types)
- Handles both value and type imports correctly
