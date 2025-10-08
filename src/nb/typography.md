# Typography Migration

Migrates NativeBase `Typography` to Nordlys `Typography`.

## Usage

```bash
./run.sh nb/typography "src/**/*.tsx"
```

## Options

- `sourceImport` - Import to look for (default: `'@org/common/src/components'`)
- `targetImport` - Import for Typography (default: `'@hb-frontend/app/src/components/nordlys'`)
- `tokenImport` - Design tokens import (default: `'@hb-frontend/nordlys'`)

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
import { Typography } from '@hb-frontend/app/src/components/nordlys'
import { space } from '@hb-frontend/nordlys'

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

- Nordlys Typography doesn't accept style props - wrapped in View if present
- Font props (`fontWeight`, `fontSize`, `lineHeight`) dropped (managed internally)
- Color prop stays as string (Nordlys resolves internally)
- Props like `type`, `size`, `align`, `numberOfLines` passed through
