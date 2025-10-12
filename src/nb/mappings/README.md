# Mappings

Prop mapping configurations for NativeBase to target framework migrations.

Model-based system: formal models define both SOURCE (NativeBase) and TARGET (target framework), then complete mappings derive systematically from these models.

## Architecture

```
Models (source of truth) to Mappings (derived) to Validation (enforced)
```

## Structure

| File                           | Purpose                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| **Models**                     |                                                                      |
| `nativebase-styled-props.js`   | SOURCE model - Complete NativeBase styled-system documentation       |
| `nordlys-props.js`             | TARGET model - target framework component capabilities and constraints        |
| **Mappings**                   |                                                                      |
| `props-style.js`               | NativeBase to target framework style prop mappings (extracted to StyleSheet)   |
| `props-direct.js`              | Props that pass through unchanged (events, accessibility)            |
| `props-drop.js`                | Props to remove (pseudo-props, platform overrides)                   |
| `props-pseudo.js`              | NativeBase pseudo-prop definitions (\_hover, \_pressed, etc.)        |
| `props-theme.js`               | NativeBase theme system props (colorScheme, variant, size)           |
| **Value Transformations**      |                                                                      |
| `maps-color.js`                | NativeBase to target framework color token remapping                           |
| `maps-values.js`               | String value transformations (align, justify)                        |

## Models

### nativebase-styled-props.js

**SOURCE MODEL** - Complete NativeBase styled-system reference.

Documents all NativeBase styled-props with categorization:

```javascript
// React Native Compatibility:
// - RN_COMPATIBLE: Works in React Native
// - WEB_ONLY: CSS-only, drop for RN migrations
// - TEXT_ONLY: Only works on Text components, not View
// - RN_LIMITED: Partial support in RN
// - IMAGE_ONLY: Only works on Image components

// target framework Mapping Strategy:
// - DIRECT: Map directly to RN prop (e.g., p to padding)
// - TOKEN: Use target framework token helper (e.g., bg to backgroundColor with color token)
// - VALUE_MAP: Transform string values (e.g., align: start to flex-start)
// - DROP: Remove (web-only, unsupported, handled differently in target framework)
```

**Exports:**

```javascript
SPACING      // margin, padding, gap - all with space scale
LAYOUT       // width, height, min/max, overflow, display, textAlign
FLEXBOX      // alignItems, justifyContent, flex, etc.
POSITION     // position, top, right, bottom, left, zIndex
COLOR        // color, backgroundColor, opacity, tintColor, textDecorationColor
BORDER       // borderWidth, borderRadius, borderColor, borderStyle + all variants
BACKGROUND   // backgroundImage, backgroundSize, etc. (WEB_ONLY)
TYPOGRAPHY   // fontFamily, fontSize, textAlign, etc. (TEXT_ONLY)
EXTRA        // outline, cursor, shadow, userSelect (mostly WEB_ONLY)
ALL_STYLED_PROPS  // Combined
WEB_ONLY_PROPS    // List of props to drop for RN
```

**Note:** Our codemods use React Native native shorthands:

- `mx` to `marginHorizontal` (not `['marginLeft', 'marginRight']` like NativeBase)
- `my` to `marginVertical` (not `['marginTop', 'marginBottom']`)
- Same for `px`/`py`

### nordlys-props.js

**TARGET MODEL** - target framework component capabilities and constraints.

Documents what's valid in target framework output:

**Exports:**

```javascript
// Design Tokens
SPACE_TOKENS           // ['zero', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']
RADIUS_TOKENS          // ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
COLOR_SYSTEM           // { tokenHelper: 'color', supportsNestedPaths: true, ... }

// React Native View Style Props
LAYOUT_PROPS           // display, width, height, min/max, overflow, aspectRatio, direction
FLEXBOX_PROPS          // flex, flexDirection, alignItems, justifyContent, gap, etc.
SPACING_PROPS          // margin*, padding* (including Horizontal/Vertical)
POSITION_PROPS         // position, top, right, bottom, left, start, end, zIndex
BORDER_PROPS           // borderWidth, borderRadius, borderColor, borderStyle + all variants
COLOR_PROPS            // backgroundColor, opacity
TRANSFORM_PROPS        // transform, rotation, scaleX, scaleY, translateX, translateY
SHADOW_PROPS           // shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation
ALL_VIEW_STYLE_PROPS   // Combined

// Props That Expect target framework Tokens
PROPS_USING_SPACE_TOKENS   // gap, margin*, padding*, top, right, bottom, left, etc.
PROPS_USING_RADIUS_TOKENS  // borderRadius, borderTopLeftRadius, etc.
PROPS_USING_COLOR_TOKENS   // backgroundColor, borderColor, shadowColor, etc.

// Constraints
NUMERIC_ONLY_PROPS     // flex, zIndex, opacity, borderWidth, etc. (no tokens)
DIMENSION_PROPS        // width, height, margin, padding (numbers/percentages, not semantic tokens)
UNSUPPORTED_ON_VIEW    // textAlign, fontSize, fontFamily - Text only
TEXT_STYLE_PROPS       // color, fontFamily, fontSize, textAlign, etc.

// Component Constraints
BUTTON_NO_STYLE_PROPS         // true (must wrap in View if style props needed)
SWITCH_NO_STYLE_PROPS         // true
AVATAR_NO_STYLE_PROPS         // true
TYPOGRAPHY_RESTRICTED_PROPS   // { managed: [...], allowed: [...], wrapForLayout: true }
```

## Mappings

### props-style.js

**NativeBase to target framework style prop mappings** (extracted to StyleSheet).

Complete mappings derived from both models. Used by `categorizeProps()` in `../props.js`.

**Format:**

```javascript
// Simple direct mapping
export const flexbox = {
  flex: 'flex',
  alignItems: 'alignItems',
  flexDir: 'flexDirection',  // Rename
};

// With token helper
export const spacing = {
  p: { styleName: 'padding', tokenHelper: 'space' },
  m: { styleName: 'margin', tokenHelper: 'space' },
  gap: { styleName: 'gap', tokenHelper: 'space' },
};

// With value mapping
export const sizing = {
  width: { styleName: 'width', valueMap: { full: '100%' } },
};

// Multi-property expansion
export const border = {
  roundedTop: {
    properties: ['borderTopLeftRadius', 'borderTopRightRadius'],
    tokenHelper: 'radius',
  },
};
```

**Exports:**

```javascript
spacing   // margin, padding, gap (with space tokens)
sizing    // width, height, min/max (with dimension value maps)
color     // backgroundColor (with color tokens)
border    // borderRadius, borderColor, borderWidth (with tokens)
layout    // display, overflow, textAlign
flexbox   // alignItems, justifyContent, flex, etc.
position  // position, top, right, bottom, left, zIndex (with space tokens)
text      // color, fontFamily, fontSize, textAlign, etc. (TEXT_ONLY)
extra     // opacity, tintColor (IMAGE_ONLY)
```

### props-direct.js

Standard React Native props that pass through unchanged.

**Exports:**

```javascript
export const directProps = [
  'testID',
  'onPress',
  'onLongPress',
  'accessibilityLabel',
  'accessibilityHint',
  'accessibilityRole',
  'accessible',
  // ... more
];
```

### props-drop.js

NativeBase-specific props to remove during migration.

**Exports:**

```javascript
export const dropProps = [
  // Pseudo-props (from props-pseudo.js)
  ...pseudoProps,
  // Theme props that don't map to target framework (from props-theme.js)
  'colorScheme',
  // Platform overrides
  '_web',
  '_ios',
  '_android',
  // Theme overrides
  '_light',
  '_dark',
  // Web-only props (from nativebase-styled-props.js WEB_ONLY_PROPS)
  'backgroundImage',
  'cursor',
  'outline',
  // ... more
];
```

### props-pseudo.js

Complete list of NativeBase pseudo-props.

**Exports:**

```javascript
INTERACTION_PSEUDO   // _hover, _pressed, _focus, _active, _disabled
VALIDATION_PSEUDO    // _invalid, _valid, _checked, _indeterminate
NESTED_PSEUDO        // _text, _icon, _stack, _input, _web, _ios, _android, etc.
ALL_PSEUDO_PROPS     // Combined
```

All pseudo-props are dropped - target framework uses different patterns.

### props-theme.js

NativeBase theme system props.

**Exports:**

```javascript
THEME_VARIANTS          // variant, size, colorScheme
THEME_CUSTOMIZATION     // isDisabled, isInvalid, isReadOnly, isRequired
ALL_THEME_PROPS         // Combined
```

These are typically dropped or transformed in TRANSFORM_PROPS.

## Value Transformations

### maps-color.js

Maps NativeBase color tokens to target framework color system.

**Exports:**

```javascript
gettarget frameworkColorPath(nativeBaseColor) to string
```

**Example:**

```javascript
gettarget frameworkColorPath('blue.500')        // to 'blue.500'
gettarget frameworkColorPath('primary.600')     // to 'background.primary' (or mapped equivalent)
```

Used by `processTokenHelper()` in `../props.js` when `tokenHelper: 'color'`.

### maps-values.js

String value transformations.

**Exports:**

```javascript
ALIGN_VALUES      // start to flex-start, end to flex-end, center, stretch, baseline
JUSTIFY_VALUES    // start to flex-start, between to space-between, around, evenly
```

**Usage in component TRANSFORM_PROPS:**

```javascript
export const transformProps = {
  align: { propName: 'alignItems', valueMap: ALIGN_VALUES },
  justify: { propName: 'justifyContent', valueMap: JUSTIFY_VALUES },
};
```

## Usage in Codemods

Each codemod imports these mappings and passes to `categorizeProps()`:

```javascript
import { categorizeProps } from './props.js'
import {
  border,
  color,
  extra,
  flexbox,
  layout,
  position,
  sizing,
  spacing,
  text,
} from './mappings/props-style.js'

// Component-specific prop configuration
const componentProps = {
  styleProps: {
    ...spacing,
    ...sizing,
    ...color,
    ...border,
  },
  transformProps: {
    isDisabled: 'disabled',
    onToggle: 'onValueChange',
  },
  directProps: ['testID', 'accessibilityLabel'],
  dropProps: ['_hover', '_pressed', 'shadow'],
}

// Categorize props
const {
  styleProps,
  inlineStyles,
  transformedProps,
  propsToRemove,
  usedTokenHelpers,
} = categorizeProps(attributes, componentProps, j)
```

## Validation

Validation in `../props.js` derives from `nordlys-props.js`:

```javascript
import {
  DIMENSION_PROPS,
  NUMERIC_ONLY_PROPS,
  RADIUS_TOKENS,
  SPACE_TOKENS,
} from './mappings/nordlys-props.js'

// Validation functions use these constants
export const validSpaceTokens = SPACE_TOKENS
export const validRadiusTokens = RADIUS_TOKENS
```

**Validation rules:**

- Semantic space tokens ('sm', 'md', 'lg') are invalid for dimension props (width, height)
- Dimension props accept numbers, percentages, or 'auto'
- Numeric props (flex, zIndex, opacity) shouldn't be strings
- Text-only props (textAlign, fontSize) are invalid for View components

## Design Principles

**Model-based:** Formal models define SOURCE (NativeBase) and TARGET (target framework)

**Single source of truth:** Validation derives from models, not hardcoded lists

**Systematic:** All NativeBase props documented and categorized for complete coverage

**Composable:** Mix and match mapping modules with component-specific overrides

**Type-safe:** Structured formats validated by `categorizeProps()`

**Maintainable:** Update models, mappings derive automatically
