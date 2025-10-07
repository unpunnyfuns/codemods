# Utils

Shared utility functions for JSX transformations, import management, prop processing, and AST manipulation.

## Structure

| File | Purpose |
|------|---------|
| `formatting.js` | AST to source conversion with formatting options |
| `imports.js` | Import statement manipulation (add, remove, redirect) |
| `jsx-extraction.js` | Extract values from JSX elements and children |
| `jsx-transforms.js` | JSX element transformations (name, props, styles) |
| `jsx.js` | JSX element queries and predicates |
| `props.js` | Prop categorization, value mapping, StyleSheet generation |
| `token-helpers.js` | Design token helper transformations |

## Module Details

### formatting.js

Converts AST back to source code.

**Exports:**
```javascript
toFormattedSource(root) → string
```

Wraps jscodeshift's `toSource()` with basic formatting options (single quotes, 2-space indentation).

**Note:** Output is unformatted - run your project's formatter after running codemods.

---

### imports.js

Comprehensive import statement manipulation utilities.

**Exports:**
```javascript
// Query helpers
matchesImportPath(importPath) → function
hasNamedImport(imports, importName) → boolean

// Transformations
redirectImport(importNode, newPath, j) → ImportDeclaration
insertImports(root, newImports, j) → void
addNamedImport(root, modulePath, importName, j) → void
removeNamedImport(imports, importName, j) → void
```

**Key features:**
- Preserves `importKind` for TypeScript type imports
- Handles trailing slashes in import paths
- Merges into existing imports when possible
- Removes empty import statements

---

### jsx-extraction.js

Extract values from nested JSX elements and children with complexity detection.

**Exports:**
```javascript
extractPropFromJSXElement(element, expectedElementName, propName, j) → string|ASTNode|null
extractSimpleChild(children, j, options?) → { value: ASTNode|null, isComplex: boolean }
```

**Use cases:**
- Extract `name="Plus"` from `<Icon name="Plus" />` in `leftIcon` prop
- Extract simple text/expressions from children while detecting complexity
- Configurable allowed expression types for children validation

**Example:**
```javascript
// Extract icon name from nested element
const iconName = extractPropFromJSXElement(iconElement, 'Icon', 'name', j)
// Returns: "Plus" or expression node

// Extract child with complexity check
const { value, isComplex } = extractSimpleChild(children, j, {
  allowedExpressionTypes: ['Identifier', 'CallExpression']
})
if (isComplex) {
  // Handle complex children (multiple elements, JSX, etc)
}
```

---

### jsx-transforms.js

JSX element transformation utilities for name, props, and style manipulation.

**Exports:**
```javascript
updateElementName(path, targetName) → void
removePropsFromElement(attributes, propsToRemove) → void
addPropsToElement(attributes, transformedProps, j) → void
buildStyleValue(styleProps, inlineStyles, styleName, elementStyles, j) → ASTNode|null
addStyleProp(attributes, styleValue, j) → void
```

**Use cases:**
- Rename JSX elements (Box → View)
- Add/remove props from elements
- Build style prop values combining StyleSheet references and inline styles
- Handle array-based style merging

**Example:**
```javascript
updateElementName(path, 'View')
removePropsFromElement(attributes, propsToRemove)
addPropsToElement(attributes, { flex: j.numericLiteral(1) }, j)

const styleValue = buildStyleValue(
  { padding: 4 },           // StyleSheet styles
  { borderRadius: 16 },     // Inline styles
  'box0',                   // StyleSheet key
  elementStyles,            // Accumulator
  j
)
addStyleProp(attributes, styleValue, j)
// Results in: style={[styles.box0, { borderRadius: 16 }]}
```

---

### jsx.js

Simple JSX element predicates.

**Exports:**
```javascript
hasAttributes(jsxElements) → boolean
```

Checks if any JSX elements in collection have attributes.

---

### props.js

Core prop processing engine for categorizing, transforming, and extracting props to StyleSheet.

**Exports:**
```javascript
// Value processing
shouldExtractToStyleSheet(value, isTokenHelper) → boolean
processTokenHelper(value, tokenHelper, j, usedTokenHelpers) → { value, isTokenHelper }
applyValueMapping(value, valueMap, j) → ASTNode

// Main categorization
categorizeProps(attributes, mappings, j) → {
  styleProps,        // Extract to StyleSheet
  inlineStyles,      // Keep as inline styles
  transformedProps,  // Rename/transform on element
  propsToRemove,     // Remove from element
  usedTokenHelpers   // Track token helpers used
}

// StyleSheet generation
buildStyleSheetProperties(styleProps, j) → Array<Property>
addOrExtendStyleSheet(root, elementStyles, j) → void
```

**Mapping configuration:**
```javascript
const mappings = {
  STYLE_PROPS: {
    // Simple mapping
    p: 'padding',

    // With value mapping
    space: {
      styleName: 'gap',
      valueMap: { 1: 4, 2: 8 }
    },

    // With token helper
    bg: {
      styleName: 'backgroundColor',
      tokenHelper: 'color'
    }
  },

  TRANSFORM_PROPS: {
    // Simple rename
    isDisabled: 'disabled',

    // With value mapping
    align: {
      propName: 'alignItems',
      valueMap: { start: 'flex-start', end: 'flex-end' }
    }
  },

  DROP_PROPS: ['_hover', '_pressed', '_web']
}
```

**Key features:**
- Handles token helpers (color.blue.500, space.md) with auto-import
- Applies value mappings for numeric/string literals
- Decides StyleSheet vs inline based on value type
- Extends existing StyleSheet.create() or creates new one
- Tracks used token helpers for import management

---

### token-helpers.js

Build nested member expressions from dot-separated token paths.

**Exports:**
```javascript
buildNestedMemberExpression(j, tokenHelper, tokenPath) → MemberExpression
```

**Handles:**
- Dot notation: `color.background.primary` → `color.background.primary`
- Bracket notation: `color.white.900` → `color.white['900']`
- Mixed: `space.md` → `space.md`

**Example:**
```javascript
buildNestedMemberExpression(j, 'color', 'background.secondary')
// Returns AST for: color.background.secondary

buildNestedMemberExpression(j, 'color', 'white.900')
// Returns AST for: color.white['900']
```

## Usage Patterns

### Simple component migration
```javascript
import { addNamedImport, removeNamedImport } from './utils/imports.js'
import { updateElementName } from './utils/jsx-transforms.js'
import { toFormattedSource } from './utils/formatting.js'

// Find and update elements
buttonElements.forEach(path => {
  updateElementName(path, 'Pressable')
})

// Update imports
removeNamedImport(imports, 'Button', j)
addNamedImport(root, 'react-native', 'Pressable', j)

return toFormattedSource(root)
```

### Prop-based migration with StyleSheet
```javascript
import { categorizeProps, addOrExtendStyleSheet } from './utils/props.js'
import { addPropsToElement, buildStyleValue, addStyleProp } from './utils/jsx-transforms.js'
import * as boxProps from '../mappings/box-props.js'

const elementStyles = []
const usedTokenHelpers = new Set()

boxElements.forEach((path, index) => {
  const { styleProps, inlineStyles, transformedProps, propsToRemove } =
    categorizeProps(attributes, boxProps, j)

  removePropsFromElement(attributes, propsToRemove)
  addPropsToElement(attributes, transformedProps, j)

  const styleValue = buildStyleValue(
    styleProps, inlineStyles, `box${index}`, elementStyles, j
  )
  addStyleProp(attributes, styleValue, j)
})

addOrExtendStyleSheet(root, elementStyles, j)
usedTokenHelpers.forEach(h => addNamedImport(root, '@hb-frontend/nordlys', h, j))
```

### JSX extraction and transformation
```javascript
import { extractPropFromJSXElement, extractSimpleChild } from './utils/jsx-extraction.js'

// Extract from nested component
const iconName = extractPropFromJSXElement(
  leftIconAttr.value.expression,
  'Icon',
  'name',
  j
)

// Extract from children
const { value: text, isComplex } = extractSimpleChild(children, j)
if (isComplex) {
  warnings.push('Complex children cannot be migrated')
  return
}
```

## Design Principles

**Composability:** Each utility does one thing well and composes with others

**Immutability:** Functions don't mutate input; they return new values or modify via side effects explicitly

**Consistency:** All functions follow the same parameter ordering (data, config, j)

**Type safety:** Return structured objects `{ value, isComplex }` instead of mixed types

**Error handling:** Return null/undefined for missing values; throw only for programmer errors
