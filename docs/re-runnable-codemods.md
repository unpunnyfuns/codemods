# Re-runnable Codemods Strategy

Codemods must support running multiple times on the same file to handle:
- Partial migrations (some elements skipped due to errors)
- Incremental updates to previously migrated code
- Iterative refinement during development

## Two Patterns

### Pattern 1: Import Preservation (Different Component Names)

**Use when:** Source and target components have different names
- `Box` → `View`
- `HStack/VStack` → `Stack`

**Strategy:**
1. Track count of skipped elements
2. Only remove source import if `skipped === 0`
3. Skipped elements remain broken (with TODO comments) until manually fixed
4. Keeps source import so skipped JSX elements have valid component reference

**Implementation:**

```javascript
let migrated = 0
let skipped = 0

elements.forEach((path) => {
  if (hasManualFailures) {
    console.warn('Element skipped - manual fixes required')
    addTodoComment(path, componentName, invalidStyles, j)
    skipped++
    return
  }

  // ... transform element
  migrated++
})

// Only remove import if no elements were skipped
if (skipped === 0) {
  removeNamedImport(imports, 'Box', j)
} else {
  console.warn(`Box import kept - ${skipped} element(s) skipped and still reference Box`)
}

// Always add target import if any elements migrated
if (migrated > 0) {
  addNamedImport(root, targetImport, 'View', j)
}
```

**Applied to:**
- `box.js` - Box → View
- `stack.js` - HStack/VStack → Stack

---

### Pattern 2: Re-running Support (Same Component Name)

**Use when:** Source and target components have the same name
- `Button` → `Button` (different package)
- `Avatar` → `Avatar` (different package)
- `Input` → `Input` (different package)

**Strategy:**
1. Check for imports from BOTH sourceImport AND targetImport
2. Find elements by component name (works for both since name is identical)
3. Remove old import (if exists), add new import
4. Can run multiple times - processes any elements regardless of import source

**Implementation:**

```javascript
// Check both source and target imports
const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
const targetImports = root.find(j.ImportDeclaration, { source: { value: targetImport } })

const hasSourceButton = sourceImports.length > 0 && hasNamedImport(sourceImports, 'Button')
const hasTargetButton = targetImports.length > 0 && hasNamedImport(targetImports, 'Button')

if (!hasSourceButton && !hasTargetButton) {
  return fileInfo.source
}

// Find all Button elements (works for both imports since name is same)
const buttonElements = findJSXElements(root, 'Button', j)

// ... process elements

// Only change imports if we migrated at least one element
if (migrated === 0) {
  return fileInfo.source
}

// Remove Button from source import (if it exists) and add to target
if (hasSourceButton) {
  removeNamedImport(sourceImports, 'Button', j)
}
addNamedImport(root, targetImport, targetName, j)
```

**Applied to:**
- `button.js` - Button → Button
- `avatar.js` - Avatar → Avatar
- `input.js` - Input → Input
- `badge.js` - Badge → Badge
- `alert.js` - Alert → Alert
- `typography.js` - Typography → Typography
- `pressable.js` - Pressable → Pressable
- `switch.js` - Switch → Switch
- `icon.js` - Icon → Icon

---

## Decision Tree

```
Does the codemod change the component name?
│
├─ YES (Box → View, HStack → Stack)
│  └─ Use Pattern 1: Import Preservation
│     - Track skipped count
│     - Keep source import if any elements skipped
│     - Skipped elements have TODO comments, wait for manual fix
│
└─ NO (Button → Button, same name different package)
   └─ Use Pattern 2: Re-running Support
      - Check both source and target imports
      - Process all elements regardless of import source
      - Always replace imports when migrated > 0
```

## Benefits

### Import Preservation (Pattern 1)
✅ Source file remains valid TypeScript (skipped elements still have import)
✅ Clear warnings about what needs manual attention
✅ Can run codemod again after manual fixes (will process remaining elements)

### Re-running Support (Pattern 2)
✅ Can run codemod multiple times to refine previously migrated code
✅ Useful during development/testing of the codemod itself
✅ Handles partially migrated files from previous codemod versions
✅ Works naturally since component name doesn't change

## Common Mistakes to Avoid

❌ **Always removing imports if migrated > 0**
```javascript
// BAD: Removes import even when elements were skipped
if (migrated > 0) {
  removeNamedImport(imports, 'Box', j)
}
```

✅ **Only remove when all elements migrated**
```javascript
// GOOD: Preserves import for skipped elements
if (skipped === 0) {
  removeNamedImport(imports, 'Box', j)
}
```

❌ **Only checking source import (prevents re-running)**
```javascript
// BAD: Won't find elements if already migrated once
const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
if (!imports.length || !hasNamedImport(imports, 'Button')) {
  return fileInfo.source
}
```

✅ **Check both source and target imports**
```javascript
// GOOD: Can process files with either import
const sourceImports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
const targetImports = root.find(j.ImportDeclaration, { source: { value: targetImport } })

const hasSourceButton = sourceImports.length > 0 && hasNamedImport(sourceImports, 'Button')
const hasTargetButton = targetImports.length > 0 && hasNamedImport(targetImports, 'Button')

if (!hasSourceButton && !hasTargetButton) {
  return fileInfo.source
}
```

## Testing Re-runnability

### Pattern 1 Test (Import Preservation)
```javascript
// First run: processes valid elements, skips invalid ones
const input = `
import { Box } from 'native-base'
export const A = () => <Box bg="blue">Valid</Box>
export const B = () => <Box invalidProp="bad">Invalid</Box>
`

const firstRun = transform(input, api, options)
// Should have: View import, Box import, TODO comment on B

// Second run: after manually fixing B
const secondRun = transform(firstRun, api, options)
// Should have: View import, no Box import, both migrated
```

### Pattern 2 Test (Re-running)
```javascript
// Already migrated once
const input = `
import { Button } from '@hb-frontend/app/src/components/nordlys/Button'
export const A = () => <Button text="old" />
`

// Run again with updated codemod
const output = transform(input, api, options)
// Should still process the Button and update it
```

## Commits

- `857a723` - stack.js import preservation on partial migration
- `1e8bc72` - avatar.js re-running support
- `4eb1bb3` - Add re-running support to all component→component codemods (input, badge, alert, typography, pressable, switch, icon)
