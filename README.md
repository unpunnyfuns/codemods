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
  --sourceImport="@hb-frontend/common/src/components"

# Migrate Button from custom wrapper with custom target
./run.sh nb/button packages/app/src/components/molecules/CountryModal/CountryModalItem/CountryModalItem.tsx \
  --sourceImport="@hb-frontend/common/src/components" \
  --targetImport="@hb-frontend/app/src/components/nordlys/Button"
```
