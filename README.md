# NativeBase Migration Codemods

jscodeshift codemods for migrating NativeBase components to Nordlys/Nordlys.

## Quick Start

```bash
npm install
./run.sh nb/box "path/**/*.tsx"
```

## Structure

- **`src/nb/`** - NativeBase migrations (temporary, deleted after migration complete)
- **`src/helpers/`** - Generic jscodeshift utilities (reusable, potential library)
- **`src/redirect-imports.js`** - General-purpose import redirect transform (reusable)

## Available Codemods

### NativeBase Migrations (`src/nb/`)

Default behavior (from `native-base` to standard targets):

```bash
./run.sh nb/avatar "src/**/*.tsx"      # Avatar → Nordlys Avatar
./run.sh nb/box "src/**/*.tsx"         # Box → View with StyleSheet
./run.sh nb/button "src/**/*.tsx"      # Button → Nordlys Button
./run.sh nb/pressable "src/**/*.tsx"   # Pressable → RN Pressable
./run.sh nb/stack "src/**/*.tsx"       # HStack/VStack → Nordlys Stack
./run.sh nb/switch "src/**/*.tsx"      # Switch → Nordlys Switch
./run.sh nb/typography "src/**/*.tsx"  # Typography → Nordlys Typography
./run.sh nb/split-atoms "src/**/*.tsx" # Split barrel imports
```

### Custom Import Sources

Most codemods support `--sourceImport` and `--targetImport` options:

```bash
# Migrate Box from a wrapped NativeBase export
./run.sh nb/box "src/**/*.tsx" \
  --sourceImport="@hb-frontend/common/src/components"

# Migrate Button from custom wrapper with custom target
./run.sh nb/button "src/**/*.tsx" \
  --sourceImport="@hb-frontend/common/src/components" \
  --targetImport="@hb-frontend/app/src/components/nordlys/Button"

# Migrate Stack with all custom paths
./run.sh nb/stack "src/**/*.tsx" \
  --sourceImport="@hb-frontend/common/src/components" \
  --targetImport="@hb-frontend/app/src/components/nordlys/Stack" \
  --tokenImport="@hb-frontend/nordlys"

# Migrate Pressable to React Native Pressable
./run.sh nb/pressable "src/**/*.tsx" \
  --sourceImport="@hb-frontend/common/src/components" \
  --targetImport="react-native"
```

**Common source imports:**
- `native-base` (default for most codemods)
- `@hb-frontend/common/src/components` (wrapped exports)

**Common targets:**
- `react-native` (for Box → View, Pressable)
- `@hb-frontend/app/src/components/nordlys/[Component]` (Nordlys components)

### General Transforms

```bash
./run.sh redirect-imports "src/**/*.tsx" \
  --sourceImport="native-base" \
  --targetImport="@org/common/native-base"
```

## Creating a Codemod

### Basic Transform

```javascript
// src/my-transform.js
export default function transform(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Find and transform nodes
  root.find(j.Identifier, { name: 'oldName' })
    .forEach(path => {
      path.node.name = 'newName'
    })

  return root.toSource()
}
```

Run it:
```bash
./run.sh my-transform "src/**/*.js"
```

### Component Migration

For NativeBase component migrations, see existing examples in `src/nb/`. Common pattern:

1. Import helpers: `categorizeProps`, `addOrExtendStyleSheet`, JSX helpers
2. Define prop mappings (style/transform/direct/drop)
3. Find component, categorize props, transform JSX
4. Generate StyleSheet for extracted styles

See `src/nb/box.js` for the simplest example.

### With Tests

```javascript
// src/__tests__/my-transform.test.js
import { describe, expect, it } from 'vitest'
import { testTransform } from './test-helper.js'

describe('my-transform', () => {
  it('transforms oldName to newName', () => {
    const output = testTransform('my-transform', 'my-transform')
    expect(output).toMatchSnapshot()
  })
})
```

Add fixtures:
```javascript
// src/__testfixtures__/my-transform.input.js
const x = oldName

// Expected output will be in snapshot
```

## Helper Library

Generic jscodeshift utilities in `src/helpers/`:

- **imports.js** - `addNamedImport`, `removeNamedImport`, `hasNamedImport`
- **jsx-transforms.js** - `updateElementName`, `addPropsToElement`, `removePropsFromElement`, `addStyleProp`
- **jsx-extraction.js** - `extractPropFromJSXElement`, `extractSimpleChild`
- **token-helpers.js** - `buildNestedMemberExpression` (for design tokens)

See [docs/helpers-reference.md](docs/helpers-reference.md) for API details.

## Development

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run lint:fix      # Lint and format with Biome
```

## Documentation

- **CLAUDE.md** - Project structure, detailed workflows
- **docs/jscodeshift-patterns.md** - Common AST patterns
- **docs/helpers-reference.md** - Helper API reference
- **redirect-imports.md** - Import redirect transform documentation

## Note

The `src/nb/` folder contains temporary migration code that will be deleted after the NativeBase→Nordlys migration is complete. Only `src/helpers/` is designed for long-term reuse.
