/**
 * TransformLogger - Makes transformations observable
 *
 * Provides structured logging for transformation steps to make the
 * hidden transformation flow visible: p="md" → space.md
 *
 * Usage:
 *   const logger = new TransformLogger(options.debug)
 *   logger.propTransform('p', 'md', 'space.md', 'padding with space token')
 */

export class TransformLogger {
  constructor(enabled = false) {
    this.enabled = enabled
    this.indent = 0
    this.steps = []
  }

  /**
   * Start a transformation group (e.g., "Box → View")
   */
  startTransform(componentName, targetName) {
    if (!this.enabled) {
      return
    }
    console.log(`\n🔄 Transform: ${componentName} → ${targetName}`)
    this.indent = 1
  }

  /**
   * End a transformation group
   */
  endTransform() {
    if (!this.enabled) {
      return
    }
    this.indent = 0
  }

  /**
   * Log a prop transformation
   */
  propTransform(inputProp, inputValue, outputValue, reason) {
    if (!this.enabled) {
      return
    }
    const prefix = '  '.repeat(this.indent)
    console.log(`${prefix}• ${inputProp}="${inputValue}" → ${outputValue}`)
    if (reason) {
      console.log(`${prefix}  ↳ ${reason}`)
    }
  }

  /**
   * Log a validation failure
   */
  validationFailure(propName, value, reason) {
    if (!this.enabled) {
      return
    }
    const prefix = '  '.repeat(this.indent)
    console.log(`${prefix}❌ ${propName}=${value}`)
    console.log(`${prefix}  ↳ ${reason}`)
  }

  /**
   * Log a token conversion
   */
  tokenConversion(tokenType, input, output) {
    if (!this.enabled) {
      return
    }
    const prefix = '  '.repeat(this.indent)
    if (input === output) {
      console.log(`${prefix}  🔗 ${tokenType}.${input} (no conversion needed)`)
    } else {
      console.log(`${prefix}  🔗 ${tokenType}: ${input} → ${output}`)
    }
  }

  /**
   * Log a prop categorization
   */
  categorization(propName, category, details = '') {
    if (!this.enabled) {
      return
    }
    const prefix = '  '.repeat(this.indent)
    const emoji =
      {
        style: '📝',
        transform: '🔄',
        direct: '➡️',
        drop: '🗑️',
      }[category] || '❓'
    console.log(`${prefix}${emoji} ${propName} → ${category} ${details}`)
  }

  /**
   * Log preprocessing step
   */
  preprocessing(description) {
    if (!this.enabled) {
      return
    }
    const prefix = '  '.repeat(this.indent)
    console.log(`${prefix}⚙️  Preprocessing: ${description}`)
  }

  /**
   * Log step in pipeline
   */
  step(stepName) {
    if (!this.enabled) {
      return
    }
    console.log(`\n▶️  ${stepName}`)
    this.indent = 1
  }

  /**
   * Increase indent level
   */
  push() {
    if (!this.enabled) {
      return
    }
    this.indent++
  }

  /**
   * Decrease indent level
   */
  pop() {
    if (!this.enabled) {
      return
    }
    this.indent = Math.max(0, this.indent - 1)
  }
}
