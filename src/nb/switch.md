# Switch Migration

Migrates NativeBase/Common `Switch` to target framework `Switch` with compound components.

## Usage

```bash
./run.sh nb/switch "src/**/*.tsx"
```

## Options

- `sourceImport` - Import to look for (default: `'@org/common/src/components'`)
- `targetImport` - Import for Switch (default: `'./components'`)
- `tokenImport` - Design tokens import (default: `'./tokens'`)

## Example

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
import { Switch } from './components'

<Switch value={enabled} onValueChange={setEnabled} disabled={loading}>
  <Switch.Label>Toggle this to receive notifications</Switch.Label>
  <Switch.Description>Enable notifications</Switch.Description>
</Switch>
```

## Notes

- `isChecked` to `value`, `onToggle` to `onValueChange`, `isDisabled` to `disabled`
- Children to `<Switch.Label>`
- `label` prop to `<Switch.Description>`
- Style props wrapped in View if present
