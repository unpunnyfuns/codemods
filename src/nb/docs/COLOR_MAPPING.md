# NativeBase to target framework Color Token Mapping

## NativeBase Color Patterns Found in Codebase

From actual usage:
- `background.primary`
- `background.secondary`
- `background.screen`
- `white.900`
- `input.backgroundDefault`
- `avatar.success`
- `avatar.info`
- `avatar.default`

## target framework Color Structure

### System Tokens (semantic)
```typescript
color.background.primary           // HN9 - F6F5EE (light beige)
color.background['primary-alternate']  // HB9 - C8E8FF (light blue)
color.background.secondary         // HW1 - FFFFFF (white)
color.background.tertiary          // HN2 - 34322D (dark)
color.background.screen            // HB2 - 002D4D (dark blue)

color.text.primary                 // HN2 - 34322D
color.text.secondary               // HN4 - 67645F
color.text.inverse                 // HW1 - FFFFFF

color.interactive.primary          // HB4 - 005FA5
color.interactive.secondary        // HB9 - C8E8FF
color.interactive.disabled         // HN9 - F6F5EE

color.feedback.success.default     // HG7
color.feedback.error.default       // HR7
color.feedback.warning.default     // HY7
color.feedback.info.default        // HB7
```

### Reference Tokens (core palette)
```typescript
color.white.HW1                    // #FFFFFF
color.core.blue.HB1-HB10          // Blues
color.core.neutral.HN1-HN10       // Neutrals
color.extended.green.HG1-HG10     // Greens
color.extended.red.HR1-HR10       // Reds
color.extended.yellow.HY1-HY10    // Yellows
```

## Proposed Mappings

### Direct Mappings (Same Path)
```javascript
'background.primary' to color.background.primary
'background.secondary' to color.background.secondary
'background.screen' to color.background.screen
```

### NativeBase-Specific Mappings (Need Research)
```javascript
// These need to be verified against NativeBase theme:
'white.900' to color.white.HW1  // (probably)
'input.backgroundDefault' to color.background.secondary  // (guess)
'avatar.success' to color.feedback.success.default  // (guess)
'avatar.info' to color.feedback.info.default  // (guess)
'avatar.default' to color.background.tertiary  // (guess)
```

## Implementation Strategy

### Option 1: Use `color` token helper for all color props
```javascript
// STYLE_PROPS with color token helper
bgColor: { styleName: 'backgroundColor', tokenHelper: 'color' }
```

Transforms:
- `bgColor="background.secondary"` to `backgroundColor: color.background.secondary`
- `bg="white.900"` to `backgroundColor: color.white['900']` (need special handling for numeric paths)

### Option 2: Direct string mapping without token helper
```javascript
// STYLE_PROPS with value mapping
bgColor: { 
  styleName: 'backgroundColor',
  valueMap: {
    'background.primary': 'color.background.primary',
    'background.secondary': 'color.background.secondary',
    // ... etc
  }
}
```

This won't work because valueMap produces literals, not member expressions.

### Option 3: Hybrid approach
- Keep semantic colors as strings (they match)
- Map NativeBase-specific colors to target framework equivalents
- Use color token helper to convert strings to member expressions

## Recommended Approach

**Use color token helper with path conversion:**

1. For props like `bgColor`, `bg`, `backgroundColor`:
   - Add `tokenHelper: 'color'`
   - Convert string literal to nested member expression
   - `"background.secondary"` to `color.background.secondary`
   - `"white.900"` to `color.white['900']` (numeric keys need bracket notation)

2. Handle dot-separated paths:
   - Split on `.`
   - Build nested member expression
   - Use bracket notation for numeric keys

3. Pre-map NativeBase-specific colors to target framework paths:
   - Create mapping for avatar.*, input.*, etc.
   - Apply mapping before token helper conversion

## Next Steps

1. Extend tokenHelper to support nested paths (e.g., "background.secondary")
2. Create NativeBase to target framework color mapping table
3. Add special handling for numeric keys in paths (use bracket notation)
4. Test with real codebase examples
