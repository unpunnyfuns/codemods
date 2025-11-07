/**
 * categorizeProps - NativeBase→Nordlys facade
 *
 * Convenience facade over PropProcessor configured with Nordlys adapters.
 * This is the main entry point for component migrations.
 *
 * Returns categorized props:
 * - styleProps: Props to extract to StyleSheet (validated)
 * - inlineStyles: Props to keep as inline styles
 * - transformedProps: Props to rename/transform on element
 * - propsToRemove: Attributes to remove from element
 * - usedTokenHelpers: Set of token helpers used
 * - droppedProps: Array of { name, attr } for dropped props
 * - invalidStyles: Array of { styleName, value } for invalid style values
 * - existingStyleReferences: Array of MemberExpression for existing StyleSheet refs
 * - hasManualFailures: Boolean indicating if any manual-category failures occurred
 */

import { PropProcessor } from '../../infrastructure/core/PropProcessor.js'
import { NordlysTokenConverter } from './NordlysTokenConverter.js'
import { NordlysValidator } from './NordlysValidator.js'

export function categorizeProps(attributes, mappings, j, logger = null) {
  const validator = new NordlysValidator()
  const converter = new NordlysTokenConverter(logger)

  const processor = new PropProcessor(j, mappings, {
    validator,
    converter,
    logger,
  })

  return processor.process(attributes)
}
