# Switch Migration

Migrates NativeBase/Common `Switch` to Nordlys `Switch` with compound components.

## Usage

```bash
./run.sh nb/switch "src/**/*.tsx"
```

## Options

- `sourceImport` - Import to look for (default: `'@org/common/src/components'`)
- `targetImport` - Import for Switch (default: `'@hb-frontend/app/src/components/nordlys'`)
- `tokenImport` - Design tokens import (default: `'@hb-frontend/nordlys'`)

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
import { Switch } from '@hb-frontend/app/src/components/nordlys'

<Switch value={enabled} onValueChange={setEnabled} disabled={loading}>
  <Switch.Label>Toggle this to receive notifications</Switch.Label>
  <Switch.Description>Enable notifications</Switch.Description>
</Switch>
```

## Notes

- `isChecked` → `value`, `onToggle` → `onValueChange`, `isDisabled` → `disabled`
- Children → `<Switch.Label>`
- `label` prop → `<Switch.Description>`
- Style props wrapped in View if present
