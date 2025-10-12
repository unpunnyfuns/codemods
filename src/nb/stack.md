# Stack Migration

Migrates NativeBase `HStack`/`VStack` to `Stack` with `direction` prop.

## Usage

```bash
./run.sh nb/stack
```

## Options

- `sourceImport` - Import to look for (default: `'native-base'`)
- `targetImport` - Import for Stack (default: `'./components/Stack'`)
- `targetName` - Component name (default: `'Stack'`)
- `tokenImport` - Design tokens import (default: `'./tokens'`)

## Example

### Before

```tsx
import { HStack, VStack } from 'react-native'

<HStack space={2} align="center" justify="between">
  <Text>Left</Text>
  <Text>Right</Text>
</HStack>

<VStack space={4} p={2}>
  <Text>Top</Text>
  <Text>Bottom</Text>
</VStack>
```

### After

```tsx
import { StyleSheet } from 'react-native'
import { Stack } from './components/Stack'
import { space } from './tokens'

<Stack direction="horizontal" gap={space[2]} style={styles.hstack0}>
  <Text>Left</Text>
  <Text>Right</Text>
</Stack>

<Stack direction="vertical" gap={space[4]} style={styles.vstack0}>
  <Text>Top</Text>
  <Text>Bottom</Text>
</Stack>

const styles = StyleSheet.create({
  hstack0: { alignItems: 'center', justifyContent: 'space-between' },
  vstack0: { padding: space[2] }
})
```

## Notes

- `HStack` becomes `Stack` with `direction="horizontal"`
- `VStack` becomes `Stack` with `direction="vertical"`
- `space` becomes `gap` (stays on element)
- `align` becomes `alignItems` (extracted to StyleSheet, values mapped: start to flex-start, etc.)
- `justify` becomes `justifyContent` (extracted to StyleSheet, values mapped: between to space-between, etc.)
- Props like `divider`, `reversed`, `_text`, `_stack` dropped
