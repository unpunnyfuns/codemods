# Redirect Imports

General-purpose transform to redirect import paths, optionally renaming imported identifiers.

## Usage

```bash
# Simple redirect (no renaming)
./run.sh transforms/redirect-imports "src/**/*.tsx" \
  --sourceImport="native-base" \
  --targetImport="@org/common/native-base"

# Redirect with renaming
./run.sh transforms/redirect-imports "src/**/*.tsx" \
  --sourceImport="react-native" \
  --targetImport="react-native" \
  --sourceName="View" \
  --targetName="RNView"
```

## Options

- `sourceImport` - Import path to look for (required)
- `targetImport` - Import path to redirect to (required)
- `sourceName` - Named import to rename (optional)
- `targetName` - New name for the identifier (optional, requires `sourceName`)

## Examples

### Simple Path Redirect

**Before:**
```tsx
import { Box, Button } from 'native-base'
import { Text } from 'react-native'
```

**Command:**
```bash
./run.sh transforms/redirect-imports "src/**/*.tsx" \
  --sourceImport="native-base" \
  --targetImport="@org/common/native-base"
```

**After:**
```tsx
import { Box, Button } from '@org/common/native-base'
import { Text } from 'react-native'
```

### Path Redirect with Identifier Rename

**Before:**
```tsx
import { View, Text } from 'react-native'

export function MyComponent() {
  return <View><Text>Hello</Text></View>
}
```

**Command:**
```bash
./run.sh transforms/redirect-imports "src/**/*.tsx" \
  --sourceImport="react-native" \
  --targetImport="react-native" \
  --sourceName="View" \
  --targetName="RNView"
```

**After:**
```tsx
import { RNView, Text } from 'react-native'

export function MyComponent() {
  return <RNView><Text>Hello</Text></RNView>
}
```

## Notes

- Handles trailing slashes in import paths
- Preserves `import type` declarations
- Renames all usages of the identifier throughout the file (except in import/export specifiers)
- Works with aliased imports: `import { Box as MyBox }` tracks local name correctly
