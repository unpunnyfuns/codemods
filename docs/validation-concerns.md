# Validation Concerns

## Current State

`validateStyleValue()` in props.js mixes multiple validation concerns:

### 1. Platform Validation (Safe)
- Checks if prop is valid on React Native View
- Uses positive list from `react-native-props.js`
- **Status**: ✅ Clean, using platform model

### 2. Prop-Specific Constraints (Safe)
- Dimension props can't use semantic tokens like "sm", "md"
- Numeric props must be numbers, not strings
- Uses `DIMENSION_PROPS`, `NUMERIC_ONLY_PROPS` from nordlys-props.js
- **Status**: ✅ Valid constraints from target model

### 3. Token Validation (Safe)
- space/radius tokens must be in valid token lists
- Catches invalid tokens like `space.invalid` or `space['999']`
- **Status**: ✅ Enforces Nordlys token system

### 4. Value Format Validation (Questionable)
- Catches `"2px"`, `"0"`, `"230px"` string values
- Catches numeric strings like `"1"` on numeric props
- **Status**: ⚠️ Compensating for bad source data?

## Problem: Value Format Validation

Lines 83-96 in validateStyleValue():

```javascript
// Flag "0", "1", "2px", "230px" but allow percentages
if (/^\d+px$/.test(val) || (/^\d+$/.test(val) && !val.endsWith('%'))) {
  return { isValid: false, reason: `"${val}"` }
}

// Semantic tokens like "sm" aren't valid for dimension props that expect numbers
if (dimensionProps.includes(styleName) && validSpaceTokens.includes(val)) {
  return { isValid: false, reason: `"${val}"` }
}

// Numeric props shouldn't be strings
if (numericProps.includes(styleName) && /^\d+(\.\d+)?$/.test(val)) {
  return { isValid: false, reason: `"${val}"` }
}
```

These catch cases like:
- `p="4"` → Invalid (should be `p={4}`)
- `borderWidth="1"` → Invalid (should be `borderWidth={1}`)
- `width="230px"` → Invalid (should be `width={230}` or `width="230"`)

**Question**: Should we transform these instead of failing validation?

### Option A: Keep as Validation (Current)
- Forces user to fix source code
- Prevents introducing type errors
- Conservative approach

### Option B: Transform Automatically (Risky)
- `p="4"` → `p={4}`
- `borderWidth="1"` → `borderWidth={1}`
- `width="230px"` → `width={230}`
- Could introduce runtime errors if assumptions wrong

## Recommendation

**Keep current validation** - It's catching real issues in source data.

But add `--unsafe` flag support for risky transformations:
- Auto-convert string numbers to numeric literals
- Auto-strip "px" suffix
- Skip validation warnings

This lets users opt-in to aggressive migration with the understanding they'll need to fix type errors.

## Future Work

If we add `--unsafe` flag:

1. Add `unsafe` parameter to transform functions
2. Skip value format validation when `unsafe=true`
3. Add transformation logic to convert problematic values
4. Document that `--unsafe` may break type checking
5. Recommend running type checker after unsafe migration

## Architecture Notes

Current separation of concerns:
- **react-native-props.js** - Platform constraints (what RN supports)
- **nordlys-props.js** - Target constraints (what Nordlys expects)
- **props.js** - Validation logic combining both models
- **Value format checks** - Source data quality issues (keep as validation)

This is clean. Don't refactor validation logic unless adding unsafe mode.
