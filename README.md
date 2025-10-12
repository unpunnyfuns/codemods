# NativeBase Migration Codemods

jscodeshift codemods for migrating NativeBase components

## Quick Start

```bash
npm install
# Dry-run
./run.sh nb/box
# Apply
./run.sh nb/box --apply
```

### Custom sources and targets

```bash
# Migrate Box from a wrapped NativeBase export
./run.sh nb/box "src/**/*.tsx" \
  --sourceImport="./components/common"

# Migrate Button from custom wrapper with custom target
./run.sh nb/button "src/**/*.tsx" \
  --sourceImport="./components/common" \
  --targetImport="./components/Button"
```
