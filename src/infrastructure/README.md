# Infrastructure

Generic codemod infrastructure - reusable across different migration projects.

## Purpose

This directory contains **migration-agnostic** utilities that provide common patterns for building codemods. These utilities have no knowledge of specific source or target frameworks (NativeBase, Nordlys, etc.).

## Structure

```
infrastructure/
  core/
    pipeline.js           - Functional pipeline orchestration
    TransformLogger.js    - Observable transformation logging
    PropProcessor.js      - Generic builder for prop categorization
    TokenConverter.js     - Pluggable token conversion
    StyleValidator.js     - Composable validation pattern

  steps/
    pipeline-steps.js     - Reusable pipeline step factories

  rn/
    PlatformValidator.js  - React Native style validation
    react-native-model.js - React Native API data
```

## Core Utilities

### pipeline.js

Functional pipeline orchestration with skip/modify/effect helpers.

```javascript
import { pipeline } from './infrastructure/core/pipeline.js'

export default function transform(fileInfo, api, options) {
  return pipeline(fileInfo, api, options, [
    parseOptions(config),
    checkImports('Component'),
    findElements('Component'),
    transformElements(transformFn),
    manageImports('Component'),
  ])
}
```

**Key features:**
- Pure functional composition
- Immutable context flow
- Skip conditions for early exit
- Side effects isolated to `effect()` helper

### PropProcessor.js

Builder pattern for categorizing JSX props into buckets (style, transform, drop, direct).

```javascript
import { PropProcessor } from './infrastructure/core/PropProcessor.js'

const processor = new PropProcessor(j, mappings, {
  validator: myValidator,
  converter: myTokenConverter,
  logger: myLogger,
})

const result = processor.process(attributes)
// Returns: { styleProps, transformedProps, droppedProps, ... }
```

**Pluggable dependencies:**
- `validator` - Validates style props and values
- `converter` - Converts token values
- `logger` - Logs transformations for debugging

### TokenConverter.js

Base class for pluggable token conversion across AST node types.

```javascript
import { TokenConverter } from './infrastructure/core/TokenConverter.js'

class MyTokenConverter extends TokenConverter {
  constructor() {
    super()
    this.registerHandler('space', convertSpaceToken)
    this.registerHandler('color', convertColorToken)
  }
}
```

**Handles:**
- String literals → token paths
- Member expressions → token paths
- Conditional/logical expressions

### StyleValidator.js

Composition pattern for platform + target validation.

```javascript
import { StyleValidator } from './infrastructure/core/StyleValidator.js'

const validator = new StyleValidator(
  platformValidator,  // React Native, React DOM, etc.
  targetValidator,    // Design system constraints
  'View'             // Component type
)

const result = validator.validate('padding', value)
// Returns: { isValid, reason?, category? }
```

### TransformLogger.js

Observable logging for debugging transformations.

```javascript
import { TransformLogger } from './infrastructure/core/TransformLogger.js'

const logger = new TransformLogger(true) // enabled

logger.startTransform('Button', 'NordlysButton')
logger.propTransform('disabled', 'true', 'isDisabled', 'renamed')
logger.tokenConversion('space', 'md', 'space.md')
logger.endTransform()
```

## Pipeline Steps

Reusable step factories in `steps/pipeline-steps.js`:

- `parseOptions(config)` - Parse and validate CLI options
- `checkImports(elementName)` - Verify source imports exist
- `findElements(elementName)` - Find JSX elements to transform
- `initStyleContext()` - Initialize StyleSheet context
- `transformElements(transformFn)` - Apply transformation function
- `applyCollectedStyles()` - Collect styles from transform results
- `manageImports(elementName)` - Manage import statements
- `applyStyleSheet()` - Add StyleSheet to file

## React Native Platform

`rn/` directory contains React Native-specific validation:

- `PlatformValidator.js` - Validates against RN component APIs
- `react-native-model.js` - View/Text style prop definitions

**Reusable for any React Native migration** (not specific to NativeBase or Nordlys).

## Usage Pattern

**For a new migration project:**

1. **Use pipeline.js directly** - No changes needed
2. **Extend TokenConverter** - Register your token handlers
3. **Compose StyleValidator** - Provide platform + target validators
4. **Configure PropProcessor** - Inject your validators/converters
5. **Create adapters** - Bridge generic infrastructure to your specific migration

See `src/nb/adapters/` for NativeBase→Nordlys examples.