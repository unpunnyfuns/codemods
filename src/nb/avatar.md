# Avatar Migration

Migrates NativeBase/Common `Avatar` component to Nordlys `Avatar` with object-based props.

## Usage

```bash
./run.sh nb/avatar "src/**/*.tsx"
```

## Options

- `sourceImport` - Import path to look for (default: `'@org/common/src/components'`)
- `targetImport` - Import path for Avatar (default: `'@hb-frontend/app/src/components/nordlys'`)
- `tokenImport` - Import path for design tokens (default: `'@hb-frontend/nordlys'`)

## Transformation

### Icon Avatar

**Before:**
```tsx
import { Avatar } from '@org/common/src/components'

<Avatar iconName="user" size="md" bgColor="blue.500" />
```

**After:**
```tsx
import { StyleSheet } from 'react-native'
import { Avatar } from '@hb-frontend/app/src/components/nordlys'
import { color } from '@hb-frontend/nordlys'

<Avatar icon={{ name: "user", fill: color.blue['500'] }} size="md" />
```

### Image Avatar (with URI)

**Before:**
```tsx
<Avatar imageUri="https://example.com/avatar.jpg" size="lg" />
```

**After:**
```tsx
<Avatar image={{ source: { uri: "https://example.com/avatar.jpg" } }} size="lg" />
```

### Image Avatar (with source object)

**Before:**
```tsx
<Avatar imageSource={require('./avatar.png')} size="sm" />
```

**After:**
```tsx
<Avatar image={{ source: require('./avatar.png') }} size="sm" />
```

### Letters Avatar (Not Supported)

**Before:**
```tsx
<Avatar letters="AB" size="sm" />
```

**After:**
```
⚠️  Avatar migration warnings:
   Avatar with letters prop cannot be migrated (not supported in Nordlys Avatar)
```

The element remains unchanged. Manual migration required.

## Prop Transformations

### Special Props

- `iconName="user"` → `icon={{ name: "user", fill: bgColor }}`
  - Extracts icon name from prop
  - Uses `bgColor` or `bg` as fill color (defaults to blue if not provided)
  - If `bgColor` has a color token, it's mapped to Nordlys

- `imageUri="url"` → `image={{ source: { uri: "url" } }}`
  - Wraps URI string in React Native image source object

- `imageSource={source}` → `image={{ source }}`
  - Passes through source object

- `letters` → ⚠️ Warning (not supported in Nordlys)

### Style Props (extracted to StyleSheet if Avatar has them)

- **Spacing**: `m`, `mt`, `mb`, `ml`, `mr`, `mx`, `my`, `p`, `pt`, `pb`, `pl`, `pr`, `px`, `py`
- **Sizing**: `w`, `h`, `minW`, `minH`, `maxW`, `maxH`, `width`, `height`
  - Note: `size` is NOT extracted (it's a semantic Avatar prop)
- **Colors**: `bg`, `bgColor` (used for icon fill, then dropped)
- **Layout/Position**: `flex`, `position`, `top`, `left`, etc.

### Direct Props (passed through)

- `size` - Semantic Avatar size (sm, md, lg)
- `testID`
- `accessibilityLabel`

### Drop Props (removed)

- `iconName` - Transformed to `icon` prop
- `imageUri` - Transformed to `image` prop
- `imageSource` - Transformed to `image` prop
- `letters` - Not supported, warning issued
- `lettersColor` - Not supported
- `isSecondaryColor` - Not supported
- Pseudo props: `_hover`, `_pressed`, etc.
- Platform overrides: `_web`, `_ios`, `_android`

## Wrapping Behavior

If the Avatar has any style props (spacing, layout, etc.), it's wrapped in a View:

**Before:**
```tsx
<Avatar iconName="user" size="md" m={2} p={1} />
```

**After:**
```tsx
<View style={styles.avatar0}>
  <Avatar icon={{ name: "user", fill: "blue" }} size="md" />
</View>

const styles = StyleSheet.create({
  avatar0: { margin: space[2], padding: space[1] }
})
```

## Notes

- Avatar without style props stays unwrapped
- `bgColor` is used as icon fill color when converting `iconName` → `icon`
- NativeBase color tokens are automatically mapped to Nordlys
- Letters avatars require manual migration (Nordlys doesn't support letters)
