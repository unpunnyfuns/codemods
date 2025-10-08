# Prop Mapping Configuration Guide

Complete reference for configuring prop mappings in migration codemods.

## Overview

Prop mappings define how JSX attributes transform during migration. Each prop is categorized into one of four types that determine its transformation behavior.

## The Four Prop Categories

### 1. Style Props

**Purpose**: Extract to StyleSheet with optional value transformation

**Format**:
```javascript
const styleProps = {
  propName: 'cssProperty',  // Simple mapping
  // OR
  propName: {
    styleName: 'cssProperty',
    valueMap: { inputValue: outputValue }  // Optional value transformation
  }
}
```

**Example**:
```javascript
const styleProps = {
  // Simple mapping
  p: 'padding',
  m: 'margin',
  bg: 'backgroundColor',

  // With value mapping
  space: {
    styleName: 'gap',
    valueMap: {
      1: 4,   // space={1} → gap: 4
      2: 8,   // space={2} → gap: 8
      3: 12,
      4: 16
    }
  },

  rounded: {
    styleName: 'borderRadius',
    valueMap: {
      none: 0,
      sm: 2,
      md: 4,
      lg: 8,
      full: 9999
    }
  }
}
```

**Transformation**:
```jsx
// Input
<Box bg="blue" p={4} space={2} rounded="md" />

// Output
import { StyleSheet } from 'react-native'
<View style={styles.view0} />

const styles = StyleSheet.create({
  view0: {
    backgroundColor: 'blue',
    padding: 4,
    gap: 8,           // space={2} mapped via valueMap
    borderRadius: 4   // rounded="md" mapped via valueMap
  }
})
```

**When to Use**:
- NativeBase shorthand style props (m, p, bg)
- Props that affect visual appearance
- Props with token scale transformations (space, rounded, shadow)

### 2. Transform Props

**Purpose**: Rename on element with optional value transformation

**Format**:
```javascript
const transformProps = {
  oldName: 'newName',  // Simple rename
  // OR
  oldName: {
    propName: 'newName',
    valueMap: { inputValue: outputValue }  // Optional value transformation
  }
}
```

**Example**:
```javascript
const transformProps = {
  // Simple rename
  isDisabled: 'disabled',
  isRequired: 'required',

  // With value mapping
  align: {
    propName: 'alignItems',
    valueMap: {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      stretch: 'stretch',
      baseline: 'baseline'
    }
  },

  justify: {
    propName: 'justifyContent',
    valueMap: {
      start: 'flex-start',
      end: 'flex-end',
      center: 'center',
      between: 'space-between',
      around: 'space-around',
      evenly: 'space-evenly'
    }
  }
}
```

**Transformation**:
```jsx
// Input
<Stack align="start" justify="between" isDisabled={true} />

// Output
<Stack alignItems="flex-start" justifyContent="space-between" disabled={true} />
```

**When to Use**:
- Props that need different names but stay on element
- Props with semantic value transformations
- Boolean flag renames (isX → X)

**Value Mapping Behavior**:
- Only applies to string literals: `align="start"` ✅
- Not to expressions: `align={value}` ❌ (passes through unchanged)
- Unmapped values pass through: `align="center"` with no mapping → `alignItems="center"`

### 3. Direct Props

**Purpose**: Pass through unchanged

**Format**:
```javascript
const directProps = ['propName1', 'propName2', ...]
```

**Example**:
```javascript
const directProps = [
  // Event handlers
  'onPress',
  'onLayout',
  'onFocus',
  'onBlur',

  // Accessibility
  'accessibilityLabel',
  'accessibilityHint',
  'accessibilityRole',
  'accessible',

  // Standard React props
  'testID',
  'children',
  'ref',
  'key'
]
```

**Transformation**:
```jsx
// Input
<Box testID="test" onPress={fn} accessibilityLabel="Label" />

// Output
<View testID="test" onPress={fn} accessibilityLabel="Label" />
```

**When to Use**:
- Standard React Native props
- Event handlers
- Accessibility props
- Props that work identically in source and target

### 4. Drop Props

**Purpose**: Remove entirely

**Format**:
```javascript
const dropProps = ['propName1', 'propName2', ...]
```

**Example**:
```javascript
const dropProps = [
  // Pseudo props
  '_hover',
  '_pressed',
  '_focus',
  '_active',
  '_disabled',

  // Platform overrides
  '_web',
  '_ios',
  '_android',

  // Theme overrides
  '_light',
  '_dark',

  // Component-specific unsupported props
  'divider',
  'rightIcon'  // Not supported in target component
]
```

**Transformation**:
```jsx
// Input
<Box _hover={{ bg: 'red' }} _pressed={{ opacity: 0.8 }} _light={{ bg: 'white' }} />

// Output
<View />
```

**When to Use**:
- NativeBase pseudo props with no equivalent
- Platform-specific overrides
- Theme mode overrides
- Props with no target component equivalent

## Common Prop Modules

Reusable prop collections in `src/mappings/`:

### Style Props (`style-props.js`)

```javascript
import { spacing, sizing, color, border, layout } from '../mappings/style-props.js'

const styleProps = {
  ...spacing,  // m, mt, mb, ml, mr, mx, my, p, pt, pb, pl, pr, px, py
  ...sizing,   // w, h, minW, minH, maxW, maxH
  ...color,    // bg, bgColor, color, borderColor
  ...border,   // borderWidth, borderRadius, borderTopWidth, etc.
  ...layout    // flex, flexDirection, flexWrap, etc.
}
```

### Direct Props (`direct-props.js`)

```javascript
import { directProps } from '../mappings/direct-props.js'

// Includes: event handlers, accessibility props, testID, children, ref
```

### Drop Props (`drop-props.js`)

```javascript
import { dropProps } from '../mappings/drop-props.js'

// Includes: pseudo props, platform overrides, theme overrides
```

### Value Maps (`value-maps.js`)

```javascript
import { alignValues, justifyValues } from '../mappings/value-maps.js'

const transformProps = {
  align: {
    propName: 'alignItems',
    valueMap: alignValues  // Reusable map
  }
}
```

## Value Mapping Details

### Numeric Literals

Value maps work with numeric literals:

```javascript
const styleProps = {
  space: {
    styleName: 'gap',
    valueMap: { 1: 4, 2: 8, 3: 12, 4: 16 }
  }
}
```

```jsx
// Input
<HStack space={2} />

// Output
<Stack style={styles.stack0} />
// styles: { gap: 8 }
```

### String Literals

Value maps work with string literals:

```javascript
const styleProps = {
  rounded: {
    styleName: 'borderRadius',
    valueMap: {
      sm: 2,
      md: 4,
      lg: 8
    }
  }
}
```

```jsx
// Input
<Box rounded="md" />

// Output
<View style={styles.view0} />
// styles: { borderRadius: 4 }
```

### Expressions

Value maps do NOT work with expressions:

```jsx
// Input
const radius = 'md'
<Box rounded={radius} />

// Output (value passes through unchanged)
<View style={styles.view0} />
// styles: { borderRadius: 'md' }  // NOT mapped to 4
```

This is intentional - only static values are transformed. Dynamic values are preserved.

### Unmapped Values

Values not in valueMap pass through:

```javascript
const transformProps = {
  align: {
    propName: 'alignItems',
    valueMap: {
      start: 'flex-start',
      // 'center' not in map
    }
  }
}
```

```jsx
// Input
<Stack align="center" />

// Output
<Stack alignItems="center" />  // Passes through unchanged
```

## Token Integration

### Color Tokens

For color props that should use Nordlys tokens:

```javascript
import { getNordlysColorPath } from '../mappings/color-mappings.js'
import { buildNestedMemberExpression } from '../utils/token-helpers.js'

// In transform logic
const colorPath = getNordlysColorPath(colorValue)  // "blue.500" → "color.blue.500"
const colorExpr = buildNestedMemberExpression(j, colorPath)  // color.blue['500']

// Add token import
addNamedImport(root, j, '@org/tokens', 'color')
```

```jsx
// Input
<Typography color="blue.500" />

// Output
import { color } from '@org/tokens'
<Typography color={color.blue['500']} />
```

### Space Tokens

For spacing that should use semantic tokens:

```javascript
const styleProps = {
  space: 'gap'  // No valueMap - preserves semantic tokens
}
```

```jsx
// Input
<HStack space="md" />  // Semantic token

// Output
<Stack style={styles.stack0} />
// styles: { gap: 'md' }  // Preserved - matches Aurora token name
```

**Note**: NativeBase and Aurora use identical semantic spacing names (xs, sm, md, lg, xl), so no transformation needed.

## Creating New Mappings

### Step 1: Choose Common Modules

Start with common prop modules:

```javascript
import { spacing, sizing, color } from '../mappings/style-props.js'
import { directProps } from '../mappings/direct-props.js'
import { dropProps } from '../mappings/drop-props.js'

const styleProps = {
  ...spacing,
  ...sizing,
  ...color
}
```

### Step 2: Add Component-Specific Props

Add props unique to this component:

```javascript
const styleProps = {
  ...spacing,
  ...sizing,
  ...color,

  // Component-specific
  iconSize: {
    styleName: 'width',  // Map to standard CSS
    valueMap: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 32
    }
  }
}
```

### Step 3: Add Transform Props

Define prop renames:

```javascript
const transformProps = {
  isCircular: 'circular',
  isRounded: 'rounded',

  variant: {
    propName: 'appearance',
    valueMap: {
      solid: 'filled',
      outline: 'outlined'
    }
  }
}
```

### Step 4: Define Drop Props

List unsupported props:

```javascript
const dropProps = [
  ...commonDropProps,
  'colorScheme',  // Not supported in target
  'rightIcon'     // Not supported in migration
]
```

### Step 5: Test

Create fixtures and verify transformations:

```javascript
// src/__testfixtures__/migrations/my-component.input.tsx
<MyComponent bg="blue" p={4} isCircular={true} colorScheme="primary" />

// src/__testfixtures__/migrations/my-component.output.tsx
import { StyleSheet } from 'react-native'
<TargetComponent style={styles.target0} circular={true} />

const styles = StyleSheet.create({
  target0: { backgroundColor: 'blue', padding: 4 }
})
```

## Decision Guide

**Should this be a style prop?**
- ✅ Affects visual appearance (color, size, spacing)
- ✅ Can be expressed in StyleSheet
- ❌ Controls component behavior (disabled, checked)
- ❌ Is an event handler (onPress)

**Should this be a transform prop?**
- ✅ Needs different name but stays on element
- ✅ Boolean flag rename (isX → X)
- ✅ Semantic value transformation (start → flex-start)
- ❌ Extracts to StyleSheet

**Should this be a direct prop?**
- ✅ Standard React Native prop
- ✅ Works identically in source and target
- ✅ Event handler or accessibility prop

**Should this be a drop prop?**
- ✅ Pseudo prop (_hover, _pressed)
- ✅ Platform override (_web, _ios)
- ✅ No equivalent in target component
- ✅ Unsupported in migration

## Examples by Component

### Box → View

```javascript
// Mostly style props
const styleProps = { ...spacing, ...sizing, ...color, ...border, ...layout }
const directProps = ['testID', 'onPress', 'onLayout']
const dropProps = ['_hover', '_pressed']
```

### Button → Button

```javascript
// Mix of all categories
const styleProps = { ...spacing, ...sizing, ...color }
const transformProps = { isDisabled: 'disabled', isLoading: 'loading' }
const directProps = ['testID', 'onPress']
const dropProps = ['leftIcon', 'rightIcon', '_hover']  // Handled separately
```

### HStack → Stack

```javascript
// Style props with value mapping
const styleProps = {
  ...spacing,
  space: { styleName: 'gap', valueMap: { 1: 4, 2: 8, 3: 12, 4: 16 } }
}

// Transform props with semantic mapping
const transformProps = {
  align: { propName: 'alignItems', valueMap: alignValues },
  justify: { propName: 'justifyContent', valueMap: justifyValues }
}
```

## Common Patterns

### Multi-Property Expansion

A single NativeBase prop maps to multiple CSS properties:

```javascript
const styleProps = {
  mx: ['marginLeft', 'marginRight'],
  my: ['marginTop', 'marginBottom'],
  px: ['paddingLeft', 'paddingRight'],
  py: ['paddingTop', 'paddingBottom']
}
```

```jsx
// Input
<Box mx={4} py={2} />

// Output
<View style={styles.view0} />
// styles: { marginLeft: 4, marginRight: 4, paddingTop: 2, paddingBottom: 2 }
```

### Conditional Mapping

Use different mappings based on component state:

```javascript
// In migration logic
const direction = componentName === 'HStack' ? 'row' : 'column'
addPropsToElement(j, path, { direction: j.literal(direction) })
```

### Default Values

Add default props when migrating:

```javascript
// Pressable gets accessibilityRole="button" by default
if (!hasAccessibilityRole) {
  addPropsToElement(j, path, {
    accessibilityRole: j.literal('button')
  })
}
```
