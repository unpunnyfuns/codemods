# Codemod Progress Summary

## ✅ Completed Features

### 1. Token Helper System with Nested Paths
- **File:** `src/utils/token-helpers.js`
- **Feature:** Converts string literals to token member expressions
- **Examples:**
  - `"lg"` → `space.lg`
  - `"background.secondary"` → `color.background.secondary`
  - `"white.900"` → `color.white['900']` (bracket notation for numeric keys)

### 2. Color Token Mappings
- **File:** `src/mappings/color-mappings.js`
- **Feature:** Maps NativeBase color paths to Nordlys tokens
- **Examples:**
  - `background.secondary` → stays as-is (matches Nordlys)
  - `white.900` → `white.HW1` (remapped)
  - `input.backgroundDefault` → `background.secondary` (remapped)

### 3. Box → View Migration
- **File:** `src/migrate-box.js`
- **Mappings:** `src/mappings/box-props.js`
- **Features:**
  - Extracts props to StyleSheet.create()
  - Uses token helpers for spacing (space), colors (color), and border radius (radius)
  - Handles all spacing, sizing, layout, flex, and color props
  - Drops unsupported props (pseudo-states, platform overrides)

### 4. Stack Migration (HStack/VStack → Stack)
- **File:** `src/migrate-stack.js`
- **Mappings:** `src/mappings/stack-props.js`
- **Features:**
  - Auto-detects direction (HStack → row, VStack → column)
  - `space` prop becomes `gap` on element with space token
  - Comprehensive prop mapping with token support

## 📁 Project Structure

```
src/
├── migrate-nb-component.js    # Core migration engine
├── migrate-box.js              # Box → View wrapper
├── migrate-stack.js            # Stack migration wrapper
├── hstack-to-stack.js          # Legacy HStack wrapper
├── nb-redirect.js              # Import redirects
├── shim-redirect.js            # Shim layer redirects
├── split-atoms.js              # Barrel imports → atom imports
├── mappings/
│   ├── box-props.js            # Box prop mappings
│   ├── stack-props.js          # Stack prop mappings
│   ├── color-mappings.js       # NativeBase → Nordlys colors
│   ├── common-style-props.js   # Reusable style props
│   ├── common-direct-props.js  # Reusable direct props
│   ├── common-drop-props.js    # Reusable drop props
│   └── common-value-maps.js    # Value transformations
└── utils/
    ├── formatting.js           # Code formatting
    ├── imports.js              # Import management
    ├── jsx.js                  # JSX utilities
    ├── options.js              # Option extraction
    └── token-helpers.js        # Token helper builder
```

## 🎯 Real-World Test Results

### Input (NativeBase Box):
```tsx
<Box width="100%" p="lg" bgColor="background.secondary" borderRadius="md">
  {children}
</Box>
```

### Output (Nordlys View):
```tsx
import { color, radius, space } from '@hb-frontend/nordlys'
import { StyleSheet, View } from 'react-native'

<View style={styles.box0}>{children}</View>

const styles = StyleSheet.create({
  box0: {
    width: "100%",
    padding: space.lg,
    backgroundColor: color.background.secondary,
    borderRadius: radius.md
  }
})
```

## 🚀 Usage

### Box Migration
```bash
npx jscodeshift -t src/migrate-box.js "path/to/files/**/*.{ts,tsx}" \
  --parser=tsx \
  --sourceImport='@hb-frontend/common/src/components'
```

### Stack Migration
```bash
npx jscodeshift -t src/migrate-stack.js "path/to/files/**/*.{ts,tsx}" \
  --parser=tsx
```

## 🔧 Technical Details

### Token Helper Flow
1. Prop value is string literal: `"lg"`
2. Check if `tokenHelper` is configured: `{ tokenHelper: 'space' }`
3. Apply color remapping (if `tokenHelper === 'color'`)
4. Build nested member expression: `space.lg`
5. Extract to StyleSheet or keep inline based on value type

### Value Extraction Logic
- **Literals** (strings, numbers, booleans) → StyleSheet
- **Token helpers** (space.lg, color.background.primary) → StyleSheet  
- **Variables** (props.spacing, isActive) → Inline styles
- **Functions** (getMargin()) → Inline styles

### Color Path Handling
- Dot-separated paths: `background.secondary` → nested member expressions
- Numeric keys: `white.900` → bracket notation `color.white['900']`
- Remapping: NativeBase-specific colors mapped to Nordlys equivalents

## 📋 Next Steps

1. Test Box migration on more real files
2. Create migrations for other components (Button, Input, Text, etc.)
3. Expand color mappings as more patterns are discovered
4. Add component-specific prop mappings
5. Handle edge cases (spread props, computed values, etc.)
