# Stack Migration

Migrates NativeBase `HStack` and `VStack` components to Aurora `Stack` with `direction` prop.

## Usage

```bash
./run.sh nb/stack "src/**/*.tsx"
```

## Options

- `sourceImport` - Import path to look for (default: `'react-native'`)
- `targetImport` - Import path for Stack (default: `'@hb-frontend/app/src/components/nordlys/'`)
- `targetName` - New component name (default: `'Stack'`)
- `tokenImport` - Import path for design tokens (default: `'@hb-frontend/nordlys'`)

## Transformation

### Before

```tsx
import { HStack, VStack } from 'react-native'

function MyComponent() {
  return (
    <>
      <HStack space={2} align="center" justify="between">
        <Text>Left</Text>
        <Text>Right</Text>
      </HStack>
      <VStack space={4} p={2}>
        <Text>Top</Text>
        <Text>Bottom</Text>
      </VStack>
    </>
  )
}
```

### After

```tsx
import { StyleSheet } from 'react-native'
import { Stack } from '@hb-frontend/app/src/components/nordlys/'
import { space } from '@hb-frontend/nordlys'

function MyComponent() {
  return (
    <>
      <Stack direction="horizontal" gap={space[2]} style={styles.hstack0}>
        <Text>Left</Text>
        <Text>Right</Text>
      </Stack>
      <Stack direction="vertical" gap={space[4]} style={styles.vstack0}>
        <Text>Top</Text>
        <Text>Bottom</Text>
      </Stack>
    </>
  )
}

const styles = StyleSheet.create({
  hstack0: {
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  vstack0: {
    padding: space[2]
  }
})
```

## Component Mapping

- `HStack` → `Stack` with `direction="horizontal"`
- `VStack` → `Stack` with `direction="vertical"`

## Prop Handling

### Style Props (extracted to StyleSheet)

- **Spacing**: `m`, `mt`, `mb`, `ml`, `mr`, `mx`, `my`, `p`, `pt`, `pb`, `pl`, `pr`, `px`, `py`
- **Sizing**: `w`, `h`, `minW`, `minH`, `maxW`, `maxH`, `width`, `height`
- **Layout**: `flex`, `flexDirection`, `flexWrap`, etc.
- **Border**: `borderRadius`, `borderWidth`, `borderColor`, etc.
- **Colors**: `bg`, `bgColor` (with NativeBase→Nordlys color mapping)
- **Alignment**: `align` → `alignItems` (with value mapping: `start` → `flex-start`, etc.)
- **Justification**: `justify` → `justifyContent` (with value mapping: `between` → `space-between`, etc.)

### Transform Props (renamed on element)

- `space` → `gap` (stays on element, not extracted to StyleSheet)

### Direct Props (passed through)

- Event handlers: `onPress`, `onLayout`, etc.
- Accessibility: `accessibilityLabel`, `accessibilityRole`, etc.
- Test: `testID`

### Drop Props (removed)

- Pseudo props: `_hover`, `_pressed`, `_focus`, etc.
- Platform overrides: `_web`, `_ios`, `_android`
- Theme overrides: `_light`, `_dark`
- Component-specific: `divider`, `reversed`, `_text`, `_stack`

## Value Mappings

### Alignment (`align` → `alignItems`)

- `start` → `flex-start`
- `end` → `flex-end`
- `center` → `center`
- `stretch` → `stretch`
- `baseline` → `baseline`

### Justification (`justify` → `justifyContent`)

- `start` → `flex-start`
- `end` → `flex-end`
- `center` → `center`
- `between` → `space-between`
- `around` → `space-around`
- `evenly` → `space-evenly`

## Notes

- Both HStack and VStack are handled in a single pass
- `space` prop is transformed to `gap` and stays on the element (not extracted)
- `align` and `justify` props are extracted to StyleSheet with value mapping
- NativeBase color tokens are automatically mapped to Nordlys tokens
