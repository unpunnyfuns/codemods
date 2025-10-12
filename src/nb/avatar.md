# Avatar Migration

Migrates NativeBase/Common `Avatar` to target framework `Avatar` with object-based props.

## Usage

```bash
./run.sh nb/avatar "src/**/*.tsx"
```

## Options

- `sourceImport` - Import to look for (default: `'@org/common/src/components'`)
- `targetImport` - Import for Avatar (default: `'./components'`)
- `tokenImport` - Design tokens import (default: `'./tokens'`)

## Example

### Before

```tsx
import { Avatar } from '@org/common/src/components'

<Avatar iconName="user" size="md" bgColor="blue.500" />
<Avatar imageUri="https://example.com/avatar.jpg" size="lg" />
<Avatar imageSource={require('./avatar.png')} size="sm" />
<Avatar letters="AB" size="sm" />
```

### After

```tsx
import { Avatar } from './components'
import { color } from './tokens'

<Avatar icon={{ name: "user", fill: color.blue['500'] }} size="md" />
<Avatar image={{ source: { uri: "https://example.com/avatar.jpg" } }} size="lg" />
<Avatar image={{ source: require('./avatar.png') }} size="sm" />
// Warning: Avatar with letters prop cannot be migrated
```

## Notes

- `iconName="user"` to `icon={{ name: "user", fill: bgColor }}`
- `imageUri="url"` to `image={{ source: { uri: "url" } }}`
- `imageSource={source}` to `image={{ source }}`
- `letters` not supported, issues warning
- Style props wrapped in View if present
