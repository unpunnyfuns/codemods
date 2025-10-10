# Button Migration

Migrates NativeBase/Common `Button` to Nordlys `Button` with extracted `icon` and `text` props.

## Usage

```bash
./run.sh nb/button
```

## Options

- `sourceImport` - Import to look for (default: `'@org/common/src/components'`)
- `targetImport` - Import for Button (default: `'@hb-frontend/app/src/components/nordlys'`)
- `tokenImport` - Design tokens import (default: `'@hb-frontend/nordlys'`)

## Example

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

## Notes

- `leftIcon={<Icon name="..." />}` → `icon="..."`
- Children → `text={children}` (simple children only)
- `isDisabled` → `disabled`, `isLoading` → `loading`
- Adds `type="solid"` (may need manual adjustment)
- Style props wrapped in View if present
- Warns for: complex children, rightIcon, icon-only buttons
