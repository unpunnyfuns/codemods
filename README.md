# NativeBase Migration Codemods

jscodeshift codemods for migrating NativeBase components to Aurora/Nordlys.

## Quick Start

```bash
npm install
./run.sh <codemod> "path/**/*.tsx"
```

## Available Codemods

**Migrations** (component-specific):
- `migrate-avatar` - Avatar → Nordlys Avatar
- `migrate-box` - Box → View with StyleSheet
- `migrate-button` - Button → Nordlys Button
- `migrate-pressable` - Pressable → React Native Pressable
- `migrate-stack` - HStack/VStack → Aurora Stack
- `migrate-switch` - Switch → Nordlys Switch
- `migrate-typography` - Typography → Nordlys Typography

**Transforms** (general-purpose):
- `redirect-imports` - Redirect import paths
- `split-atoms` - Split barrel imports into individual imports

## Usage

```bash
# Run migration
./run.sh migrate-box "src/**/*.tsx"

# With options
./run.sh redirect-imports "src/**/*.tsx" \
  --sourceImport="native-base" \
  --targetImport="@org/common/native-base"
```

`run.sh` automatically formats output with Biome.

## Helper Library

Reusable jscodeshift helpers in `src/helpers/`:
- Import management (add, remove, check)
- JSX manipulation (rename, add/remove props, wrap)
- Prop categorization (style, transform, direct, drop)
- StyleSheet generation
- Token member expressions

See [docs/helpers-reference.md](docs/helpers-reference.md) for API documentation.

## Documentation

- **docs/jscodeshift-patterns.md** - Common patterns and techniques
- **docs/helpers-reference.md** - Helper library API reference
- **CLAUDE.md** - Project structure and development workflow

## Development

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run lint:fix      # Lint and format
```

## Note

Migrations and mappings are temporary - they'll be deleted after the NativeBase→Aurora migration is complete. The helper library (`src/helpers/`) is designed to be reusable and could potentially be extracted into a standalone package.
