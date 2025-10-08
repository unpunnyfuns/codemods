# Creating New Migrations

Step-by-step guide for adding component-specific migration codemods.

## Overview

Creating a new migration involves:
1. Define prop mappings
2. Write migration transform
3. Create test fixtures
4. Write tests
5. Update run.sh
6. Run and verify

## Step 1: Define Prop Mappings

Create `src/mappings/my-component-props.js` using common modules:

```javascript
/**
 * Prop mappings for MyComponent migration
 */

import * as commonStyleProps from './common-style-props.js'
import * as commonDirectProps from './common-direct-props.js'
import * as commonDropProps from './common-drop-props.js'
import * as commonValueMaps from './common-value-maps.js'

// STYLE_PROPS: Extracted to StyleSheet
export const styleProps = {
  // Common style props
  ...commonStyleProps.spacing,
  ...commonStyleProps.sizing,
  ...commonStyleProps.color,
  ...commonStyleProps.border,

  // Component-specific with value mapping
  iconSize: {
    styleName: 'width',
    valueMap: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 32,
      xl: 40
    }
  }
}

// TRANSFORM_PROPS: Renamed on element
export const transformProps = {
  // Simple renames
  isCircular: 'circular',
  isDisabled: 'disabled',

  // With value mapping
  variant: {
    propName: 'appearance',
    valueMap: {
      solid: 'filled',
      outline: 'outlined',
      ghost: 'text'
    }
  }
}

// DIRECT_PROPS: Pass through unchanged
export const directProps = [
  ...commonDirectProps.eventHandlers,
  ...commonDirectProps.accessibility,
  // Component-specific
  'name',
  'source'
]

// DROP_PROPS: Remove entirely
export const dropProps = [
  ...commonDropProps.pseudoProps,
  ...commonDropProps.platformOverrides,
  ...commonDropProps.themeOverrides,
  // Component-specific
  'colorScheme',
  'rightIcon'
]
```

See [prop-mappings.md](./prop-mappings.md) for detailed mapping guide.

## Step 2: Write Migration Transform

Create `src/migrations/my-component.js`:

```javascript
/**
 * Migrate NativeBase MyComponent to Nordlys TargetComponent
 *
 * <MyComponent bg="blue.500" p={4} isCircular={true}>{children}</MyComponent>
 * =>
 * import { StyleSheet } from 'react-native'
 * <TargetComponent style={styles.target0} circular={true}>{children}</TargetComponent>
 * const styles = StyleSheet.create({
 *   target0: { backgroundColor: color.blue['500'], padding: 4 }
 * })
 */

import { directProps, dropProps, styleProps, transformProps } from '../mappings/my-component-props.js'
import { addNamedImport, hasNamedImport, removeNamedImport } from '../utils/imports.js'
import {
  addPropsToElement,
  addStyleProp,
  buildStyleValue,
  removePropsFromElement,
  updateElementName
} from '../utils/jsx-transforms.js'
import { addOrExtendStyleSheet, categorizeProps } from '../utils/props.js'

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Configuration
  const sourceImport = options.sourceImport || 'native-base'
  const targetImport = options.targetImport || '@nordlys/components'
  const sourceName = options.sourceName || 'MyComponent'
  const targetName = options.targetName || 'TargetComponent'

  let hasChanges = false

  // Find and transform elements
  root.findJSXElements(sourceName).forEach(path => {
    // Only transform if from correct import
    if (!hasNamedImport(root, j, sourceImport, sourceName)) {
      return
    }

    hasChanges = true

    // Categorize props
    const categorized = categorizeProps(path, {
      styleProps,
      transformProps,
      directProps,
      dropProps
    })

    // Handle style props
    let styleIdentifier = null
    if (Object.keys(categorized.style).length > 0) {
      styleIdentifier = addOrExtendStyleSheet(
        root,
        j,
        targetName.toLowerCase(),
        categorized.style
      )
    }

    // Update element
    updateElementName(path, targetName)

    // Remove all props first (clean slate)
    removePropsFromElement(path, [
      ...Object.keys(categorized.style),
      ...Object.keys(categorized.transform),
      ...Object.keys(categorized.direct),
      ...categorized.drop
    ])

    // Add style prop if needed
    if (styleIdentifier) {
      addStyleProp(j, path, styleIdentifier)
    }

    // Add transform props (renamed)
    for (const [key, value] of Object.entries(categorized.transform)) {
      addPropsToElement(j, path, { [key]: value })
    }

    // Add direct props (unchanged)
    for (const [key, value] of Object.entries(categorized.direct)) {
      addPropsToElement(j, path, { [key]: value })
    }

    // Handle component-specific logic here
    // For example: icon extraction, children transformation, etc.
  })

  if (!hasChanges) {
    return fileInfo.source
  }

  // Update imports
  if (hasNamedImport(root, j, sourceImport, sourceName)) {
    removeNamedImport(root, j, sourceImport, sourceName)
    addNamedImport(root, j, targetImport, targetName)

    // Add StyleSheet import if we created styles
    const hasStyleSheet = root.find(j.CallExpression, {
      callee: {
        object: { name: 'StyleSheet' },
        property: { name: 'create' }
      }
    }).length > 0

    if (hasStyleSheet) {
      addNamedImport(root, j, 'react-native', 'StyleSheet')
    }
  }

  return root.toSource()
}

export default main
```

### Component-Specific Logic Examples

#### Icon Extraction (Button)

```javascript
// Extract leftIcon prop
const leftIconProp = extractPropFromJSXElement(path, 'leftIcon')
if (leftIconProp) {
  addPropsToElement(j, path, { icon: leftIconProp.value })
}
```

#### Children Wrapping (Switch)

```javascript
// Wrap Switch in View (Switch doesn't support style prop)
if (styleIdentifier) {
  createViewWrapper(j, path, styleIdentifier)
  // Don't add style to Switch itself
  styleIdentifier = null
}
```

#### Children Transformation (Typography)

```javascript
// Extract simple text children
const textChild = extractSimpleChild(j, path)
if (textChild) {
  // Transform or validate text
}
```

## Step 3: Create Test Fixtures

Create input fixture `src/__testfixtures__/migrations/my-component.input.tsx`:

```tsx
import { MyComponent } from 'native-base'

export function Example() {
  return (
    <>
      <MyComponent bg="blue.500" p={4} isCircular={true}>
        Content
      </MyComponent>

      <MyComponent
        iconSize="lg"
        variant="outline"
        isDisabled={false}
        testID="test"
        onPress={() => console.log('pressed')}
      />

      <MyComponent
        _hover={{ bg: 'red' }}
        _light={{ bg: 'white' }}
        colorScheme="primary"
      />
    </>
  )
}
```

Create expected output fixture `src/__testfixtures__/migrations/my-component.output.tsx`:

```tsx
import { StyleSheet } from 'react-native'
import { TargetComponent } from '@nordlys/components'
import { color } from '@org/tokens'

export function Example() {
  return (
    <>
      <TargetComponent style={styles.targetcomponent0} circular={true}>
        Content
      </TargetComponent>

      <TargetComponent
        style={styles.targetcomponent1}
        appearance="outlined"
        disabled={false}
        testID="test"
        onPress={() => console.log('pressed')}
      />

      <TargetComponent />
    </>
  )
}

const styles = StyleSheet.create({
  targetcomponent0: { backgroundColor: color.blue['500'], padding: 4 },
  targetcomponent1: { width: 32 }
})
```

## Step 4: Write Tests

Create `src/__tests__/migrations/my-component.test.js`:

```javascript
import { describe, expect, it } from 'vitest'
import { testTransform } from '../test-helper.js'

describe('migrations/my-component', () => {
  it('migrates MyComponent to TargetComponent with prop transformations', () => {
    const output = testTransform(
      'migrations/my-component',
      'migrations/my-component',
      'tsx'
    )
    expect(output).toMatchSnapshot()
  })

  // Optional: test edge cases
  it('handles missing props', () => {
    const output = testTransform(
      'migrations/my-component',
      'migrations/my-component-empty',
      'tsx'
    )
    expect(output).toMatchSnapshot()
  })
})
```

## Step 5: Update run.sh

Add case to `run.sh`:

```bash
case "$CODEMOD_NAME" in
  # ... existing cases ...

  migrate-my-component)
    TRANSFORM_PATH="src/migrations/my-component.js"
    ;;

  # ... rest of cases ...
esac
```

Update help text:

```bash
echo "  - migrate-my-component"
```

## Step 6: Run and Verify

### Run Tests

```bash
npm test
```

Expected output:
```
✓ src/__tests__/migrations/my-component.test.js (1 test)
  Snapshots  1 written
```

### Test on Real Code

```bash
./run.sh migrate-my-component "path/to/test-file.tsx"
```

Review the output and verify:
- ✅ Imports updated correctly
- ✅ Element renamed
- ✅ Props categorized correctly
- ✅ StyleSheet generated with correct properties
- ✅ Transform props renamed
- ✅ Direct props passed through
- ✅ Drop props removed

### Common Issues

**Imports not found**
```javascript
// Check hasNamedImport before transforming
if (!hasNamedImport(root, j, sourceImport, sourceName)) {
  return  // Skip this element
}
```

**Style props not extracted**
```javascript
// Verify prop is in styleProps mapping
const styleProps = {
  bg: 'backgroundColor',  // Make sure this exists
  // ...
}
```

**Values not transformed**
```javascript
// Add valueMap for token transformations
space: {
  styleName: 'gap',
  valueMap: { 1: 4, 2: 8 }  // Numeric transformation
}
```

**Props appearing twice**
```javascript
// Remove old props before adding new ones
removePropsFromElement(path, [
  ...Object.keys(categorized.style),
  // ...
])
```

## Advanced Patterns

### Conditional Transformation

```javascript
// Different behavior based on prop values
const variant = extractPropFromJSXElement(path, 'variant')
if (variant && variant.value === 'icon-only') {
  // Special handling for icon-only buttons
  console.warn('Icon-only buttons require manual migration')
  return
}
```

### Multi-Element Transformation

```javascript
// Transform related elements together
root.findJSXElements('Modal').forEach(modalPath => {
  // Find nested ModalContent, ModalHeader, etc.
  const content = j(modalPath).findJSXElements('ModalContent')
  const header = j(modalPath).findJSXElements('ModalHeader')

  // Transform together maintaining structure
})
```

### Complex Children Handling

```javascript
// Extract and transform children
const children = path.value.children || []
const textChildren = children.filter(child =>
  child.type === 'JSXText' ||
  (child.type === 'JSXExpressionContainer' &&
   child.expression.type === 'StringLiteral')
)

// Wrap non-text children
if (textChildren.length !== children.length) {
  // Has complex children - needs manual review
  console.warn('Complex children detected')
}
```

## Testing Checklist

Before committing:

- [ ] Tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Fixtures cover common cases
- [ ] Fixtures cover edge cases (empty props, complex children)
- [ ] run.sh includes new codemod
- [ ] Tested on real code sample
- [ ] Warnings added for unsupported patterns
- [ ] README updated with new codemod

## Reference Migrations

Study these existing migrations as examples:

### Simple Migration (Box)
- Straightforward prop mapping
- Pure style prop extraction
- Minimal component-specific logic
- File: `src/migrations/box.js`

### Complex Migration (Button)
- Icon extraction from leftIcon prop
- Children text extraction
- Warnings for unsupported patterns
- File: `src/migrations/button.js`

### Wrapper Pattern (Switch)
- Wraps component in View
- Moves style to wrapper
- File: `src/migrations/switch.js`

### Token Integration (Typography)
- Color token imports
- Nested member expressions
- File: `src/migrations/typography.js`

### Conditional Props (Stack)
- Direction based on component name (HStack vs VStack)
- Value mapping with semantic tokens
- File: `src/migrations/stack.js`

## Documentation

After creating migration:

1. Update CLAUDE.md with new codemod
2. Add example to README.md
3. Document any special patterns or gotchas
4. Add to migration table with example

## Tips

- Start simple: Get basic prop mapping working first
- Test incrementally: Run tests after each change
- Use fixtures: Create fixtures before writing migration
- Study existing: Copy patterns from similar migrations
- Warn don't fail: Log warnings for unsupported patterns, don't crash
- Preserve structure: Maintain JSX structure and formatting
- Be conservative: Pass through unknown props unchanged
