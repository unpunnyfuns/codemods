# jscodeshift Helpers Reference

Reusable helper functions for React/React Native codemods. These could potentially be extracted into a standalone library.

## imports.js

Smart import management - add, remove, merge, and match import declarations.

### `addNamedImport(root, j, modulePath, importName)`

Adds a named import to existing import declaration or creates new one.

**Parameters:**
- `root` - jscodeshift collection (root AST)
- `j` - jscodeshift instance
- `modulePath` - string - module to import from (e.g., `'react-native'`)
- `importName` - string - name to import (e.g., `'View'`)

**Behavior:**
- If import from `modulePath` exists: adds `importName` to specifiers
- If `importName` already exists: no-op
- Otherwise: creates new import declaration at top of file

**Example:**
```javascript
addNamedImport(root, j, 'react-native', 'View')
// import { View } from 'react-native'

addNamedImport(root, j, 'react-native', 'StyleSheet')
// import { StyleSheet, View } from 'react-native'
```

### `removeNamedImport(root, j, modulePath, importName)`

Removes a named import from import declaration.

**Parameters:**
- `root` - jscodeshift collection
- `j` - jscodeshift instance
- `modulePath` - string - module path
- `importName` - string - name to remove

**Behavior:**
- Removes `importName` from specifiers
- If last specifier: removes entire import declaration
- If import doesn't exist: no-op

**Example:**
```javascript
// Before: import { Box, Button } from 'native-base'
removeNamedImport(root, j, 'native-base', 'Box')
// After: import { Button } from 'native-base'

removeNamedImport(root, j, 'native-base', 'Button')
// After: (import removed entirely)
```

### `hasNamedImport(root, j, modulePath, importName)`

Checks if a named import exists.

**Parameters:**
- `root` - jscodeshift collection
- `j` - jscodeshift instance
- `modulePath` - string
- `importName` - string

**Returns:** `boolean`

**Example:**
```javascript
if (hasNamedImport(root, j, 'native-base', 'Box')) {
  // Transform Box elements
}
```

### `matchesImportPath(path1, path2)`

Compares import paths, normalizing trailing slashes.

**Parameters:**
- `path1` - string
- `path2` - string

**Returns:** `boolean`

**Example:**
```javascript
matchesImportPath('@org/components', '@org/components/')  // true
matchesImportPath('native-base', 'react-native')         // false
```

### `insertImports(root, j, imports)`

Inserts multiple import declarations.

**Parameters:**
- `root` - jscodeshift collection
- `j` - jscodeshift instance
- `imports` - array of import declaration nodes

**Example:**
```javascript
const imports = [
  j.importDeclaration(
    [j.importSpecifier(j.identifier('Box'))],
    j.stringLiteral('@org/atoms/Box')
  )
]
insertImports(root, j, imports)
```

## jsx-transforms.js

JSX element manipulation - rename, add/remove props, wrap, build styles.

### `updateElementName(path, newName)`

Renames a JSX element.

**Parameters:**
- `path` - jscodeshift NodePath to JSXElement
- `newName` - string - new element name

**Behavior:**
- Updates opening tag
- Updates closing tag (if exists)

**Example:**
```javascript
root.findJSXElements('Box').forEach(path => {
  updateElementName(path, 'View')
})
// <Box> becomes <View>
```

### `addPropsToElement(j, path, props)`

Adds JSX attributes to element.

**Parameters:**
- `j` - jscodeshift instance
- `path` - NodePath to JSXElement
- `props` - object mapping prop names to AST values

**Example:**
```javascript
addPropsToElement(j, path, {
  testID: j.literal('test'),
  disabled: j.literal(true)
})
// <Button> becomes <Button testID="test" disabled={true}>
```

### `removePropsFromElement(path, propNames)`

Removes JSX attributes from element.

**Parameters:**
- `path` - NodePath to JSXElement
- `propNames` - array of string - prop names to remove

**Example:**
```javascript
removePropsFromElement(path, ['_hover', '_pressed'])
// <Box _hover={{}} _pressed={{}}> becomes <Box>
```

### `addStyleProp(j, path, styleValue)`

Adds or merges style prop with existing value.

**Parameters:**
- `j` - jscodeshift instance
- `path` - NodePath to JSXElement
- `styleValue` - AST node for style value (e.g., `styles.box0`)

**Behavior:**
- If no style prop: adds new style prop
- If existing style prop: merges with array `[existing, new]`

**Example:**
```javascript
const styleRef = j.memberExpression(
  j.identifier('styles'),
  j.identifier('box0')
)
addStyleProp(j, path, styleRef)
// <View> becomes <View style={styles.box0}>
// <View style={styles.outer}> becomes <View style={[styles.outer, styles.box0]}>
```

### `buildStyleValue(j, styleKeyPrefix, styleIndex)`

Builds a style reference expression.

**Parameters:**
- `j` - jscodeshift instance
- `styleKeyPrefix` - string - prefix for style key (e.g., `'box'`)
- `styleIndex` - number - index for unique style key

**Returns:** AST node for `styles.{prefix}{index}`

**Example:**
```javascript
const styleRef = buildStyleValue(j, 'view', 0)
// Returns: styles.view0
```

### `createViewWrapper(j, path, styleValue)`

Wraps JSX element in a View with style prop.

**Parameters:**
- `j` - jscodeshift instance
- `path` - NodePath to JSXElement
- `styleValue` - AST node for style value

**Example:**
```javascript
createViewWrapper(j, path, styleRef)
// <Switch /> becomes <View style={styles.view0}><Switch /></View>
```

## jsx-extraction.js

Extract props and children from JSX elements.

### `extractPropFromJSXElement(path, propName)`

Extracts a specific prop from JSX element.

**Parameters:**
- `path` - NodePath to JSXElement
- `propName` - string - prop name to extract

**Returns:** `{ name: string, value: ASTNode } | null`

**Example:**
```javascript
const leftIcon = extractPropFromJSXElement(path, 'leftIcon')
if (leftIcon) {
  // Use leftIcon.value
}
```

### `extractSimpleChild(j, path)`

Extracts simple text child from JSX element.

**Parameters:**
- `j` - jscodeshift instance
- `path` - NodePath to JSXElement

**Returns:** `{ type: 'text' | 'expression', value: string | ASTNode } | null`

**Behavior:**
- Returns `null` for complex children (multiple elements, conditionals)
- Returns text for simple string children
- Returns expression for simple expression children

**Example:**
```javascript
const child = extractSimpleChild(j, path)
if (child && child.type === 'text') {
  console.log('Text content:', child.value)
}
```

## props.js

Prop categorization and StyleSheet generation.

### `categorizeProps(path, config)`

Categorizes JSX props into style, transform, direct, and drop categories.

**Parameters:**
- `path` - NodePath to JSXElement
- `config` - object with:
  - `styleProps` - object mapping prop names to CSS properties
  - `transformProps` - object mapping prop names to renamed props
  - `directProps` - array of prop names to pass through
  - `dropProps` - array of prop names to remove

**Returns:**
```javascript
{
  style: { cssProperty: value, ... },    // For StyleSheet
  transform: { propName: value, ... },   // For element (renamed)
  direct: { propName: value, ... },      // For element (unchanged)
  drop: ['propName', ...]                // To remove
}
```

**Example:**
```javascript
const categorized = categorizeProps(path, {
  styleProps: { p: 'padding', bg: 'backgroundColor' },
  transformProps: { isDisabled: 'disabled' },
  directProps: ['testID', 'onPress'],
  dropProps: ['_hover', '_pressed']
})

// Input: <Box p={4} bg="blue" isDisabled={true} testID="test" _hover={{}} />
// categorized.style = { padding: 4, backgroundColor: 'blue' }
// categorized.transform = { disabled: true }
// categorized.direct = { testID: 'test' }
// categorized.drop = ['_hover']
```

**Style Props Format:**
```javascript
{
  // Simple mapping
  p: 'padding',

  // With value transformation
  space: {
    styleName: 'gap',
    valueMap: { 1: 4, 2: 8, 3: 12 }
  },

  // Multi-property expansion
  mx: ['marginLeft', 'marginRight']
}
```

**Transform Props Format:**
```javascript
{
  // Simple rename
  isDisabled: 'disabled',

  // With value transformation
  align: {
    propName: 'alignItems',
    valueMap: { start: 'flex-start', end: 'flex-end' }
  }
}
```

### `addOrExtendStyleSheet(root, j, styleKeyPrefix, styleObject)`

Creates or extends StyleSheet.create() with new style object.

**Parameters:**
- `root` - jscodeshift collection
- `j` - jscodeshift instance
- `styleKeyPrefix` - string - prefix for style key
- `styleObject` - object - CSS properties

**Returns:** AST node for `styles.{prefix}{index}`

**Behavior:**
- Finds existing `StyleSheet.create()` call
- If exists: adds new style object with incremented index
- If not: creates new `StyleSheet.create()` at end of file
- Returns member expression reference to new style

**Example:**
```javascript
const style1 = addOrExtendStyleSheet(root, j, 'view', {
  backgroundColor: 'blue',
  padding: 4
})
// Creates: const styles = StyleSheet.create({ view0: { ... } })
// Returns: styles.view0

const style2 = addOrExtendStyleSheet(root, j, 'view', {
  marginTop: 8
})
// Extends: const styles = StyleSheet.create({ view0: {...}, view1: { marginTop: 8 } })
// Returns: styles.view1
```

## token-helpers.js

Build nested member expressions for design tokens.

### `buildNestedMemberExpression(j, path)`

Builds nested member expression from dot-separated path, using bracket notation for numeric keys.

**Parameters:**
- `j` - jscodeshift instance
- `path` - string - dot-separated path (e.g., `'color.blue.500'`)

**Returns:** AST node for nested member expression

**Behavior:**
- Uses dot notation for non-numeric keys: `color.blue`
- Uses bracket notation for numeric keys: `color.blue['500']`
- Handles arbitrary nesting depth

**Example:**
```javascript
buildNestedMemberExpression(j, 'color.blue.500')
// Returns: color.blue['500']

buildNestedMemberExpression(j, 'space.md')
// Returns: space.md

buildNestedMemberExpression(j, 'typography.heading.h1.size')
// Returns: typography.heading.h1.size
```

## Usage Patterns

### Complete Migration Example

```javascript
import { addNamedImport, hasNamedImport, removeNamedImport } from './helpers/imports.js'
import { updateElementName, addPropsToElement, addStyleProp, removePropsFromElement } from './helpers/jsx-transforms.js'
import { categorizeProps, addOrExtendStyleSheet } from './helpers/props.js'

function transform(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  if (!hasNamedImport(root, j, 'native-base', 'Box')) {
    return fileInfo.source
  }

  root.findJSXElements('Box').forEach(path => {
    // Categorize props
    const categorized = categorizeProps(path, {
      styleProps: { p: 'padding', bg: 'backgroundColor' },
      transformProps: {},
      directProps: ['testID'],
      dropProps: ['_hover']
    })

    // Extract styles
    let styleRef = null
    if (Object.keys(categorized.style).length > 0) {
      styleRef = addOrExtendStyleSheet(root, j, 'view', categorized.style)
    }

    // Update element
    updateElementName(path, 'View')
    removePropsFromElement(path, [
      ...Object.keys(categorized.style),
      ...categorized.drop
    ])

    if (styleRef) {
      addStyleProp(j, path, styleRef)
    }

    for (const [key, value] of Object.entries(categorized.direct)) {
      addPropsToElement(j, path, { [key]: value })
    }
  })

  // Update imports
  removeNamedImport(root, j, 'native-base', 'Box')
  addNamedImport(root, j, 'react-native', 'View')
  addNamedImport(root, j, 'react-native', 'StyleSheet')

  return root.toSource()
}

export default transform
```

## Potential Library Structure

If extracted into a standalone package:

```
jscodeshift-react-helpers/
  imports.js      - Import management
  jsx.js          - JSX manipulation
  props.js        - Prop categorization
  styles.js       - StyleSheet generation
  tokens.js       - Token helpers
  index.js        - Re-exports all helpers
```

Usage:
```javascript
import { addNamedImport, categorizeProps, addOrExtendStyleSheet } from 'jscodeshift-react-helpers'
```
