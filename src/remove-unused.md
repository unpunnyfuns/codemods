# remove-unused

Generic codemod for removing unused imports and variables.

## Usage

```bash
./run.sh cleanup/remove-unused "src/**/*.{ts,tsx,js,jsx}"
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `imports` | boolean | true | Remove unused imports |
| `variables` | boolean | true | Remove unused variables |
| `verbose` | boolean | false | Print removed imports/variables |

## Examples

### Remove only unused imports

```bash
./run.sh cleanup/remove-unused "src/**/*.tsx" --variables=false
```

### Remove only unused variables

```bash
./run.sh cleanup/remove-unused "src/**/*.tsx" --imports=false
```

### Verbose output

```bash
./run.sh cleanup/remove-unused "src/**/*.tsx" --verbose
```

Output:
```
✓ Removed 3 unused imports
  - Button from @hb-frontend/common/src/components
  - Icon from native-base
  - useCallback from react
✓ Removed 2 unused variables
  - tempValue
  - oldConfig
```

## What it removes

### Unused imports

```typescript
// Before
import { Button, Icon, Text } from 'native-base'
import { useState, useCallback } from 'react'

export function Example() {
  const [count, setCount] = useState(0)
  return <Text>Count: {count}</Text>
}

// After
import { Text } from 'native-base'
import { useState } from 'react'

export function Example() {
  const [count, setCount] = useState(0)
  return <Text>Count: {count}</Text>
}
```

### Unused variables

```typescript
// Before
export function calculate() {
  const result = 42
  const temp = 100
  const unused = 'never used'

  return result + temp
}

// After
export function calculate() {
  const result = 42
  const temp = 100

  return result + temp
}
```

## Limitations

- Does not remove unused function declarations or classes
- Does not analyze cross-file dependencies
- Does not remove type-only imports (these are typically harmless)
- Does not handle dynamic imports or `require()`
- May not catch all edge cases with destructuring or complex patterns

## Use Cases

- Clean up after running other codemods that remove component usage
- Remove leftover imports from refactoring
- Clean up development/debug variables
- Prepare codebase for linting

## Safety

This codemod is conservative:
- Only removes clearly unused identifiers
- Preserves all declarations that might be used
- Does not touch exported declarations
- Skips complex patterns it doesn't understand

✅ Safe to run without manual review
✅ Can be run multiple times (idempotent)
