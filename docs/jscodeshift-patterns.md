# jscodeshift Patterns

Common patterns for working with jscodeshift in React/React Native codemods.

## Basic Structure

Every codemod exports a function with this signature:

```javascript
function transform(fileInfo, api, options) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Transform AST
  root.find(j.SomeNode).forEach(path => {
    // Modify path.node
  })

  return root.toSource()
}

export default transform
```

## Finding JSX Elements

```javascript
// Find by component name
root.findJSXElements('Box').forEach(path => {
  // path.node is the JSXElement
})

// Find with filter
root.find(j.JSXElement, {
  openingElement: {
    name: { name: 'Button' }
  }
}).forEach(path => {
  // ...
})
```

## Working with JSX Attributes

### Read Attributes

```javascript
const attributes = path.node.openingElement.attributes

// Find specific attribute
const bgProp = attributes.find(attr =>
  attr.type === 'JSXAttribute' && attr.name.name === 'bg'
)

if (bgProp) {
  const value = bgProp.value
  // JSXExpressionContainer: value.expression
  // StringLiteral: value.value
  // Literal: value.value
}
```

### Add/Remove Attributes

```javascript
// Add attribute
path.node.openingElement.attributes.push(
  j.jsxAttribute(
    j.jsxIdentifier('testID'),
    j.stringLiteral('test')
  )
)

// Remove attribute
path.node.openingElement.attributes = attributes.filter(attr =>
  !(attr.type === 'JSXAttribute' && attr.name.name === 'bg')
)
```

### Rename Element

```javascript
// Change <Box> to <View>
path.node.openingElement.name = j.jsxIdentifier('View')
if (path.node.closingElement) {
  path.node.closingElement.name = j.jsxIdentifier('View')
}
```

## Working with Imports

### Find Imports

```javascript
root.find(j.ImportDeclaration, {
  source: { value: 'native-base' }
}).forEach(path => {
  // path.node.specifiers contains the imports
})
```

### Add Named Import

```javascript
// Check if import exists
const existingImport = root.find(j.ImportDeclaration, {
  source: { value: 'react-native' }
})

if (existingImport.length > 0) {
  // Add to existing import
  const specifiers = existingImport.get().node.specifiers
  if (!specifiers.find(s => s.imported.name === 'View')) {
    specifiers.push(j.importSpecifier(j.identifier('View')))
  }
} else {
  // Create new import
  const newImport = j.importDeclaration(
    [j.importSpecifier(j.identifier('View'))],
    j.stringLiteral('react-native')
  )
  root.find(j.Program).get('body', 0).insertBefore(newImport)
}
```

### Remove Named Import

```javascript
root.find(j.ImportDeclaration, {
  source: { value: 'native-base' }
}).forEach(path => {
  // Remove 'Box' from specifiers
  path.node.specifiers = path.node.specifiers.filter(spec =>
    !(spec.type === 'ImportSpecifier' && spec.imported.name === 'Box')
  )

  // Remove entire import if no specifiers left
  if (path.node.specifiers.length === 0) {
    j(path).remove()
  }
})
```

## Working with Expressions

### Member Expressions

```javascript
// Build: styles.box0
j.memberExpression(
  j.identifier('styles'),
  j.identifier('box0')
)

// Build: color.blue['500'] (bracket notation for numeric keys)
j.memberExpression(
  j.memberExpression(
    j.identifier('color'),
    j.identifier('blue')
  ),
  j.stringLiteral('500'),
  true  // computed = true for bracket notation
)
```

### Object Expressions

```javascript
// Build: { backgroundColor: 'blue', padding: 4 }
j.objectExpression([
  j.property('init',
    j.identifier('backgroundColor'),
    j.stringLiteral('blue')
  ),
  j.property('init',
    j.identifier('padding'),
    j.literal(4)
  )
])
```

### Call Expressions

```javascript
// Build: StyleSheet.create({ ... })
j.callExpression(
  j.memberExpression(
    j.identifier('StyleSheet'),
    j.identifier('create')
  ),
  [j.objectExpression(properties)]
)
```

## Working with Children

### Access Children

```javascript
const children = path.node.children || []

// Filter meaningful children (ignore whitespace)
const meaningfulChildren = children.filter(child =>
  !(child.type === 'JSXText' && /^\s*$/.test(child.value))
)
```

### Wrap Element

```javascript
// Wrap <Switch /> in <View>
const wrapper = j.jsxElement(
  j.jsxOpeningElement(j.jsxIdentifier('View'), [styleAttribute]),
  j.jsxClosingElement(j.jsxIdentifier('View')),
  [path.node]
)

j(path).replaceWith(wrapper)
```

## Finding and Replacing

### Replace Node

```javascript
root.findJSXElements('Box').forEach(path => {
  const newNode = j.jsxElement(
    j.jsxOpeningElement(j.jsxIdentifier('View'), path.node.openingElement.attributes),
    j.jsxClosingElement(j.jsxIdentifier('View')),
    path.node.children
  )

  j(path).replaceWith(newNode)
})
```

### Insert Before/After

```javascript
// Insert import at top of file
const firstNode = root.find(j.Program).get('body', 0)
firstNode.insertBefore(newImportDeclaration)

// Insert after last import
root.find(j.ImportDeclaration).at(-1).insertAfter(newStatement)
```

## Type Checking

```javascript
// Check node type
if (node.type === 'JSXElement') { /* ... */ }
if (node.type === 'JSXExpressionContainer') { /* ... */ }
if (node.type === 'StringLiteral') { /* ... */ }

// Check attribute value type
if (attr.value.type === 'JSXExpressionContainer') {
  const expression = attr.value.expression
  if (expression.type === 'NumericLiteral') {
    const num = expression.value
  }
}
```

## Common Pitfalls

### Avoid String Manipulation

❌ Don't:
```javascript
const source = root.toSource()
return source.replace(/<Box/g, '<View')
```

✅ Do:
```javascript
root.findJSXElements('Box').forEach(path => {
  path.node.openingElement.name = j.jsxIdentifier('View')
  if (path.node.closingElement) {
    path.node.closingElement.name = j.jsxIdentifier('View')
  }
})
```

### Check Imports Before Transforming

❌ Don't:
```javascript
root.findJSXElements('Box').forEach(path => {
  // Transform all Box elements
})
```

✅ Do:
```javascript
const hasBoxImport = root.find(j.ImportDeclaration, {
  source: { value: 'native-base' }
}).some(path =>
  path.node.specifiers.some(s => s.imported.name === 'Box')
)

if (hasBoxImport) {
  root.findJSXElements('Box').forEach(path => {
    // Transform only if imported from native-base
  })
}
```

### Handle Both Self-Closing and Regular Elements

```javascript
root.findJSXElements('Box').forEach(path => {
  // Update opening tag
  path.node.openingElement.name = j.jsxIdentifier('View')

  // Update closing tag (may not exist for self-closing)
  if (path.node.closingElement) {
    path.node.closingElement.name = j.jsxIdentifier('View')
  }
})
```

## Testing Codemods

```javascript
import jscodeshift from 'jscodeshift'
import transform from './my-transform.js'

function runTransform(source) {
  const fileInfo = { path: 'test.js', source }
  const api = {
    jscodeshift: jscodeshift.withParser('tsx'),
    j: jscodeshift.withParser('tsx'),
    stats: () => {},
    report: () => {}
  }
  return transform(fileInfo, api, {})
}

const input = `import { Box } from 'native-base'
<Box bg="blue" />`

const output = runTransform(input)
console.log(output)
```

## Performance Tips

1. **Single pass**: Find and transform in one pass when possible
2. **Batch imports**: Collect all import changes, apply once at the end
3. **Early return**: Skip files with no changes
4. **Avoid deep nesting**: Keep transforms shallow and focused

```javascript
function transform(fileInfo, api, options) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Early return if nothing to transform
  const hasTarget = root.findJSXElements('Box').length > 0
  if (!hasTarget) return fileInfo.source

  let hasChanges = false

  // Single pass transformation
  root.findJSXElements('Box').forEach(path => {
    hasChanges = true
    // Transform
  })

  if (!hasChanges) return fileInfo.source

  return root.toSource()
}
```
