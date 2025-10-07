# Mappings

Prop mapping configurations for NativeBase → Aurora/Nordlys migrations.

Defines which props to extract to StyleSheet, transform, pass through, or drop during component migrations.

## Structure

| File                         | Purpose                                                       |
| ---------------------------- | ------------------------------------------------------------- |
| **Common Modules**           |                                                               |
| `common-style-props.js`      | Reusable style prop mappings (spacing, sizing, colors, etc.)  |
| `common-direct-props.js`     | Props passed through unchanged (events, accessibility)        |
| `common-drop-props.js`       | Props to remove (pseudo-props, theme overrides)               |
| `common-value-maps.js`       | Value transformations (align, justify)                        |
| `common-pseudo-props.js`     | NativeBase pseudo-prop definitions (\_hover, \_pressed, etc.) |
| `common-theme-props.js`      | NativeBase theme system props (colorScheme, variant)          |
| **Component Mappings**       |                                                               |
| `box-props.js`               | Box component prop mappings                                   |
| `stack-props.js`             | Stack (HStack/VStack) component prop mappings                 |
| `pressable-props.js`         | Pressable component prop mappings                             |
| **Reference**                |                                                               |
| `color-mappings.js`          | NativeBase → Nordlys color token mappings                     |
| `nativebase-styled-props.js` | Complete NativeBase styled-system reference                   |

## Mapping Format

Each component mapping file exports four constants used by `categorizeProps()`:

```javascript
export const STYLE_PROPS = {
  // Extract to StyleSheet
};

export const TRANSFORM_PROPS = {
  // Rename/transform on element
};

export const DIRECT_PROPS = [
  // Pass through unchanged
];

export const DROP_PROPS = [
  // Remove from element
];
```

## Common Modules

### common-style-props.js

Reusable style prop mappings organized by category.

**Exports:**

```javascript
SPACING; // m, mt, mb, ml, mr, mx, my, p, pt, pb, pl, pr, px, py
SIZING; // w, h, minW, maxW, minH, maxH, width, height
COLOR; // bg, bgColor, backgroundColor, borderColor
BORDER; // borderWidth, borderRadius, borderTopWidth, etc.
LAYOUT; // flex, flexDirection, alignItems, justifyContent, position, etc.
```

**Format options:**

1. **Simple string mapping:**

```javascript
SPACING = {
  p: "padding",
  m: "margin",
  mt: "marginTop",
};
```

2. **Multi-property expansion:**

```javascript
SPACING = {
  px: {
    styleName: null,
    properties: ["paddingLeft", "paddingRight"],
  },
};
```

3. **With token helper:**

```javascript
COLOR = {
  bg: {
    styleName: "backgroundColor",
    tokenHelper: "color",
  },
};
// bg="blue.500" → backgroundColor: color.blue['500']
```

4. **With value mapping:**

```javascript
BORDER = {
  rounded: {
    styleName: "borderRadius",
    valueMap: {
      none: 0,
      sm: 2,
      md: 4,
      lg: 8,
      full: 9999,
    },
  },
};
// rounded="md" → borderRadius: 4
```

---

### common-direct-props.js

Standard React Native props that pass through unchanged.

**Exports:**

```javascript
EVENT_HANDLERS; // onPress, onLongPress, onLayout, onFocus, onBlur
ACCESSIBILITY; // testID, accessibilityLabel, accessibilityRole, etc.
COMMON; // Combination of EVENT_HANDLERS + ACCESSIBILITY
```

**Usage:**

```javascript
import * as commonDirectProps from "./common-direct-props.js";

export const DIRECT_PROPS = commonDirectProps.COMMON;
```

---

### common-drop-props.js

NativeBase-specific props to remove during migration.

**Exports:**

```javascript
PLATFORM_OVERRIDES; // _web, _ios, _android
THEME_OVERRIDES; // _light, _dark
COMPONENT_SPECIFIC; // shadow
COMMON; // All drop props combined
```

**Includes all pseudo-props and theme props:**

- Imported from `common-pseudo-props.js` (ALL_PSEUDO_PROPS)
- Imported from `common-theme-props.js` (ALL_THEME_PROPS)

---

### common-value-maps.js

Value transformations for string literals.

**Exports:**

```javascript
ALIGN_VALUES; // start → flex-start, end → flex-end, center, stretch, baseline
JUSTIFY_VALUES; // start → flex-start, between → space-between, around, evenly
```

**Usage in TRANSFORM_PROPS:**

```javascript
import * as commonValueMaps from "./common-value-maps.js";

export const TRANSFORM_PROPS = {
  align: {
    propName: "alignItems",
    valueMap: commonValueMaps.ALIGN_VALUES,
  },
  justify: {
    propName: "justifyContent",
    valueMap: commonValueMaps.JUSTIFY_VALUES,
  },
};
```

**Notes:**

- Only maps string literals (align="start")
- Numeric values pass through unchanged
- Semantic spacing tokens (sm, md, lg) are identical between NativeBase and Aurora - no transformation needed

---

### common-pseudo-props.js

Complete list of NativeBase pseudo-props for interaction states, variants, and nested components.

**Exports:**

```javascript
INTERACTION_PSEUDO; // _hover, _pressed, _focus, _active, _disabled
VALIDATION_PSEUDO; // _invalid, _valid, _checked, _indeterminate
NESTED_PSEUDO; // _text, _icon, _stack, _input, _web, _ios, _android, etc.
ALL_PSEUDO_PROPS; // Combination of all pseudo-props
```

All pseudo-props are dropped during migration - Aurora/Nordlys use different patterns.

---

### common-theme-props.js

NativeBase theme system props.

**Exports:**

```javascript
THEME_VARIANTS; // variant, size, colorScheme
THEME_CUSTOMIZATION; // isDisabled, isInvalid, isReadOnly, isRequired
ALL_THEME_PROPS; // Combined
```

These are typically dropped or transformed:

- `variant` → may map to Aurora variant
- `size` → may map to Aurora size
- `isDisabled` → often becomes `disabled` (TRANSFORM_PROPS)

---

### color-mappings.js

Maps NativeBase semantic color tokens to Nordlys system tokens.

**Exports:**

```javascript
getNordlysColorPath(nativeBaseColor) → string
```

**Example:**

```javascript
getNordlysColorPath("blue.500");
// Returns: 'blue.500' (or mapped equivalent)
```

Used by `processTokenHelper()` when `tokenHelper: 'color'` is configured.

---

### nativebase-styled-props.js

**Reference only** - Complete list of NativeBase styled-system props for documentation.

Not used directly in migrations. Serves as reference for building component-specific mappings.

## Component Mappings

### box-props.js

Box component migration to React Native View.

**Configuration:**

```javascript
STYLE_PROPS = {
  ...commonStyleProps.SPACING,
  ...commonStyleProps.SIZING,
  ...commonStyleProps.COLOR,
  ...commonStyleProps.BORDER,
  ...commonStyleProps.LAYOUT,

  // Box-specific overrides
  bg: { styleName: "backgroundColor", tokenHelper: "color" },
  rounded: { styleName: "borderRadius", tokenHelper: "radius" },
};

TRANSFORM_PROPS = {}; // No prop renames for Box

DIRECT_PROPS = commonDirectProps.COMMON;

DROP_PROPS = [
  ...commonDropProps.COMMON,
  "shadow", // Use style-based shadows in Aurora
];
```

**Result:**

- Style props → StyleSheet.create()
- Direct props → passed through
- Token helpers → auto-imported (color, radius, space)

---

### stack-props.js

Stack (HStack/VStack) component migration to Aurora Stack.

**Configuration:**

```javascript
STYLE_PROPS = {
  space: { styleName: "gap", tokenHelper: "space" },
  ...commonStyleProps.SPACING,
  ...commonStyleProps.SIZING,
};

TRANSFORM_PROPS = {
  align: { propName: "alignItems", valueMap: ALIGN_VALUES },
  justify: { propName: "justifyContent", valueMap: JUSTIFY_VALUES },
  reversed: "reverse",
};

DIRECT_PROPS = commonDirectProps.COMMON;

DROP_PROPS = [
  ...commonDropProps.COMMON,
  "divider", // Aurora Stack doesn't support divider
  "_text",
  "_stack",
];
```

**Auto-added props:**

- `direction` → 'row' (HStack) or 'column' (VStack)

---

### pressable-props.js

Pressable component migration (NativeBase → React Native).

**Configuration:**

```javascript
STYLE_PROPS = {
  ...commonStyleProps.SPACING,
  ...commonStyleProps.SIZING,
  bg: { styleName: "backgroundColor", tokenHelper: "color" },
};

TRANSFORM_PROPS = {
  isDisabled: "disabled",
};

DIRECT_PROPS = [
  ...commonDirectProps.COMMON,
  "onPressIn",
  "onPressOut",
  "hitSlop",
  "android_ripple",
];

DROP_PROPS = commonDropProps.COMMON;
```

**Auto-added props:**

- `accessibilityRole="button"` (default if not present)

## Creating New Component Mappings

1. **Import common modules:**

```javascript
import * as commonStyleProps from "./common-style-props.js";
import * as commonDirectProps from "./common-direct-props.js";
import * as commonDropProps from "./common-drop-props.js";
import * as commonValueMaps from "./common-value-maps.js";
```

2. **Define STYLE_PROPS:**

```javascript
export const STYLE_PROPS = {
  // Reuse common mappings
  ...commonStyleProps.SPACING,
  ...commonStyleProps.SIZING,

  // Component-specific overrides
  iconSize: "fontSize",

  // With token helper
  iconColor: {
    styleName: "color",
    tokenHelper: "color",
  },
};
```

3. **Define TRANSFORM_PROPS:**

```javascript
export const TRANSFORM_PROPS = {
  // Simple rename
  isDisabled: "disabled",

  // With value mapping
  align: {
    propName: "alignItems",
    valueMap: commonValueMaps.ALIGN_VALUES,
  },
};
```

4. **Define DIRECT_PROPS:**

```javascript
export const DIRECT_PROPS = [
  ...commonDirectProps.COMMON,
  "numberOfLines", // Component-specific
  "ellipsizeMode",
];
```

5. **Define DROP_PROPS:**

```javascript
export const DROP_PROPS = [
  ...commonDropProps.COMMON,
  "isTruncated", // NativeBase-specific
  "_text", // Pseudo-prop
];
```

## Value Mapping Priority

1. **Token helpers** (if configured)

   - `bg="blue.500"` with `tokenHelper: 'color'`
   - Result: `backgroundColor: color.blue['500']`

2. **Value mappings** (if configured)

   - `align="start"` with `valueMap: { start: 'flex-start' }`
   - Result: `alignItems: 'flex-start'`

3. **Pass through** (no transformation)
   - `m={4}` → `margin: 4`
   - `p="xl"` → `padding: 'xl'` (semantic token)

## StyleSheet vs Inline Styles

**Extracted to StyleSheet:**

- Literal values (strings, numbers, booleans)
- Token helper references (`color.blue.500`, `space.md`)

**Kept inline:**

- Variables (`m={props.spacing}`)
- Function calls (`bg={getColor()}`)
- User member expressions (`p={config.padding}`)

## Design Principles

**Reusability:** Common patterns extracted to reusable modules

**Composability:** Mix and match common modules with component-specific overrides

**Clarity:** Each mapping file focuses on a single component or category

**Documentation:** Comments explain non-obvious mappings and decisions

**Type safety:** Structured formats validated by `categorizeProps()`
