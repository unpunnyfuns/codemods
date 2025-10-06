# NativeBase Migration Codemods

jscodeshift transforms for NativeBase to Nordlys migration.

```bash
npm install
npm test
```

## Usage

Most transforms require `--targetImport` and `--tokenImport` flags:

```bash
#  Nordlys component transforms
./run.sh nb/button "src/**/*.tsx" \
  --sourceImport="@your/common/components" \
  --targetImport="@your/app/components/Button" \
  --tokenImport="@your/design-tokens"

# Generic React Native transforms (box, pressable)
./run.sh nb/box "src/**/*.tsx" \
  --tokenImport="@your/design-tokens"

# Split barrel imports
./run.sh nb/split-atoms "src/**/*.tsx" \
  --barrelImport="@your/common/components" \
  --atomPrefix="@your/common/components/atoms/"
```

## Options

```bash
--sourceImport   # Import path to migrate from (required for most)
--targetImport   # Import path to migrate to (required for most)
--targetName     # Component name in target (optional, defaults to component name)
--tokenImport    # Design tokens import (required for all)
--wrap           # Wrap in View for style props (default: true)
--unsafe         # Proceed with partial migration despite validation errors
```

## Known Issues

Icon drops spreads. Alert/Badge/Input skip complex children. Avatar has no letters prop.

## Implementation

Built with `@puns/shiftkit` helpers. Each transform categorizes props into `styleProps` (to StyleSheet), `transformProps` (rename on element), `directProps` (pass through), `dropProps` (remove).

Prop models in `src/nb/mappings/` define SOURCE (nativebase-props.js) to TARGET (nordlys-props.js) mappings with token conversion (space, radius, color).

Components without style prop support (Button, Switch, Avatar) auto-wrap in View when needed. Re-runnable transforms check for both source and target imports.
