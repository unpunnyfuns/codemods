# Naming Conventions

Precise and concise naming patterns used across all codemods and utilities.

## Entry Points

**Codemod main function:**
```javascript
function main(fileInfo, api, options = {})
```

## Common Variables

**jscodeshift API and source:**
- `j` - jscodeshift API reference
- `root` - parsed source tree (result of `j(fileInfo.source)`)

**Imports and elements:**
- `imports` - import declaration collection
- `{component}Elements` - JSX element collections
  - Examples: `buttonElements`, `avatarElements`, `switchElements`

**AST traversal:**
- `path` - forEach parameter for AST nodes
- `attributes` - JSX opening element attributes (`path.node.openingElement.attributes`)
- `children` - JSX element children (`path.node.children`)

## Attribute and Value Naming

**Attribute references (JSXAttribute node):**
- Pattern: `{name}Attr`
- Use when storing the actual JSXAttribute AST node
- Examples: `leftIconAttr`, `labelAttr`, `typeAttr`

```javascript
const leftIconAttr = attributes.find(
  attr => attr.type === 'JSXAttribute' && attr.name.name === 'leftIcon'
)
```

**Extracted values (from attribute.value):**
- Pattern: `{name}Value`
- Use when storing the value extracted from an attribute
- Examples: `labelValue`, `iconNameValue`, `imageUriValue`

```javascript
const labelValue = labelAttr.value
```

**Semantic extracted data:**
- Use descriptive names for specific extracted information
- Examples: `iconName`, `extractedText`, `significantChildren`
- Avoid generic suffixes when the meaning is clear

```javascript
const iconName = extractPropFromJSXElement(iconElement, 'Icon', 'name', j)
const { value: extractedText, isComplex } = extractSimpleChild(children, j)
```

**Final JSX attributes (to be added to element):**
- Pattern: `{name}Prop`
- Use when creating new JSXAttribute nodes to add
- Examples: `iconProp`, `textProp`, `typeProp`, `imageProp`

```javascript
const iconProp = j.jsxAttribute(
  j.jsxIdentifier('icon'),
  j.jsxExpressionContainer(iconValue)
)
propsToKeep.push(iconProp)
```

## Collections

**Attribute collections:**
- `propsToKeep` - attributes to keep on element
- `propsToRemove` - attributes to remove from element
- `transformedProps` - renamed/transformed props object

**Child collections:**
- `children` - original children array
- `newChildren` - transformed children array
- `significantChildren` - filtered children (non-whitespace)

**Element collections:**
- `{name}Elements` - JSX elements from AST query
- `elementStyles` - array of { name, styles } objects for StyleSheet

## Function Naming

**Action/transform functions:**
- Pattern: `{verb}{Object}`
- Use imperative verb-first naming
- Examples:
  - `extractPropFromJSXElement`
  - `updateElementName`
  - `addPropsToElement`
  - `removeNamedImport`
  - `buildStyleValue`

**Predicate functions:**
- Pattern: `{is|has|should}{Predicate}`
- Return boolean values
- Examples:
  - `hasNamedImport`
  - `hasAttributes`
  - `shouldExtractToStyleSheet`

**Processing functions:**
- Pattern: `{verb}{Object}`
- Transform or process data
- Examples:
  - `categorizeProps`
  - `processTokenHelper`
  - `applyValueMapping`

## Options and Configuration

**Options object:**
- `sourceImport` - import path to find
- `targetImport` - import path to replace with
- `targetName` - new component name
- `defaultType` - default value for added props

**Mapping objects:**
- `STYLE_PROPS` - props to extract to StyleSheet (UPPER_CASE)
- `TRANSFORM_PROPS` - props to rename on element (UPPER_CASE)
- `DIRECT_PROPS` - props to pass through (UPPER_CASE)
- `DROP_PROPS` - props to remove (UPPER_CASE)

## Utility Function Parameters

**Consistent parameter naming in utilities:**

- `j` - jscodeshift API (always last or second-to-last parameter)
- `root` - parsed source tree
- `path` - AST node path (for transformations)
- `attributes` - JSX attributes array
- `children` - JSX children array
- `element` - JSX element node
- `value` - AST value node
- `imports` - import declaration collection
- `transformedProps` - object of transformed props `{ propName: value }`
- `tokenPath` - dot-separated token path string (NOT `path` which conflicts with AST paths)

**Avoid:**
- Generic names: `data`, `obj`, `item`, `temp`
- Conflicting names: `path` for non-AST paths (use `tokenPath`, `modulePath`, `importPath`)
- Ambiguous names: `props` without context (use `propsToKeep`, `transformedProps`, `styleProps`)

## Examples

### Good
```javascript
// Clear attribute reference
const leftIconAttr = attributes.find(attr => attr.name.name === 'leftIcon')

// Clear value extraction
const labelValue = attr.value

// Semantic extracted data
const iconName = extractPropFromJSXElement(element, 'Icon', 'name', j)

// Clear prop node
const iconProp = j.jsxAttribute(j.jsxIdentifier('icon'), iconValue)
```

### Avoid
```javascript
// ❌ Ambiguous - is it the attribute or the value?
const label = attr.value

// ❌ Confusing - "Prop" suggests JSXAttribute node, but it's a value
const labelProp = attr.value

// ❌ Too generic
const temp = extractedValue
const data = processedData
```
