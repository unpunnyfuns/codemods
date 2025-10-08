# Box Migration

Migrates NativeBase `Box` component to React Native `View` with `StyleSheet`.

## Usage

```bash
./run.sh nb/box "src/**/*.tsx"
```

## Options

- `sourceImport` - Import path to look for (default: `'native-base'`)
- `targetImport` - Import path for View (default: `'react-native'`)
- `targetName` - New component name (default: `'View'`)
- `tokenImport` - Import path for design tokens (default: `'@hb-frontend/nordlys'`)

## Transformation

### Before

```tsx
import { Box } from 'native-base'

function MyComponent() {
  return (
    <Box bg="blue.500" p={4} m={2} rounded="md">
      <Text>Content</Text>
    </Box>
  )
}
```

### After

```tsx
import { StyleSheet, View } from 'react-native'
import { color, radius, space } from '@hb-frontend/nordlys'

function MyComponent() {
  return (
    <View style={styles.box0}>
      <Text>Content</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box0: {
    backgroundColor: color.blue['500'],
    padding: space[4],
    margin: space[2],
    borderRadius: radius.md
  }
})
```

## Prop Handling

### Style Props (extracted to StyleSheet)

- **Spacing**: `m`, `mt`, `mb`, `ml`, `mr`, `mx`, `my`, `p`, `pt`, `pb`, `pl`, `pr`, `px`, `py`
- **Sizing**: `w`, `h`, `minW`, `minH`, `maxW`, `maxH`, `width`, `height`
- **Layout**: `flex`, `flexDirection`, `flexWrap`, `alignItems`, `justifyContent`, etc.
- **Border**: `borderRadius`, `borderWidth`, `borderColor`, etc.
- **Colors**: `bg`, `bgColor`, `backgroundColor` (with NativeBase→Nordlys color mapping)

### Direct Props (passed through)

- Event handlers: `onPress`, `onLayout`, etc.
- Accessibility: `accessibilityLabel`, `accessibilityRole`, etc.
- Test: `testID`
- Custom: `safeAreaBottom`

### Drop Props (removed)

- Pseudo props: `_hover`, `_pressed`, `_focus`, etc.
- Platform overrides: `_web`, `_ios`, `_android`
- Theme overrides: `_light`, `_dark`
- Component-specific: `disableTopRounding`, `disableBottomRounding`

## Notes

- NativeBase color tokens (e.g., `blue.500`) are automatically mapped to Nordlys tokens
- Style props with static values are extracted to StyleSheet
- Style props with dynamic values (variables, expressions) remain inline
