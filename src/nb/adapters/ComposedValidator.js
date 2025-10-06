/**
 * ComposedValidator - NativeBase→target validation
 *
 * Composes React Native platform validation with target validation.
 * This adapter wires together:
 * - PlatformValidator: React Native style prop constraints
 * - TargetValidator: Design token and value constraints
 */

import { StyleValidator } from '../../lib/StyleValidator.js'
import { PlatformValidator } from '../../lib/rn/PlatformValidator.js'
import { TargetValidator } from './TargetValidator.js'

export class ComposedValidator extends StyleValidator {
  constructor(componentType = 'View') {
    const platformValidator = new PlatformValidator()
    const targetValidator = new TargetValidator()
    super(platformValidator, targetValidator, componentType)
  }
}
