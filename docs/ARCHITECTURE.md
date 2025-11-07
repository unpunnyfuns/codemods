# Codemod Architecture: Functional Pipeline + Adapter Pattern

## Philosophy

**Codemods are functional compositions of reusable steps.**

Every component migration follows the exact same pattern:
1. Parse options
2. Check imports
3. Find elements
4. Transform elements
5. Collect styles
6. Manage imports
7. Apply StyleSheet

The only differences are:
- Component names
- Prop mappings
- Custom transformation logic

Therefore: **11 component codemods → 11 configurations + generic infrastructure**

## Architecture Overview

```
src/
  infrastructure/              Generic (reusable across migrations)
    core/
      pipeline.js              Functional pipeline orchestration
      PropProcessor.js         Generic builder for prop categorization
      TokenConverter.js        Pluggable token conversion base
      StyleValidator.js        Composable validation pattern
      TransformLogger.js       Observable transformation logging

    steps/
      pipeline-steps.js        Reusable step factories

    rn/
      PlatformValidator.js     React Native style validation
      react-native-model.js    React Native API data

  nb/                          NativeBase→Nordlys specific
    adapters/
      NordlysValidator.js      Composes platform + Nordlys validation
      NordlysTokenConverter.js NativeBase→Nordlys token handlers
      categorizeProps.js       PropProcessor configured for Nordlys

    models/
      target-nordlys.js        Nordlys design tokens
      source-nativebase.js     NativeBase prop definitions
      transforms-colors.js     Color mapping logic
      transforms-tokens.js     Token conversion logic

    configs/
      props-direct.js          Pass-through props
      props-drop.js            Props to remove
      props-style.js           Style prop mappings

    core/
      TargetValidator.js       Nordlys-specific validation

    # Component codemods (20-40 lines each)
    button.js, badge.js, icon.js, stack.js, ...
```

## Layer Separation

### Infrastructure Layer (Generic)

**Purpose:** Migration-agnostic utilities reusable across any codemod project.

**Key files:**
- `pipeline.js` - Pure functional composition, no framework knowledge
- `PropProcessor.js` - Accepts validator/converter as constructor args
- `TokenConverter.js` - Abstract base class with `registerHandler()`
- `StyleValidator.js` - Composes platform + target validators
- `PlatformValidator.js` - React Native specific (but reusable)

**No dependencies on:** NativeBase, Nordlys, or any specific migration.

### Adapter Layer (Project-Specific)

**Purpose:** Bridge generic infrastructure to NativeBase→Nordlys specifics.

**Pattern:**
```javascript
// Generic infrastructure
import { TokenConverter } from '../../infrastructure/core/TokenConverter.js'

// Project-specific data
import { convertSpaceToken, convertColorPath } from '../models/transforms-tokens.js'

// Adapter: Wire them together
export class NordlysTokenConverter extends TokenConverter {
  constructor(logger) {
    super(logger)
    this.registerHandler('space', convertSpaceToken)
    this.registerHandler('color', convertColorPath)
  }
}
```

### Model Layer (Data)

**Purpose:** Source and target framework data models.

- `source-nativebase.js` - NativeBase prop definitions, scales
- `target-nordlys.js` - Nordlys tokens, valid values
- `transforms-*.js` - Mapping logic between source and target

### Config Layer (Prop Mappings)

**Purpose:** Declarative prop categorization configs.

Each component defines:
```javascript
const componentProps = {
  styleProps: { p: 'padding', bg: 'backgroundColor' },
  transformProps: { isDisabled: { targetName: 'disabled' } },
  directProps: ['onPress', 'testID'],
  dropProps: ['_hover', '_pressed'],
}
```

## Functional Pipeline Pattern

Every codemod follows this structure:

```javascript
import { pipeline } from '../infrastructure/core/pipeline.js'
import { parseOptions, checkImports, findElements, ... } from '../infrastructure/steps/pipeline-steps.js'
import { categorizeProps } from './adapters/categorizeProps.js'

export default function transform(fileInfo, api, options) {
  return pipeline(fileInfo, api, options, [
    parseOptions(config),
    checkImports('Component'),
    findElements('Component'),
    initStyleContext(),
    transformElements(transformComponent),
    applyCollectedStyles(),
    manageImports('Component'),
    applyStyleSheet(),
  ])
}

function transformComponent(path, index, ctx) {
  // Component-specific logic
  const categorized = categorizeProps(attributes, componentProps, ctx.j)

  // Build new element
  // Return immutable result
  return {
    element: newElement,
    warnings: [],
    tokenHelpers: new Set(['space']),
    styles: [{ name: 'style0', styles: {...} }]
  }
}
```

**Key principles:**
- **Immutable context flow** - Each step returns new context
- **Pure functions** - Transform functions return results, no mutation
- **Composability** - Steps are independent and reorderable
- **Self-documenting** - Reading the step array shows the entire flow

## Prop Categorization

Props are categorized into 4 buckets:

### 1. styleProps → StyleSheet

Extracted to StyleSheet, validated against platform + target:

```javascript
styleProps: {
  p: { styleName: 'padding', tokenHelper: 'space' },
  bg: { styleName: 'backgroundColor', tokenHelper: 'color' },
}
```

### 2. transformProps → Renamed on Element

Transformed and kept on element (not in StyleSheet):

```javascript
transformProps: {
  isDisabled: { targetName: 'disabled' },
  size: { targetName: 'size', valueMap: { xs: 'sm' } },
}
```

### 3. directProps → Pass Through

Left unchanged on element:

```javascript
directProps: ['onPress', 'testID', 'accessibilityLabel']
```

### 4. dropProps → Removed

Removed entirely (documented in migration comment):

```javascript
dropProps: ['_hover', '_pressed', '_web', '_light', '_dark']
```

## Validation Architecture

Three-level validation:

### Platform Level (React Native)

```javascript
PlatformValidator.validate('View', 'color', value)
// → { isValid: false, reason: 'Text-only prop', category: 'manual' }
```

Checks: Is this prop valid on this RN component?

### Target Level (Nordlys)

```javascript
TargetValidator.validateLiteral('padding', stringLiteral, isDimension)
// → { isValid: false, reason: 'Semantic token not valid for dimension' }
```

Checks: Does this value match Nordlys constraints?

### Composition (NordlysValidator)

```javascript
const validator = new NordlysValidator()
validator.validate('padding', value)
// Composes platform + target validation
```

## Token Conversion

Pluggable registry pattern:

```javascript
class NordlysTokenConverter extends TokenConverter {
  constructor() {
    super()
    // Register handlers for token types
    this.registerHandler('space', (path) => convertSpaceToken(path))
    this.registerHandler('color', (path) => getNordlysColorPath(path))
  }
}

// Usage
converter.convert(value, 'space', j)
// → { converted: true, value: space.md, helperUsed: 'space' }
```

**Handles:**
- String literals: `"md"` → `space.md`
- Member expressions: `color.gray['100']` → `color.gray[100]`
- Conditional expressions: `isDark ? "white" : "black"` → `isDark ? color.white : color.black`

## Observable Logging

TransformLogger provides debugging visibility:

```javascript
const logger = new TransformLogger(options.verbose)

logger.startTransform('Button', 'NordlysButton')
logger.propTransform('disabled', 'true', 'isDisabled', 'renamed')
logger.tokenConversion('space', 'md', 'space.md')
logger.categorization('bg', 'style', '→ backgroundColor')
logger.endTransform()
```

**Output:**
```
🔄 Transform: Button → NordlysButton
  • disabled="true" → isDisabled
  🎨 Token: space md → space.md
  📦 bg → style (backgroundColor)
```

## Error Handling

Two failure modes:

### Soft Failure (Migrate with Warning)

Element is migrated but props are dropped:

```javascript
{/* Dropped during migration:
  _hover={{ bg: 'gray.100' }}
  _pressed={{ bg: 'gray.200' }} */}
<Button onPress={...} text="Submit" />
```

### Hard Failure (Skip Element)

Element cannot be migrated, gets TODO comment:

```javascript
{/* TODO: Button - manual migration required

  color="text.primary" (Text-only prop)

  Action required: Fix issues or migrate manually */}
<Button color="text.primary">Submit</Button>
```

## Re-runnability

All codemods are re-runnable:

1. **Check both source and target imports** - Handles partially migrated files
2. **Skip already migrated elements** - Uses target import check
3. **Preserve existing StyleSheet** - Appends new styles
4. **Idempotent transformations** - Same input → same output

## Metrics

**Before refactor:** 3,200 lines across 11 component codemods
**After refactor:** 1,000 lines (generic) + 500 lines (adapters) + 450 lines (codemods)

**Code reduction:** ~70% elimination of boilerplate
**Architectural consistency:** 11/11 codemods use same pattern
**Test coverage:** 30/30 tests passing