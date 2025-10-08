# Pressable Migration

Migrates NativeBase `Pressable` component to React Native `Pressable` with StyleSheet extraction.

## Usage

```bash
./run.sh nb/pressable "src/**/*.tsx"
```

## Options

- `sourceImport` - Import path to look for (default: `'native-base'`)
- `targetImport` - Import path for Pressable (default: `'react-native'`)
- `tokenImport` - Import path for design tokens (default: `'@hb-frontend/nordlys'`)

## Transformation

### Before

```tsx
import { Pressable } from 'native-base'

function MyComponent() {
  return (
    <Pressable bg="blue.500" p={4} m={2} onPress={handlePress}>
      <Text>Press me</Text>
    </Pressable>
  )
}
```

### After

```tsx
import { Pressable, StyleSheet } from 'react-native'
import { color, space } from '@hb-frontend/nordlys'

function MyComponent() {
  return (
    <Pressable
      style={styles.pressable0}
      onPress={handlePress}
      accessibilityRole="button"
    >
      <Text>Press me</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable0: {
    backgroundColor: color.blue['500'],
    padding: space[4],
    margin: space[2]
  }
})
```

## Prop Handling

### Style Props (extracted to StyleSheet)

- **Spacing**: `m`, `mt`, `mb`, `ml`, `mr`, `mx`, `my`, `p`, `pt`, `pb`, `pl`, `pr`, `px`, `py`
- **Sizing**: `w`, `h`, `minW`, `minH`, `maxW`, `maxH`, `width`, `height`
- **Colors**: `bg`, `bgColor`, `backgroundColor` (with NativeBase→Nordlys color mapping)
- **Layout**: `flex`, `flexDirection`, `alignItems`, `justifyContent`, etc.
- **Border**: `borderRadius`, `borderWidth`, `borderColor`, etc.
- **Position**: `position`, `top`, `left`, `right`, `bottom`, etc.

### Direct Props (passed through)

- Event handlers: `onPress`, `onPressIn`, `onPressOut`, `onLongPress`, `onLayout`
- Accessibility: `accessibilityLabel`, `accessibilityRole`, `accessibilityHint`, etc.
- Test: `testID`
- RN Pressable props: `disabled`, `hitSlop`, `android_ripple`, etc.

### Drop Props (removed)

- Pseudo props: `_hover`, `_pressed`, `_focus`, etc.
- Platform overrides: `_web`, `_ios`, `_android`
- Theme overrides: `_light`, `_dark`

## Default Behavior

### accessibilityRole="button"

The Common wrapper for Pressable sets `accessibilityRole="button"` by default. This migration preserves that behavior:

```tsx
<Pressable onPress={fn}>Content</Pressable>
```
→
```tsx
<Pressable onPress={fn} accessibilityRole="button">Content</Pressable>
```

This is added automatically unless `accessibilityRole` is already specified.

## Notes

- NativeBase color tokens (e.g., `blue.500`) are automatically mapped to Nordlys tokens
- Style props with static values are extracted to StyleSheet
- Style props with dynamic values (variables, expressions) remain inline
- The migration preserves Common's default `accessibilityRole="button"` behavior
