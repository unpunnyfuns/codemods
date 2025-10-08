# NativeBase Migration Codemods

Automated transformations for migrating NativeBase components to Aurora/Nordlys design system using jscodeshift.

## Quick Start

```bash
npm install
./run.sh <codemod> "path/to/files/**/*.{ts,tsx}"
```

## Available Codemods

### Migrations

Transform NativeBase components to Aurora/Nordlys equivalents with prop mapping and StyleSheet extraction:

| Codemod | Description | Example |
|---------|-------------|---------|
| `migrate-avatar` | Avatar → Nordlys Avatar with icon/image object transformation | `<Avatar source={uri} />` → `<Avatar image={{ uri }} />` |
| `migrate-box` | Box → View with StyleSheet | `<Box bg="blue.500" p={4} />` → `<View style={styles.box0} />` |
| `migrate-button` | Button → Nordlys Button with icon extraction | `<Button leftIcon={<Icon />}>Text</Button>` → `<Button icon={<Icon />}>Text</Button>` |
| `migrate-pressable` | Pressable → React Native Pressable with StyleSheet | `<Pressable bg="blue" />` → `<Pressable style={styles.pressable0} />` |
| `migrate-stack` | HStack/VStack → Aurora Stack with direction | `<HStack space={2} />` → `<Stack direction="horizontal" gap={8} />` |
| `migrate-switch` | Switch → Nordlys Switch with View wrapper | `<Switch isChecked={x} />` → `<View><Switch checked={x} /></View>` |
| `migrate-typography` | Typography → Nordlys Typography with token imports | `<Typography color="blue.500" />` → `<Typography color={color.blue[500]} />` |

### Transforms

General-purpose code transformations:

| Codemod | Description | Example |
|---------|-------------|---------|
| `redirect-imports` | Redirect import paths | `from 'native-base'` → `from '@org/common/src/components/native-base'` |
| `split-atoms` | Split barrel imports into individual atom imports | `import { Box } from '@org/common'` → `import { Box } from '@org/common/atoms/Box'` |

## Usage Examples

### Basic Migration

```bash
# Migrate all Box components
./run.sh migrate-box "src/**/*.tsx"

# Migrate HStack/VStack to Stack
./run.sh migrate-stack "src/components/**/*.tsx"
```

### Import Redirects

```bash
# Redirect NativeBase imports to shim
./run.sh redirect-imports "src/**/*.tsx" \
  --sourceImport="native-base" \
  --targetImport="@org/common/src/components/native-base"

# Split barrel imports
./run.sh split-atoms "src/**/*.tsx"
```

### Custom Options

Some codemods accept options via `--optionName=value`:

```bash
# Redirect with component renaming
./run.sh redirect-imports "src/**/*.tsx" \
  --sourceImport="native-base" \
  --targetImport="@new/path" \
  --sourceName="Box" \
  --targetName="Container"
```

## Project Structure

| Path | Description |
|------|-------------|
| `src/migrations/` | Component-specific migration codemods |
| `src/transforms/` | General-purpose transformation codemods |
| `src/mappings/` | Shared prop mapping configurations |
| `src/utils/` | Shared utilities (imports, JSX, props, tokens) |
| `src/__tests__/` | Vitest tests organized by codemod type |
| `src/__testfixtures__/` | Input/output fixture pairs for testing |
| `docs/` | Architecture and implementation documentation |
| `run.sh` | Wrapper script with auto-formatting via Biome |

## Testing

```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
```

Tests use fixture-based snapshot testing with normalized jscodeshift formatting.

## Development

```bash
npm install           # Install dependencies
npm run lint          # Lint all files
npm run lint:fix      # Fix and format with Biome
```

## Documentation

- **CLAUDE.md** - Detailed architecture, prop mapping guide, and development workflow
- **docs/** - In-depth technical documentation (coming soon)
- **TOKEN_COMPARISON.md** - Design token mapping reference
- **COLOR_MAPPING.md** - Color system migration guide

## How Migrations Work

All migration codemods follow the same pattern:

1. Parse source with jscodeshift
2. Find target JSX elements
3. Categorize props into: styleProps (→ StyleSheet), transformProps (→ renamed), directProps (→ pass through), dropProps (→ removed)
4. Transform elements and extract styles
5. Add StyleSheet.create() and necessary imports
6. Return formatted source

See CLAUDE.md for detailed prop mapping configuration guide.
