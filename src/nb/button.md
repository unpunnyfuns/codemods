# Button Migration

Migrates NativeBase/Common `Button` component to Nordlys `Button` with extracted `icon` and `text` props.

## Usage

```bash
./run.sh nb/button "src/**/*.tsx"
```

## Options

- `sourceImport` - Import path to look for (default: `'@org/common/src/components'`)
- `targetImport` - Import path for Button (default: `'@hb-frontend/app/src/components/nordlys'`)
- `tokenImport` - Import path for design tokens (default: `'@hb-frontend/nordlys'`)

## Transformation

### Before

```tsx
import { Button, Icon } from '@org/common/src/components'

<Button
  leftIcon={<Icon name="Plus" />}
  variant="secondary"
  size="md"
  isDisabled={disabled}
  onPress={handlePress}
>
  {t('common.add')}
</Button>
```

### After

```tsx
import { Button } from '@hb-frontend/app/src/components/nordlys'

<Button
  icon="Plus"
  text={t('common.add')}
  variant="secondary"
  size="md"
  type="solid"
  disabled={disabled}
  onPress={handlePress}
/>
```

## Prop Transformations

### Special Props

- `leftIcon={<Icon name="..." />}` → `icon="..."`
  - Extracts icon name from Icon element
  - Warns if icon extraction fails

- `children` → `text={children}`
  - Extracts simple children (string literals, variables, function calls)
  - Warns if children are complex JSX (multiple elements, conditionals)

- `rightIcon` → ⚠️ Warning (not supported)

- Adds `type="solid"` (default type, may need manual adjustment)

### Transform Props (renamed on element)

- `isDisabled` → `disabled`
- `isLoading` → `loading`

### Direct Props (passed through)

- `size` - Button size (sm, md, lg)
- `variant` - Button variant (primary, secondary, etc.)
- `onPress`
- `testID`
- Accessibility props

### Style Props (wrapped in View if present)

If the Button has style props (spacing, colors, etc.), it's wrapped in a View with StyleSheet:

**Before:**
```tsx
<Button leftIcon={<Icon name="Plus" />} m={2} p={1} bg="blue.500">
  Add Item
</Button>
```

**After:**
```tsx
<View style={styles.button0}>
  <Button icon="Plus" text="Add Item" type="solid" />
</View>

const styles = StyleSheet.create({
  button0: {
    margin: space[2],
    padding: space[1],
    backgroundColor: color.blue['500']
  }
})
```

### Drop Props (removed)

- `leftIcon` - Transformed to `icon`
- `rightIcon` - Not supported, warning issued
- Style props that were extracted to StyleSheet
- Pseudo props: `_hover`, `_pressed`, `_text`, etc.
- Platform overrides: `_web`, `_ios`, `_android`

## Coverage

Handles ~80% of common cases:
- ✅ Simple text children (literals, variables, function calls)
- ✅ Single leftIcon with Icon component
- ✅ Standard props (size, variant, onPress, disabled, loading)
- ⚠️ Complex JSX children (needs manual review)
- ⚠️ rightIcon (not supported in Nordlys)
- ⚠️ Icon-only buttons (no text prop)

## Warnings

The migration issues warnings for:

1. **Complex children**: Multiple elements, conditionals, fragments
   ```tsx
   <Button>
     <Text>Complex</Text>
     {condition && <Icon />}
   </Button>
   ```
   → Requires manual migration

2. **rightIcon**: Not supported in Nordlys Button
   ```tsx
   <Button rightIcon={<Icon name="Arrow" />}>Next</Button>
   ```
   → Requires manual migration or redesign

3. **Icon-only buttons**: Missing both icon and children
   ```tsx
   <Button onPress={fn} />
   ```
   → Requires manual review

## Notes

- Button children are converted to self-closing `<Button />` with `text` prop
- `type="solid"` is added as a default (may need manual adjustment for ghost, outline, etc.)
- NativeBase color tokens in style props are automatically mapped to Nordlys
- Warnings are logged to stderr during migration
