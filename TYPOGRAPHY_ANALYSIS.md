# Typography Migration Analysis

## NativeBase Typography (from common)

```tsx
import { Typography } from '@hb-frontend/common/src/components'

<Typography 
  type="heading" 
  size="xl"
  color="text.primary"
  mb="lg"
  fontWeight="normal"
  testID="test"
>
  {children}
</Typography>
```

## Nordlys Typography

```tsx
import { Typography } from '@hb-frontend/app/src/components/nordlys/Typography'

<Typography 
  type="heading" 
  size="xl"
  color="text.primary"
  testID="test"
>
  {children}
</Typography>
```

Key differences:
1. **No style props** - Typography doesn't accept `mb`, `px`, `ml`, etc.
2. **No fontWeight prop** - Typography manages font weight internally via type/size
3. **Color as ColorPath** - Uses Nordlys color paths

## Migration Strategy

### Option 1: Wrap in View (Recommended)
Style props get extracted, Typography wrapped in View:

```tsx
// Before
<Typography type="heading" size="xl" mb="lg" px="sm">
  {children}
</Typography>

// After
<View style={styles.typography0}>
  <Typography type="heading" size="xl">
    {children}
  </Typography>
</View>

const styles = StyleSheet.create({
  typography0: {
    marginBottom: space.lg,
    paddingHorizontal: space.sm
  }
})
```

### Option 2: Keep Direct (Simple)
Only Typography-specific props stay, others dropped with warning:

```tsx
// Before
<Typography type="heading" size="xl" color="text.primary" mb="lg">
  {children}
</Typography>

// After  
<Typography type="heading" size="xl" color="text.primary">
  {children}
</Typography>
// Warning: Dropped props: mb
```

## Props Analysis

### Typography-Specific Props (Keep)
- `type`: heading, label, body, supporting, headline
- `size`: xs, sm, md, lg, xl, 2xl, 3xl (varies by type)
- `color`: ColorPath (e.g., text.primary)
- `align`: 'left' | 'center'
- `numberOfLines`: number
- `textDecorationLine`: 'none' | 'underline' | 'line-through'

### React Native Text Props (Pass Through)
- `testID`
- `onPress`
- `onLongPress`
- accessibility props
- `children`

### Style Props (Extract to View Wrapper)
- All spacing: m, mt, mb, ml, mr, mx, my, p, pt, pb, pl, pr, px, py
- Sizing: width, height, minWidth, maxWidth
- Flex: flex, flexGrow, flexShrink
- Position: position, top, left, right, bottom

### Props to Drop (Not Supported)
- `fontWeight` - Managed by Typography internally
- `fontSize` - Managed by Typography internally
- `lineHeight` - Managed by Typography internally
- `fontFamily` - Managed by Typography internally

## Implementation Plan

1. Create `migrate-typography.js` codemod
2. Use Option 1: Wrap in View for style props
3. Map colors using color token helper
4. Warn about dropped fontWeight/fontSize props
5. Keep Typography-specific props on element

## Real Usage Examples

From CurrencySuffixInput.tsx:
```tsx
<Typography type="label" size="sm" color="text.secondary" px="sm" fontWeight="normal">
  {placeholder}
</Typography>
```

Should become:
```tsx
<View style={styles.typography0}>
  <Typography type="label" size="sm" color="text.secondary">
    {placeholder}
  </Typography>
</View>

const styles = StyleSheet.create({
  typography0: {
    paddingHorizontal: space.sm
  }
})
// Warning: fontWeight prop not supported by Nordlys Typography
```

From ComparisonCardHeader.tsx:
```tsx
<Typography
  testID="ComparisonCardHeader-title"
  type="heading"
  size="xl"
  fontWeight="700"
>
  {title}
</Typography>
```

Should become:
```tsx
<Typography
  testID="ComparisonCardHeader-title"
  type="heading"
  size="xl"
>
  {title}
</Typography>
// Warning: fontWeight prop not supported by Nordlys Typography
```

## Questions

1. Should we wrap ALL Typography in View, or only when there are style props?
   - **Recommendation**: Only wrap when necessary
2. Should we warn about dropped fontWeight, or silently drop?
   - **Recommendation**: Warn (could be significant style change)
3. Should color paths be remapped?
   - **Recommendation**: Yes, use color token helper

