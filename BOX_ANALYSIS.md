# Box Component Analysis

## Sample Usage from Codebase (10+ examples)

```tsx
// 1. Basic layout with spacing
<Box mb="lg">

// 2. Margin bottom
<Box mb="xl">

// 3. Full width with padding, background, border radius
<Box width="100%" p="lg" bgColor="background.secondary" borderRadius="md">

// 4. Flex shrink
<Box flexShrink={1}>

// 5. Flex with testID
<Box flex={1}>

// 6. Multiple flex props and spacing
<Box flex={1} mt="lg" flexGrow={1} testID="Search-container">

// 7. Width, background, padding, rounded (numeric)
<Box w="100%" bg="background.secondary" p="lg" rounded={16} {...props}>

// 8. Padding horizontal, flex
<Box px="sm" flex={1}>

// 9. Flex and background
<Box flex={1} backgroundColor="background.screen">

// 10. Complex: flex, safe area, margin top (negative)
<Box flex={1} safeAreaBottom={safeAreaBottom} mt={isContentShifted ? -5 : 0} {...props}>

// 11. Background color only
<Box backgroundColor="white.900">{children}</Box>

// 12. Margin, width, rounded, background
<Box mb="sm" width="100%" rounded="md" bg="input.backgroundDefault">

// 13. Border radius with spacing, flex, padding top
<Box borderRadius="xl" mb="2xs" flex={1} pt="lg" {...props}>

// 14. Border bottom radius
<Box borderBottomRadius="xl" mb="2xs" p="lg" flex={1} {...props}>

// 15. Complex padding with conditional inset
<Box backgroundColor={bgColor} pt={0} pb={inset.bottom === 0 ? 0 : 'xl'} px="lg">
```

## Props Analysis

### Spacing (from examples)
- `mb` (marginBottom): 'lg', 'xl', 'sm', '2xs'
- `mt` (marginTop): 'lg', -5 (numeric), conditional
- `p` (padding): 'lg'
- `px` (paddingHorizontal): 'sm', 'lg'
- `pt` (paddingTop): 'lg', 0
- `pb` (paddingBottom): 'xl', conditional

### Sizing
- `width`, `w`: "100%", "full"
- `flex`: 1
- `flexGrow`: 1
- `flexShrink`: 1

### Background/Color
- `bgColor`, `bg`, `backgroundColor`: 
  - "background.secondary"
  - "background.screen"
  - "white.900"
  - "input.backgroundDefault"
  - Variable: `bgColor`

### Border Radius
- `borderRadius`: "md", "xl"
- `rounded`: "md", 16 (numeric)
- `borderBottomRadius`: "xl"
- `borderTopRadius`: "0" (from custom props)

### Safe Area
- `safeAreaBottom`: boolean/value

### Other
- `testID`: string (React Native prop)
- spread props: `{...props}`

## Migration Strategy

### Target Component
Box → View (react-native)

### Prop Mappings

**STYLE_PROPS** (extract to StyleSheet):
- All spacing props (m, mt, mb, ml, mr, mx, my, p, pt, pb, pl, pr, px, py)
  - Use `space` token helper for string literals
  - Pass through numeric values
- Sizing props (width, height, minWidth, minHeight, w, h)
- Flex props (flex, flexGrow, flexShrink, flexWrap)
- Background color (bgColor, bg, backgroundColor)
  - TODO: color token mapping
- Border radius props (borderRadius, rounded, borderTopRadius, borderBottomRadius, etc.)
  - Use `radius` token helper for string literals
  - Pass through numeric values

**DIRECT_PROPS** (pass through):
- testID
- safeAreaBottom (if supported by View)
- ...spread props

**TRANSFORM_PROPS**: None

**DROP_PROPS**:
- Any NativeBase-specific props not supported by View

### Special Cases

1. **Color paths** (e.g., "background.secondary", "white.900")
   - These are NativeBase semantic colors
   - Need to map to Nordlys color tokens
   - May require color helper: `color.background.secondary`

2. **Conditional/variable values**
   - Stay as inline styles (variables, ternaries)
   - Only extract literals to StyleSheet

3. **Custom props** (disableTopRounding, disableBottomRounding)
   - These are wrapper-specific
   - Convert to equivalent borderTopRadius/borderBottomRadius: 0


## Nordlys Pattern (Target)

Nordlys components use React Native `View` with `StyleSheet.create()` and direct token references:

```tsx
import { color, radius, space } from '@hb-frontend/nordlys'
import { StyleSheet, View } from 'react-native'

const styles = StyleSheet.create({
  container: {
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: color.background['primary-alternate'],
  },
})

<View style={styles.container}>{children}</View>
```

## Migration: NativeBase Box → React Native View

### Example Transformation

**Before (NativeBase):**
```tsx
<Box width="100%" p="lg" bgColor="background.secondary" borderRadius="md">
  {children}
</Box>
```

**After (Nordlys):**
```tsx
import { color, radius, space } from '@hb-frontend/nordlys'
import { StyleSheet, View } from 'react-native'

<View style={styles.box0}>{children}</View>

const styles = StyleSheet.create({
  box0: {
    width: '100%',
    padding: space.lg,
    backgroundColor: color.background.secondary,
    borderRadius: radius.md,
  }
})
```

## Color Token Mapping (TODO)

NativeBase semantic colors need to map to Nordlys color tokens:
- `background.secondary` → `color.background.secondary`
- `background.screen` → `color.background.screen`
- `white.900` → `color.core.neutral.HN1` (?)
- `input.backgroundDefault` → `color.input.backgroundDefault` (?)

Need to analyze Nordlys color token structure to create accurate mappings.
