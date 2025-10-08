# Typography Migration

Migrates NativeBase `Typography` component to Nordlys `Typography`.

## Usage

```bash
./run.sh nb/typography "src/**/*.tsx"
```

## Options

- `sourceImport` - Import path to look for (default: `'@org/common/src/components'`)
- `targetImport` - Import path for Typography (default: `'@hb-frontend/app/src/components/nordlys'`)
- `tokenImport` - Import path for design tokens (default: `'@hb-frontend/nordlys'`)

## Transformation

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

## Key Differences

### Nordlys Typography Constraints

Nordlys Typography doesn't accept style props (spacing, layout, etc.). These must be applied via a wrapper View.

### Font Props Dropped

Font-related props are managed internally by Nordlys Typography and are dropped:
- `fontWeight`
- `fontSize`
- `lineHeight`

### Color Handling

The `color` prop accepts a color path string (e.g., `"blue.500"`). Nordlys Typography resolves it internally, so we keep it as a string literal.

## Prop Handling

### Typography Props (stay on element)

- `type` - Typography type (heading, body, label, etc.)
- `size` - Typography size (xs, sm, md, lg, xl, etc.)
- `color` - Color path string (e.g., "blue.500")
- `align` - Text alignment
- `numberOfLines` - Line clamping
- `textDecorationLine` - Text decoration

### Text Props (passed through)

- `testID`
- `onPress`
- `onLongPress`
- `accessibilityLabel`
- `accessibilityRole`
- `accessibilityHint`
- `accessibilityState`

### Style Props (extracted to wrapper View)

All style props are moved to a wrapper View with StyleSheet:

- **Spacing**: `m`, `mt`, `mb`, `ml`, `mr`, `mx`, `my`, `p`, `pt`, `pb`, `pl`, `pr`, `px`, `py`
- **Sizing**: `w`, `h`, `minW`, `minH`, `maxW`, `maxW`
- **Layout**: `flex`, `flexDirection`, `alignSelf`, etc.
- **Position**: `position`, `top`, `left`, `right`, `bottom`, etc.
- **Border**: `borderWidth`, `borderColor`, `borderRadius`, etc.

### Drop Props (removed)

- `fontWeight` - Managed internally by Nordlys
- `fontSize` - Managed internally by Nordlys
- `lineHeight` - Managed internally by Nordlys
- `fontFamily` - Managed internally by Nordlys
- `fontStyle` - Managed internally by Nordlys
- Pseudo props: `_hover`, `_pressed`, etc.
- Platform overrides: `_web`, `_ios`, `_android`

## Wrapping Behavior

### Without Style Props

Typography without style props stays unwrapped:

```tsx
<Typography type="body" size="md">{text}</Typography>
→
<Typography type="body" size="md">{text}</Typography>
```

### With Style Props

Typography with any style props is wrapped in a View:

```tsx
<Typography type="heading" size="xl" mb={2} p={1}>
  {text}
</Typography>
→
<View style={styles.typography0}>
  <Typography type="heading" size="xl">
    {text}
  </Typography>
</View>

const styles = StyleSheet.create({
  typography0: { marginBottom: space[2], padding: space[1] }
})
```

## Notes

- Typography is always wrapped in View if it has any style props
- Font props (weight, size, lineHeight) are dropped because Nordlys manages them internally
- NativeBase color tokens in style props are automatically mapped to Nordlys
- Color prop stays as string literal (Nordlys resolves it internally)
