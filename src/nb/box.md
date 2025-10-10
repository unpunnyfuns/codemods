# Box Migration

Migrates NativeBase `Box` to React Native `View` with `StyleSheet`.

## Usage

```bash
./run.sh nb/box
```

## Options

- `sourceImport` - Import to look for (default: `'native-base'`)
- `targetImport` - Import for View (default: `'react-native'`)
- `targetName` - Component name (default: `'View'`)
- `tokenImport` - Design tokens import (default: `'@hb-frontend/nordlys'`)

## Example

### Before

```tsx
import { Box } from 'native-base'

<Box bg="blue.500" p={4} m={2} rounded="md">
  <Text>Content</Text>
</Box>
```

### After

```tsx
import { StyleSheet, View } from 'react-native'
import { color, radius, space } from '@hb-frontend/nordlys'

<View style={styles.box0}>
  <Text>Content</Text>
</View>

const styles = StyleSheet.create({
  box0: {
    backgroundColor: color.blue['500'],
    padding: space[4],
    margin: space[2],
    borderRadius: radius.md
  }
})
```

## Notes

- Style props (spacing, sizing, colors, layout, border) extracted to StyleSheet
- NativeBase color tokens mapped to Nordlys
- Direct props (onPress, testID, accessibility) passed through
- Pseudo props (_hover, _pressed) and platform overrides (_web, _ios) dropped
