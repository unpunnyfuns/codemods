# Typography Migration Test Report

## Test Summary

Tested migrate-typography.js on real files from `/Users/palnes/src/feref/packages/app/src/components/`

### ✅ Test 1: CurrencySuffixInput.tsx

**Source:** `@hb-frontend/common/src/components`
**Found:** 3 Typography components
**Result:** ✅ Success

#### Input Example 1:
```tsx
<Typography type="label" size="sm" color="text.secondary" px="sm" fontWeight="normal">
  {placeholder}
</Typography>
```

#### Output Example 1:
```tsx
<View style={styles.typography0}><Typography type="label" size="sm" color={color.text.secondary}>
  {placeholder}
</Typography></View>

const styles = StyleSheet.create({
  typography0: {
    paddingHorizontal: space.sm
  }
})
```

#### Input Example 2:
```tsx
<Typography ml="-1" size="lg" type="body" color="text.primary">
  {currencySymbol}
</Typography>
```

#### Output Example 2:
```tsx
<View style={styles.typography1}><Typography size="lg" type="body" color={color.text.primary}>
  {currencySymbol}
</Typography></View>

const styles = StyleSheet.create({
  typography1: {
    marginLeft: space['-1']
  }
})
```

**Key Features Validated:**
- ✅ View wrapping when style props present
- ✅ Style props extracted to StyleSheet
- ✅ space token helper applied
- ✅ Bracket notation for negative values: `space['-1']`
- ✅ color token helper: `"text.secondary"` → `color.text.secondary`
- ✅ fontWeight prop dropped with warning
- ✅ Typography-specific props kept on element

**Warning emitted:**
```
⚠️  Typography migration warnings:
   Typography: Dropped fontWeight prop (managed internally by Nordlys Typography)
```

### ✅ Test 2: ComparisonCardHeader.tsx

**Source:** `@hb-frontend/common/src/components`
**Found:** 2 Typography components
**Result:** ✅ Success

#### Input Example:
```tsx
<Typography
  testID="ComparisonCardHeader-title"
  type="heading"
  size="xl"
  color="text.primary"
  mb="2xs"
>
  {title}
</Typography>
```

#### Output Example:
```tsx
<View style={styles.typography0}><Typography
    testID="ComparisonCardHeader-title"
    type="heading"
    size="xl"
    color={color.text.primary}>
    {title}
  </Typography></View>

const styles = StyleSheet.create({
  typography0: {
    marginBottom: space['2xs']
  }
})
```

**Key Features Validated:**
- ✅ View wrapping only when style props present
- ✅ No wrapping for Typography without style props (subtitle example)
- ✅ Bracket notation for token values with special chars: `space['2xs']`
- ✅ testID preserved and passed through
- ✅ color path remapping: `"text.primary"` → `color.text.primary`

## Props Analysis

### Props Kept on Typography Element
- `type` - heading, label, body, etc.
- `size` - xs, sm, md, lg, xl, etc.
- `color` - ColorPath with token helper
- `align` - text alignment
- `numberOfLines` - line clamping
- `textDecorationLine` - underline, strikethrough

### Props Passed Through (React Native Text)
- `testID`
- `onPress`, `onLongPress`
- `accessibilityLabel`, `accessibilityHint`, etc.
- `children`

### Props Extracted to View Wrapper
- **Spacing:** m, mt, mb, ml, mr, mx, my, p, pt, pb, pl, pr, px, py
- **Sizing:** width, height, minWidth, maxWidth
- **Flex:** flex, flexGrow, flexShrink

### Props Dropped with Warning
- `fontWeight` - Managed internally by Nordlys Typography
- `fontSize` - Managed internally
- `lineHeight` - Managed internally
- `fontFamily` - Managed internally

## Token Helper Handling

### Color Tokens
```tsx
// Input
<Typography color="text.secondary">

// Output  
<Typography color={color.text.secondary}>
```

### Space Tokens
```tsx
// Input
<Typography px="sm" ml="-1">

// Output (style props extracted)
const styles = StyleSheet.create({
  typography0: {
    paddingHorizontal: space.sm,
    marginLeft: space['-1']  // Bracket notation for special chars
  }
})
```

### Bracket Notation Rules
- Values starting with digit: `space['2xs']`
- Values starting with dash: `space['-1']`
- Values with special chars: automatic detection
- Valid identifiers use dot notation: `space.md`

## Import Management

**Added imports:**
```tsx
import { Typography } from '@hb-frontend/app/src/components/nordlys/Typography'
import { View, StyleSheet } from 'react-native'
import { color, space } from '@hb-frontend/nordlys'
```

**Removed imports:**
```tsx
import { Typography } from '@hb-frontend/common/src/components'
```

## Migration Patterns

### Pattern 1: Typography with Style Props
```tsx
// Before
<Typography type="heading" size="xl" mb="lg" fontWeight="700">
  {text}
</Typography>

// After
<View style={styles.typography0}><Typography type="heading" size="xl">
  {text}
</Typography></View>

const styles = StyleSheet.create({
  typography0: { marginBottom: space.lg }
})
// Warning: fontWeight prop dropped
```

### Pattern 2: Typography without Style Props
```tsx
// Before
<Typography type="label" size="sm" color="text.secondary">
  {text}
</Typography>

// After (no View wrapper)
<Typography type="label" size="sm" color={color.text.secondary}>
  {text}
</Typography>
```

### Pattern 3: Typography in Ternary Expression
```tsx
// Before
{title ? (
  <Typography type="heading" size="xl" mb="2xs">
    {title}
  </Typography>
) : null}

// After (View wrapping happens correctly inside expression)
{title ? (
  <View style={styles.typography0}><Typography type="heading" size="xl">
    {title}
  </Typography></View>
) : null}
```

## Issues Fixed During Testing

### Issue 1: View Wrapper Had Typography Props
**Problem:** View was being created with type/size/color props from Typography

**Fix:** Update `path.node.openingElement.attributes` BEFORE creating View wrapper

### Issue 2: Negative Values Invalid Syntax
**Problem:** `ml="-1"` became `marginLeft: space.-1` (invalid)

**Fix:** Extended `buildNestedMemberExpression` to use bracket notation for values starting with `-`

### Issue 3: Parentheses in JSX Output
**Problem:** Output showed `<View>(<Typography>...</Typography>)</View>`

**Fix:** Clone the Typography element properly instead of passing `path.node` directly

## Command Examples

```bash
# Migrate Typography from common components
npx jscodeshift -t src/migrate-typography.js \
  "packages/app/src/**/*.{ts,tsx}" \
  --parser=tsx \
  --sourceImport='@hb-frontend/common/src/components'

# Migrate Typography from native-base
npx jscodeshift -t src/migrate-typography.js \
  "packages/app/src/**/*.{ts,tsx}" \
  --parser=tsx \
  --sourceImport='native-base'
```

## Recommendations

1. **Review warnings** - Dropped fontWeight props may have visual impact
2. **Test rendered output** - Typography manages font styling internally
3. **Run linter** - Format StyleSheet objects
4. **Verify colors** - Check color token mappings match design

## Next Steps

- ✅ Typography migration ready for production use
- 🔜 Test on more files with edge cases
- 🔜 Add migrations for: Button, Input, Pressable
- 🔜 Expand color mappings as patterns discovered
