# Helpers

Project-specific helper utilities for codemod transformations.

## Structure

| File | Purpose |
|------|---------|
| `style-context.js` | StyleSheet context management for accumulating and applying styles |

## Module Details

### style-context.js

Manages StyleSheet accumulation and application across element transformations.

**Exports:**
```javascript
createStyleContext() to {
  addStyle(name, styles)
  addHelpers(helpers)
  length
  hasStyles()
  applyToRoot(root, options, j)
}
```

**Usage:**
```javascript
import { createStyleContext } from '../helpers/style-context.js'

const styles = createStyleContext()

// Accumulate styles for each element
boxElements.forEach((path, index) => {
  styles.addStyle(`box${index}`, {
    padding: 16,
    backgroundColor: 'blue'
  })
})

// Track used token helpers
styles.addHelpers(['color', 'space'])

// Apply accumulated styles at end of transform
if (styles.hasStyles()) {
  styles.applyToRoot(root, { wrap: false }, j)
}
```

**Key features:**
- Accumulates element styles during transformation
- Creates or extends existing StyleSheet.create()
- Tracks token helper imports needed
- Handles StyleSheet import management
- Configurable wrapping behavior

**Options:**
- `wrap: boolean` - Whether to wrap file in IIFE (default: true)

## External Utilities

Other commonly used utilities come from `@puns/shiftkit`:

**Import utilities:**
```javascript
import { addNamedImport, removeNamedImport, hasNamedImport } from '@puns/shiftkit'
```

**JSX utilities:**
```javascript
import { findJSXElements, filterAttributes, buildStyleValue } from '@puns/shiftkit/jsx'
```

**RN utilities:**
```javascript
import { shouldExtractToStyleSheet, addOrExtendStyleSheet } from '@puns/shiftkit/rn'
```

See [@puns/shiftkit documentation](https://github.com/puns/shiftkit) for details.
