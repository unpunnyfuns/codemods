# NativeBase vs target framework Token Comparison

This document compares the NativeBase theme tokens with target framework (nl-tokens) to understand value mappings for codemods.

## Spacing Scale

### NativeBase (nb-theme)
```typescript
space: {
  '2xs': '2px',   // 2
  'xs': '4px',    // 4
  'sm': '8px',    // 8
  'md': '12px',   // 12
  'lg': '16px',   // 16
  'xl': '32px',   // 32
  '2xl': '64px',  // 64
  '3xl': '128px', // 128
  '14': '56px',   // 56
  '18': '72px',   // 72
}
```

### target framework (nl-tokens)
```typescript
space: {
  zero: 0,         // dimension[0]
  '2xs': 2,        // dimension[1]
  xs: 4,           // dimension[2]
  sm: 8,           // dimension[3]
  md: 12,          // dimension[5]
  lg: 16,          // dimension[7]
  xl: 32,          // dimension[13]
  '2xl': 64,       // dimension[17]
  '3xl': 128,      // dimension[18]
}

dimension: {
  '0': 0,
  '1': 2,
  '2': 4,
  '3': 8,
  '4': 10,
  '5': 12,
  '6': 14,
  '7': 16,
  '8': 20,
  '9': 24,
  '10': 25,
  '11': 28,
  '12': 30,
  '13': 32,
  '14': 40,
  '15': 44,
  '16': 48,
  '17': 64,
  '18': 128,
}
```

**Mapping:**
- ✅ 2xs, xs, sm, md, lg, xl, 2xl, 3xl to **IDENTICAL MAPPING** (no transformation needed for semantic names)
- ⚠️ NativeBase '14' (56px) to No direct target framework equivalent (dimension[14] = 40px, would need dimension[15]=44 or custom)
- ⚠️ NativeBase '18' (72px) to No direct target framework equivalent

## Border Radius

### NativeBase
```typescript
radii: {
  sm: 4,
  md: 8,
  lg: 12,
}
```

### target framework
```typescript
radius: {
  sm: 4,   // space.xs
  md: 8,   // space.sm
  lg: 12,  // space.md
  xl: 24,  // dimension[9]
  '2xl': 32, // space.xl
}
```

**Mapping:**
- ✅ sm, md, lg to **IDENTICAL VALUES** (no transformation needed)
- ℹ️ target framework has additional xl (24) and 2xl (32) that NativeBase doesn't use

## Colors

### NativeBase Structure
- **Base colors**: Numeric scales 0-900 (e.g., `blue.600`, `gray.300`)
- **Semantic colors**: Structured tokens (e.g., `background.primary`, `button.solid.primary.default`)
- Uses hex values directly

Example:
```typescript
blue: {
  0: '#E8F3FC',
  100: '#D4E8FA',
  200: '#91C2F2',
  ...
  600: '#0056B2',
  ...
  900: '#003166',
}
```

### target framework Structure
- **Core colors**: HB/HN prefixed scales 1-10 (e.g., `core.blue.HB6`, `core.neutral.HN5`)
- **Extended colors**: HG/HR/HY prefixed scales 1-10 (e.g., `extended.green.HG6`)
- Uses hex values directly

Example:
```typescript
core: {
  blue: {
    HB1: '#001B2D',
    HB2: '#002D4D',
    ...
    HB6: '#0096FF',
    ...
    HB10: '#E8F3FC',
  }
}
```

**Mapping Challenge:**
- ⚠️ **REQUIRES MANUAL MAPPING**: NativeBase numeric scales (0-900) don't directly correspond to target framework scales (1-10)
- ⚠️ Need to determine which NativeBase colors map to which target framework tokens
- Example potential mapping (needs verification):
  - `blue.600` to `core.blue.HB5` or `HB6`?
  - `blue.0` to `core.blue.HB10`?
  - `gray.300` to `core.neutral.HN?`?

## Props That Need Value Mapping

Based on these tokens, here are the props that will need value transformations:

### 1. Spacing Props (IDENTICAL - no transformation needed)
```javascript
// NativeBase to target framework (same values)
space="2xs"  to gap: 2
space="xs"   to gap: 4
space="sm"   to gap: 8
space="md"   to gap: 12
space="lg"   to gap: 16
space="xl"   to gap: 32
space="2xl"  to gap: 64
space="3xl"  to gap: 128

// Also applies to: m, mt, mb, ml, mr, mx, my, p, pt, pb, pl, pr, px, py
```

### 2. Border Radius (IDENTICAL - no transformation needed)
```javascript
rounded="sm" to borderRadius: 4
rounded="md" to borderRadius: 8
rounded="lg" to borderRadius: 12
```

### 3. Colors (REQUIRES MANUAL MAPPING)
```javascript
// Example - needs verification:
bg="blue.600"      to backgroundColor: '#0056B2' or core.blue.HB?
bg="primary.500"   to backgroundColor: ??? (need semantic mapping)
color="gray.300"   to color: core.neutral.HN?
```

## target framework Token Architecture

target framework uses a sophisticated 3-tier token system:

**1. Reference Tokens** (raw values):
```typescript
core.blue.HB4 = '#005FA5'  // actual hex value
```

**2. System Tokens** (semantic layer):
```typescript
interactive.primary = core.blue.HB4
background.primary = core.neutral.HN9
text.primary = core.neutral.HN2
```

**3. Component Tokens** (component-specific):
```typescript
button.background.primary.default = interactive.primary
button.text.primary.default = text.inverse
```

**4. Helper Function**:
```typescript
getColorFromPath('interactive.primary') // returns '#005FA5'
```

## Recommended Approach

**PRIORITY: String literal transformations only**

1. ✅ **Spacing/Radius**: No value transformation - keep as-is
   - Semantic tokens: `space="md"` to `gap: 'md'` (kept as string)
   - Numeric values: `space={4}` to `gap: 4` (kept as number)
   - Both semantic and numeric used in codebase - pass through unchanged

2. ⏳ **Colors - Defer for Later**:
   - Map NativeBase semantic colors to target framework system tokens
   - Example: `themeColors.button.solid.primary.default` to `color.interactive.primary`
   - Use target framework's 3-tier system (reference to system to component)
   - Can use `getColorFromPath()` helper at runtime

## Files to Update

Once mappings are determined:
- `src/mappings/common-value-maps.js` - Add color mappings
- `src/mappings/common-style-props.js` - Already has spacing/radius (no changes needed)
- Component-specific mappings as needed

## Next Steps

1. ✅ Spacing/radius mappings confirmed (no transformation needed)
2. ⚠️ Determine color token mapping strategy
3. ⚠️ Create color value map if going with Option A
4. 🗑️ Delete nb-theme and nl-tokens folders when done
