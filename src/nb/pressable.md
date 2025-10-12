# Pressable Migration

Migrates NativeBase `Pressable` to React Native `Pressable` with `StyleSheet`.

## Usage

```bash
./run.sh nb/pressable "src/**/*.tsx"
```

## Options

- `sourceImport` - Import to look for (default: `'native-base'`)
- `targetImport` - Import for Pressable (default: `'react-native'`)
- `tokenImport` - Design tokens import (default: `'./tokens'`)

## Example

### Before

```tsx
import { Pressable } from 'native-base'

<Pressable bg="blue.500" p={4} m={2} onPress={handlePress}>
  <Text>Press me</Text>
</Pressable>
```

### After

```tsx
import { Pressable, StyleSheet } from 'react-native'
import { color, space } from './tokens'

<Pressable
  style={styles.pressable0}
  onPress={handlePress}
  accessibilityRole="button"
>
  <Text>Press me</Text>
</Pressable>

const styles = StyleSheet.create({
  pressable0: {
    backgroundColor: color.blue['500'],
    padding: space[4],
    margin: space[2]
  }
})
```

## Notes

- Automatically adds `accessibilityRole="button"` (matches Common wrapper behavior)
- Style props extracted to StyleSheet
- Event handlers and accessibility props passed through
