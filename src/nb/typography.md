# Typography Migration

Migrates NativeBase `Typography` to target framework `Typography`.

## Usage

```bash
./run.sh nb/typography "src/**/*.tsx"
```

## Options

- `sourceImport` - Import to look for (default: `'@org/common/src/components'`)
- `targetImport` - Import for Typography (default: `'./components'`)
- `tokenImport` - Design tokens import (default: `'./tokens'`)

## Example

### Before

```tsx
import { Typography } from '@org/common/src/components'

<Typography
  type="heading"
  size="xl"
  color="blue.500"
  mb="lg"
  fontWeight="700"
>
  {text}
</Typography>
```

### After

```tsx
import { StyleSheet, View } from 'react-native'
import { Typography } from './components'
import { space } from './tokens'

<View style={styles.typography0}>
  <Typography type="heading" size="xl" color="blue.500">
    {text}
  </Typography>
</View>

const styles = StyleSheet.create({
  typography0: { marginBottom: space.lg }
})
```

## Notes

- target framework Typography doesn't accept style props - wrapped in View if present
- Font props (`fontWeight`, `fontSize`, `lineHeight`) dropped (managed internally)
- Color prop stays as string (target framework resolves internally)
- Props like `type`, `size`, `align`, `numberOfLines` passed through
