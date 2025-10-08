# Codemod Architecture

This document describes the architecture and design principles of the NativeBase migration codemod system.

## Overview

The codemod system is built on jscodeshift and follows a shared-utility architecture where component-specific migrations compose reusable utilities for AST transformation, import management, and prop categorization.

## System Components

### 1. Migrations (`src/migrations/`)

Component-specific transformations that migrate NativeBase components to Aurora/Nordlys equivalents.

Each migration follows this structure:

```javascript
// Import shared utilities
import { addNamedImport, removeNamedImport } from '../utils/imports.js'
import { addOrExtendStyleSheet, categorizeProps } from '../utils/props.js'
import { addStyleProp, updateElementName } from '../utils/jsx-transforms.js'

// Import prop mappings
import { directProps } from '../mappings/direct-props.js'
import { dropProps } from '../mappings/drop-props.js'
import { spacing, sizing } from '../mappings/style-props.js'

// Define component-specific prop mappings
const styleProps = { ...spacing, ...sizing, /* component-specific */ }
const transformProps = { /* prop renames */ }

// Main transform function
function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Find JSX elements
  root.findJSXElements('ComponentName').forEach(path => {
    // Categorize props
    const categorized = categorizeProps(path, {
      styleProps,
      transformProps,
      directProps,
      dropProps
    })

    // Transform element
    // Add/update imports
    // Extract styles to StyleSheet
  })

  return root.toSource()
}

export default main
```

### 2. Transforms (`src/transforms/`)

General-purpose transformations that don't involve component migration:

- **redirect-imports.js** - Changes import paths and optionally renames imports
- **split-atoms.js** - Splits barrel imports into individual atom imports

### 3. Utilities (`src/utils/`)

Reusable functions for AST manipulation:

| Utility | Purpose |
|---------|---------|
| `imports.js` | Import management (add, remove, match paths) |
| `props.js` | Prop categorization and StyleSheet generation |
| `jsx-transforms.js` | JSX element manipulation (rename, add/remove props, wrap) |
| `jsx-extraction.js` | Extract props and children from JSX elements |
| `token-helpers.js` | Build token import expressions (e.g., `color.blue['500']`) |

### 4. Mappings (`src/mappings/`)

Declarative configuration for prop handling:

| Mapping | Purpose |
|---------|---------|
| `style-props.js` | Spacing, sizing, color, border, layout props → StyleSheet |
| `direct-props.js` | Event handlers, accessibility props → pass through unchanged |
| `drop-props.js` | Pseudo props, platform overrides → removed |
| `value-maps.js` | Token scale transformations (dimensions, borders) |
| `color-mappings.js` | NativeBase → Nordlys color path mappings |

## Prop Categorization

The core of the migration system is **prop categorization** - classifying each JSX attribute into one of four categories:

### 1. Style Props

**Extract to StyleSheet** with optional value mapping.

```javascript
const styleProps = {
  space: { styleName: 'gap', valueMap: { 1: 4, 2: 8 } },
  bg: 'backgroundColor',
  p: 'padding'
}
```

Input: `<Box bg="blue" p={4} space={2} />`

Output:
```jsx
<View style={styles.view0} />

const styles = StyleSheet.create({
  view0: { backgroundColor: 'blue', padding: 4, gap: 8 }
})
```

### 2. Transform Props

**Rename on element** with optional value mapping.

```javascript
const transformProps = {
  isDisabled: 'disabled',
  align: { propName: 'alignItems', valueMap: { start: 'flex-start' } }
}
```

Input: `<Stack align="start" isDisabled={false} />`

Output: `<Stack alignItems="flex-start" disabled={false} />`

### 3. Direct Props

**Pass through unchanged** - standard React Native props.

```javascript
const directProps = ['testID', 'onPress', 'accessibilityLabel']
```

Input: `<Box testID="test" onPress={fn} />`

Output: `<View testID="test" onPress={fn} />`

### 4. Drop Props

**Remove entirely** - NativeBase-specific props with no equivalent.

```javascript
const dropProps = ['_hover', '_pressed', '_light', '_dark']
```

Input: `<Box _hover={{ bg: 'red' }} _pressed={{ opacity: 0.8 }} />`

Output: `<View />`

## Token System

The token system transforms string literals into token import expressions.

### Token Helpers (`utils/token-helpers.js`)

**buildNestedMemberExpression** - Builds AST for token paths:

```javascript
buildNestedMemberExpression(j, 'color.blue.500')
// => color.blue['500']

buildNestedMemberExpression(j, 'space.md')
// => space.md
```

Handles numeric keys with bracket notation: `color.blue['500']` instead of `color.blue.500` (invalid JS).

### Color Mappings (`mappings/color-mappings.js`)

Maps NativeBase color strings to Nordlys token paths:

```javascript
getNordlysColorPath('blue.500')
// => 'color.blue.500'

getNordlysColorPath('primary.600')
// => 'color.primary.600'
```

### Usage in Migrations

```javascript
// Before
<Typography color="blue.500" />

// After (with token import)
import { color } from '@org/tokens'
<Typography color={color.blue['500']} />
```

## StyleSheet Generation

Migrations extract style props to StyleSheet.create() using `addOrExtendStyleSheet`:

### Single Element

```javascript
// Before
<Box bg="blue" p={4} />

// After
import { StyleSheet } from 'react-native'
<View style={styles.view0} />

const styles = StyleSheet.create({
  view0: { backgroundColor: 'blue', padding: 4 }
})
```

### Multiple Elements

```javascript
// Before
<Box bg="blue" p={4}>
  <Box mt={8} />
</Box>

// After
<View style={styles.view0}>
  <View style={styles.view1} />
</View>

const styles = StyleSheet.create({
  view0: { backgroundColor: 'blue', padding: 4 },
  view1: { marginTop: 8 }
})
```

### Implementation

```javascript
const styleIdentifier = addOrExtendStyleSheet(
  root,
  j,
  'view',  // style key prefix
  { backgroundColor: 'blue', padding: 4 }  // style properties
)
// Returns: styles.view0

// Later in the file
addOrExtendStyleSheet(root, j, 'view', { marginTop: 8 })
// Returns: styles.view1
```

Creates or extends existing StyleSheet.create() with new style objects. Auto-increments counter for unique keys (view0, view1, view2...).

## Import Management

### Adding Imports

```javascript
addNamedImport(root, j, 'react-native', 'View')
// import { View } from 'react-native'

addNamedImport(root, j, 'react-native', 'StyleSheet')
// import { StyleSheet, View } from 'react-native'
```

**Smart merging**: Adds to existing import declaration if one exists, creates new one otherwise.

### Removing Imports

```javascript
removeNamedImport(root, j, 'native-base', 'Box')
```

Removes the named import and cleans up the import declaration:
- If last specifier: removes entire import declaration
- Otherwise: just removes the specifier

### Checking Imports

```javascript
if (hasNamedImport(root, j, 'react-native', 'View')) {
  // View is already imported
}
```

### Matching Import Paths

```javascript
matchesImportPath('native-base', 'native-base')  // true
matchesImportPath('@org/components', '@org/components/')  // true (trailing slash)
```

Handles trailing slash normalization for consistent matching.

## JSX Transformations

### Element Updates

```javascript
// Rename element
updateElementName(path, 'Stack')
// <Box> => <Stack>

// Add props
addPropsToElement(j, path, { testID: j.literal('test'), disabled: j.literal(true) })
// <Stack> => <Stack testID="test" disabled={true}>

// Remove props
removePropsFromElement(path, ['_hover', '_pressed'])
// <Stack _hover={{}} _pressed={{}}> => <Stack>

// Add style prop
addStyleProp(j, path, j.memberExpression(j.identifier('styles'), j.identifier('stack0')))
// <Stack> => <Stack style={styles.stack0}>
```

### Element Wrapping

```javascript
// Wrap in View
createViewWrapper(j, path, styles.view0)
// <Switch /> => <View style={styles.view0}><Switch /></View>
```

Used when target component needs a container (e.g., Switch doesn't support style prop directly).

## Value Mapping

Value mapping transforms prop values based on configuration.

### Numeric Value Maps

Used for token scale transformations:

```javascript
const styleProps = {
  space: {
    styleName: 'gap',
    valueMap: { 1: 4, 2: 8, 3: 12, 4: 16 }
  }
}
```

Input: `space={2}` → Output: `gap: 8`

### String Value Maps

Used for semantic transformations:

```javascript
const transformProps = {
  align: {
    propName: 'alignItems',
    valueMap: {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center'
    }
  }
}
```

Input: `align="start"` → Output: `alignItems="flex-start"`

### Unmapped Values

Values not in valueMap pass through unchanged:

```javascript
// With valueMap: { start: 'flex-start' }
align="center"  // No mapping defined
// Passes through as: alignItems="center"
```

## Testing

### Fixture-Based Testing

Tests use input/output fixture pairs:

```
src/__testfixtures__/
  migrations/
    box.input.tsx       # Input fixture
    box.output.tsx      # Expected output fixture
```

Test runs transform on input and compares to output:

```javascript
import { testTransform } from '../test-helper.js'

it('migrates Box to View', () => {
  const output = testTransform('migrations/box', 'migrations/box', 'tsx')
  expect(output).toMatchSnapshot()
})
```

### Normalized Snapshots

Snapshots are normalized via jscodeshift round-trip to ensure consistent formatting:

```javascript
function normalizeFormatting(source) {
  const j = jscodeshift.withParser('tsx')
  const ast = j(source)
  return ast.toSource()
}
```

Prevents formatting differences from causing test failures.

## Design Principles

### 1. Composition Over Inheritance

Migrations compose shared utilities rather than extending base classes. Each utility has a single responsibility.

### 2. Declarative Configuration

Prop mappings are declarative data structures, not imperative code. This makes them easy to understand and modify.

### 3. Shared Vocabularies

Common prop categories (spacing, sizing, color, etc.) are defined once and reused across migrations. This ensures consistency and reduces duplication.

### 4. AST-First

All transformations operate on AST nodes, never string manipulation. This ensures correctness and preserves code structure.

### 5. Safe Defaults

Migrations use conservative defaults:
- Unknown props pass through unchanged
- Unmapped values pass through unchanged
- Failed extractions log warnings but don't crash

### 6. Stateless Transforms

Each codemod is a pure function: `(fileInfo, api, options) => string`. No global state, no side effects.

## Module Boundaries

### Migrations → Utilities

Migrations **depend on** utilities for AST manipulation. Utilities **never depend on** migrations.

### Mappings → Nothing

Mappings are pure data with no dependencies. They export constants and simple lookup functions.

### Utilities → Mappings

Some utilities (like `categorizeProps`) accept mapping configurations but don't import specific mappings directly.

### Tests → Everything

Tests import migrations, utilities, and mappings as needed for verification.

## Performance

All codemods run in **O(n)** time where n = number of AST nodes:
- Single pass over AST to find target elements
- Constant-time prop categorization (hash map lookups)
- Linear StyleSheet merging (one StyleSheet per file)

Typical performance:
- Small file (~100 LOC): < 10ms
- Medium file (~500 LOC): 20-50ms
- Large file (~2000 LOC): 100-200ms

## Extending the System

See CLAUDE.md for detailed guide on creating new component migrations.

Quick summary:
1. Create prop mappings in `src/mappings/`
2. Create migration in `src/migrations/`
3. Add test fixtures in `src/__testfixtures__/migrations/`
4. Add test in `src/__tests__/migrations/`
5. Update `run.sh` case statement
