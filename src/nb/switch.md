# Switch Migration

Migrates NativeBase/Common `Switch` component to Nordlys `Switch` with compound components.

## Usage

```bash
./run.sh nb/switch "src/**/*.tsx"
```

## Options

- `sourceImport` - Import path to look for (default: `'@org/common/src/components'`)
- `targetImport` - Import path for Switch (default: `'@hb-frontend/app/src/components/nordlys'`)
- `tokenImport` - Import path for design tokens (default: `'@hb-frontend/nordlys'`)

## Transformation

### Before

```tsx
import { Switch } from '@org/common/src/components'

<Switch
  label="Enable notifications"
  isChecked={enabled}
  onToggle={setEnabled}
  isDisabled={loading}
>
  Toggle this to receive notifications
</Switch>
```

### After

```tsx
import { Switch } from '@hb-frontend/app/src/components/nordlys'

<Switch
  value={enabled}
  onValueChange={setEnabled}
  disabled={loading}
>
  <Switch.Label>Toggle this to receive notifications</Switch.Label>
  <Switch.Description>Enable notifications</Switch.Description>
</Switch>
```

## Key Differences

### Prop Renames

- `isChecked` → `value`
- `onToggle` → `onValueChange`
- `isDisabled` → `disabled`

### Compound Components

- `children` → wrapped in `<Switch.Label>`
- `label` prop → becomes `<Switch.Description>`

The order is inverted: in NativeBase, `label` appears above children. In Nordlys, `Switch.Label` (from children) appears first, then `Switch.Description` (from label prop).

## Prop Handling

### Transform Props (renamed on element)

- `isChecked` → `value`
- `onToggle` → `onValueChange`
- `isDisabled` → `disabled`

### Direct Props (passed through)

- `testID`
- `accessibilityLabel`
- Accessibility props

### Style Props (wrapped in View if present)

If the Switch has style props (spacing, colors, etc.), it's wrapped in a View with StyleSheet:

**Before:**
```tsx
<Switch isChecked={bool} onToggle={fn} m={2} p={1}>
  Label text
</Switch>
```

**After:**
```tsx
<View style={styles.switch0}>
  <Switch value={bool} onValueChange={fn}>
    <Switch.Label>Label text</Switch.Label>
  </Switch>
</View>

const styles = StyleSheet.create({
  switch0: { margin: space[2], padding: space[1] }
})
```

### Drop Props (removed)

- `label` - Transformed to `<Switch.Description>`
- Style props that were extracted to StyleSheet
- Pseudo props: `_hover`, `_pressed`, etc.
- Platform overrides: `_web`, `_ios`, `_android`

## Children Handling

### Simple Children

String literals, variables, and simple expressions are wrapped in `Switch.Label`:

```tsx
<Switch>{label}</Switch>
→
<Switch>
  <Switch.Label>{label}</Switch.Label>
</Switch>
```

### Complex Children

Multiple elements or complex JSX are preserved as-is (no wrapping):

```tsx
<Switch>
  <Text>Part 1</Text>
  <Text>Part 2</Text>
</Switch>
→
<Switch>
  <Text>Part 1</Text>
  <Text>Part 2</Text>
</Switch>
```

## Notes

- NativeBase color tokens in style props are automatically mapped to Nordlys
- `label` and `children` order is inverted (Label appears before Description in Nordlys)
- Style props with static values are extracted to StyleSheet
- Switch without style props stays unwrapped
