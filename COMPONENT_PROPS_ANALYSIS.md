# NativeBase Component Props Analysis

Systematic catalog of NativeBase component props to build comprehensive migration mappings.

## Analysis Categories

For each component, props are categorized as:
- **STYLE_PROPS**: Extract to StyleSheet.create() (visual styles)
- **TRANSFORM_PROPS**: Rename on element (can't go in StyleSheet)
- **DIRECT_PROPS**: Pass through unchanged (React Native props, testID, etc.)
- **DROP_PROPS**: Remove entirely (NativeBase-specific, unsupported in Aurora)

## Primitives (29 components)

### Box

**File**: `src/components/primitives/Box/types.ts`

**Extends**: ViewProps, SafeAreaProps, PlatformProps, StyledProps

**Props**:
- `children` - DIRECT (React prop)
- `_text` - DROP (NativeBase pseudo-prop for nested styling)
- `bg`, `background`, `bgColor`, `backgroundColor` - STYLE_PROPS with special handling:
  - Supports ColorType tokens
  - Supports ILinearGradientProps (drop or transform?)

**Notes**:
- Box is the fundamental layout component
- Extends StyledProps (all common style props available: m, p, spacing, layout, etc.)
- Uses _text pseudo-prop pattern (should be dropped in Aurora)

### Button

**File**: `src/components/primitives/Button/types.ts`

**Extends**: InterfacePressableProps, which includes StyledProps

**Props**:
- `colorScheme` - DROP? (NativeBase theme system)
- `variant` - DROP? (NativeBase variant system)
- `isLoading`, `isHovered`, `isPressed`, `isFocused`, `isFocusVisible` - DIRECT? (state props)
- `size` - DROP? (NativeBase size tokens)
- `startIcon`, `endIcon`, `leftIcon`, `rightIcon` - TRANSFORM? (icon placement)
- `isLoadingText` - DIRECT
- `spinner` - DIRECT
- `isDisabled` - DIRECT
- `spinnerPlacement` - DIRECT
- `_text` - DROP (pseudo-prop)
- `_stack` - DROP (pseudo-prop)
- `_icon` - DROP (pseudo-prop)
- `_loading` - DROP (pseudo-prop)
- `_disabled` - DROP (pseudo-prop)
- `_spinner` - DROP (pseudo-prop)
- `_hover` - DROP (pseudo-prop)
- `_pressed` - DROP (pseudo-prop)
- `_focus` - DROP (pseudo-prop)

**Notes**:
- Button has MANY pseudo-props (_text, _stack, _icon, _loading, _disabled, _spinner, _hover, _pressed, _focus)
- All pseudo-props should be dropped (Aurora doesn't support this pattern)
- ColorScheme/variant/size are NativeBase theme system - need to decide how to handle

### Text

**File**: `src/components/primitives/Text/types.tsx`

**Extends**: PlatformProps, StyledProps, TextProps (RN)

**Props**:
- `children` - DIRECT
- `fontSize` - STYLE_PROPS (ResponsiveValue<IFontSize | number>)
- `letterSpacing` - STYLE_PROPS
- `lineHeight` - STYLE_PROPS
- `fontWeight` - STYLE_PROPS
- `font` - STYLE_PROPS? (ResponsiveValue<IFont>)
- `noOfLines` - DIRECT (maps to numberOfLines in RN)
- `bold` - TRANSFORM to fontWeight: 'bold'
- `isTruncated` - TRANSFORM? (ellipsizeMode)
- `italic` - TRANSFORM to fontStyle: 'italic'
- `underline` - TRANSFORM to textDecorationLine: 'underline'
- `strikeThrough` - TRANSFORM to textDecorationLine: 'line-through'
- `sub` - DROP or TRANSFORM?
- `highlight` - DROP (unsupported in RN)

**Notes**:
- Many boolean convenience props (bold, italic, underline, etc.) need transformation to CSS values
- Typography tokens (fontSize, fontWeight, etc.) may need value mapping

### Stack (HStack/VStack)

**Already analyzed** - see `src/mappings/stack-props.js`

**Props**:
- `space` - STYLE_PROPS → gap
- `direction` - STYLE_PROPS → flexDirection
- `align` - STYLE_PROPS → alignItems (with value mapping)
- `justify` - STYLE_PROPS → justifyContent (with value mapping)
- `reversed` - TRANSFORM → reverse
- `divider` - DROP
- `_text` - DROP
- `_stack` - DROP

## Common Patterns

### Pseudo-Props (_text, _stack, _icon, etc.)
NativeBase uses pseudo-props for nested component styling:
```typescript
<Button _text={{ fontSize: 'lg' }} _icon={{ color: 'blue.500' }}>
```

**Action**: DROP all pseudo-props. Aurora doesn't support this pattern.

### ResponsiveValue<T>
NativeBase supports responsive props:
```typescript
fontSize={{ base: 'sm', md: 'lg' }}
```

**Action**: Need to decide - keep responsive values or flatten to single value?

### StyledProps
All components extend StyledProps, which includes:
- Spacing: m, mt, mb, ml, mr, mx, my, p, pt, pb, pl, pr, px, py
- Layout: w, h, minW, minH, maxW, maxH, display, flex, flexDirection, etc.
- Border: border, borderRadius, borderColor, borderWidth, etc.
- Position: position, top, right, bottom, left, zIndex, etc.
- Color: bg, color, etc.

**Action**: Map to STYLE_PROPS (common-style-props.js already handles most of these)

### Input

**File**: `src/components/primitives/Input/types.ts`

**Extends**: PlatformProps, TextInputProps (RN), StyledProps

**Props**:
- `isInvalid`, `isDisabled`, `isHovered`, `isFocused`, `isRequired`, `isReadOnly`, `isFullWidth` - DIRECT (state props)
- `variant` - DROP (NativeBase variant system)
- `size` - DROP (NativeBase size tokens)
- `InputLeftElement`, `leftElement`, `InputRightElement`, `rightElement` - TRANSFORM? (Aurora may have different pattern)
- `type` - DIRECT (text/password)
- `wrapperRef` - DIRECT
- `focusOutlineColor`, `invalidOutlineColor` - STYLE_PROPS? (may need color mapping)
- `_hover`, `_focus`, `_disabled`, `_readOnly`, `_invalid`, `_input`, `_stack` - DROP (pseudo-props)

**Notes**:
- Many pseudo-props for state styling
- Element composition pattern (left/right elements)
- Special outline color props for focus/invalid states

### Pressable

**File**: `src/components/primitives/Pressable/types.ts`

**Extends**: PressableProps (RN), StyledProps, PlatformProps

**Props**:
- `onHoverIn`, `onHoverOut`, `onFocus`, `onBlur` - DIRECT (RN callbacks)
- `isDisabled`, `isHovered`, `isPressed`, `isFocused`, `isFocusVisible` - DIRECT (state props)
- `_hover`, `_pressed`, `_focus`, `_disabled`, `_focusVisible` - DROP (pseudo-props)
- `children` - DIRECT (can be render prop with state)

**Notes**:
- Pressable is the foundation for Button and other interactive components
- Pseudo-props for all interaction states

## Common Patterns Summary

### 1. Pseudo-Props Pattern (_hover, _pressed, _focus, etc.)
**Found in**: Box, Button, Input, Pressable, and likely all components

**Examples**:
```typescript
_hover?: Partial<IComponentProps>
_pressed?: Partial<IComponentProps>
_focus?: Partial<IComponentProps>
_disabled?: Partial<IComponentProps>
_text?: Partial<ITextProps>
_icon?: Partial<IIconProps>
_stack?: Partial<IStackProps>
```

**Action**: **DROP ALL** - Aurora doesn't support this styling pattern. Users need to handle state-based styling differently.

**Common pseudo-props to drop**:
- Interaction state: `_hover`, `_pressed`, `_focus`, `_focusVisible`
- Component state: `_disabled`, `_invalid`, `_readOnly`, `_loading`
- Nested components: `_text`, `_icon`, `_stack`, `_input`, `_spinner`

### 2. Theme System Props
**Found in**: Button, Input, and likely all themed components

**Props**:
- `colorScheme` - NativeBase color theme key
- `variant` - Component variant (solid, outline, ghost, etc.)
- `size` - Component size token (xs, sm, md, lg, xl)

**Action**: **DROP** - Aurora uses a different theming approach. These need manual migration to Aurora's component API.

### 3. State Boolean Props
**Found in**: All interactive components

**Props**:
- `isDisabled`, `isHovered`, `isPressed`, `isFocused`, `isFocusVisible`
- `isInvalid`, `isReadOnly`, `isRequired`, `isFullWidth`
- `isLoading`

**Action**: **DIRECT** - Pass through unchanged (standard React/RN pattern)

### 4. StyledProps (Base Style System)
**Found in**: All components (via extends StyledProps)

**Includes**:
- Spacing: `m`, `mt`, `mb`, `ml`, `mr`, `mx`, `my`, `p`, `pt`, `pb`, `pl`, `pr`, `px`, `py`
- Layout: `w`, `h`, `minW`, `minH`, `maxW`, `maxH`, `flex`, `flexDirection`, `flexWrap`, etc.
- Position: `position`, `top`, `right`, `bottom`, `left`, `zIndex`
- Border: `border`, `borderRadius`, `borderColor`, `borderWidth`, `rounded`
- Color: `bg`, `color`, `backgroundColor`, `bgColor`
- Typography: `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`

**Action**: **STYLE_PROPS** - Extract to StyleSheet.create() using existing common-style-props.js mappings

### 5. ResponsiveValue<T>
**Pattern**: Props can accept responsive objects

**Example**:
```typescript
fontSize={{ base: 'sm', md: 'lg', lg: 'xl' }}
space={{ base: 2, md: 4 }}
```

**Action**: **TODO** - Need to decide:
- Option A: Keep responsive values (if Aurora supports)
- Option B: Flatten to single value (warn user)
- Option C: Extract to multiple StyleSheet entries with media queries

### 6. Element Composition Props
**Found in**: Input, Button, and other composites

**Examples**:
- `startIcon`, `endIcon`, `leftIcon`, `rightIcon`
- `InputLeftElement`, `InputRightElement`
- `spinner`, `divider`

**Action**: Component-specific handling - may need transformation or keeping based on Aurora's API

### View, Flex, Column, Row

**Simple layout primitives**:
- **View** - Styled wrapper around RN View, extends StyledProps
- **Flex** - Box with flex props (align, justify, wrap, basis, grow, shrink, direction)
- **Column** - Alias for VStack
- **Row** - Alias for HStack

All use StyledProps, no special props to handle.

## Complete NativeBase Type System

### Source of Truth: `styled-system.ts`

NativeBase uses a centralized styled system configuration (`NativeBase/src/theme/styled-system.ts`) that defines ALL props available across components via `StyledProps`. This is extracted verbatim into `src/mappings/nativebase-styled-props.js`.

**Complete prop categories** (656 lines of config):
1. **SPACING** (34 props) - margin/padding with all directions + shorthands (m, mt, mb, ml, mr, mx, my, p, pt, pb, pl, pr, px, py, gap)
2. **LAYOUT** (25 props) - sizing (w, h, minW, maxW, size, boxSize, overflow, display, textAlign)
3. **FLEXBOX** (15 props) - flex layout (alignItems, justifyContent, flexDirection, flex, flexGrow, flexWrap, etc.)
4. **POSITION** (6 props) - positioning (position, zIndex, top, right, bottom, left)
5. **COLOR** (8 props) - colors (color, bg, bgColor, backgroundColor, opacity, tintColor)
6. **BORDER** (41 props) - borders (borderWidth, borderColor, borderRadius, rounded, all side-specific variants)
7. **BACKGROUND** (13 props) - background (mostly web-only: bgImage, bgSize, bgPosition, etc.)
8. **TYPOGRAPHY** (14 props) - text (fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textAlign, textDecoration)
9. **EXTRA** (8 props) - outline, shadow, cursor, userSelect (mostly web-only)

**Type composition hierarchy**:
- `StyledProps` - Base type from styled-system (all props above)
- `PlatformProps<T>` - Adds _web, _ios, _android, _light, _dark, _important
- `CustomProps<T>` - Adds variant, size, colorScheme from theme
- Component types extend combinations of these

### Created Mapping Files

1. **`src/mappings/nativebase-styled-props.js`** - Complete verbatim extraction from NativeBase:
   - All 164 styled props with their mappings
   - Property renames (e.g., `w` → `width`, `m` → `margin`, `rounded` → `borderRadius`)
   - Multi-property expansions (e.g., `mx` → `marginLeft` + `marginRight`)
   - Theme scale references (e.g., `space`, `colors`, `sizes`, `radii`)
   - Web-only props list (for dropping in RN)

1. **`src/mappings/common-pseudo-props.js`** - Comprehensive list of all pseudo-props:
   - Interaction: `_hover`, `_pressed`, `_focus`, `_focusVisible`
   - State: `_disabled`, `_invalid`, `_readOnly`, `_loading`, `_checked`, `_indeterminate`
   - Nested: `_text`, `_icon`, `_stack`, `_input`, `_spinner`, `_backdrop`, `_content`, `_closeButton`
   - Platform: `_web`, `_ios`, `_android`

2. **`src/mappings/common-theme-props.js`** - Theme system props:
   - `colorScheme`, `variant`, `size`

3. **Updated `src/mappings/common-drop-props.js`** - Now imports from above files and combines all drop props

### Migration Strategy

**STYLE_PROPS** (Extract to StyleSheet):
- All StyledProps (m, p, w, h, flex, border, color, etc.) → Use existing common-style-props.js
- Layout props with value mapping (align → alignItems, justify → justifyContent) → Use common-value-maps.js

**DIRECT_PROPS** (Pass through):
- React Native props (onPress, testID, accessible, etc.)
- State boolean props (isDisabled, isInvalid, isLoading, etc.)
- Children, ref, key

**DROP_PROPS** (Remove entirely):
- ALL pseudo-props (30+ props) → Use common-drop-props.js
- Theme system props (colorScheme, variant, size) → Use common-drop-props.js
- Platform/theme overrides (_web, _ios, _android, _light, _dark)
- Component-specific: shadow, divider (Stack), etc.

**TRANSFORM_PROPS** (Rename on element):
- Component-specific: reversed → reverse (Stack)
- Text convenience: bold → fontWeight, italic → fontStyle, etc.

## TODO

- [ ] Test common-drop-props.js with existing migrate-stack codemod
- [ ] Complete analysis of remaining primitives (Image, Icon, Link, Select, Checkbox, Radio, Switch, Slider, Spinner, TextArea, Heading)
- [ ] Analyze composites (Modal, Alert, Accordion, etc.)
- [ ] Create component-specific prop mapping files (box-props.js, button-props.js, text-props.js, input-props.js)
- [ ] Decide on ResponsiveValue handling strategy
- [ ] Document element composition patterns and Aurora equivalents
- [ ] Create migrate-box, migrate-button, migrate-text codemods using generic engine
