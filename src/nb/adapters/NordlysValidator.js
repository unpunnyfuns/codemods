/**
 * NordlysValidator - NativeBase→Nordlys validation
 *
 * Composes React Native platform validation with Nordlys target validation.
 * This adapter wires together:
 * - PlatformValidator: React Native style prop constraints
 * - TargetValidator: Nordlys design token and value constraints
 */

import { StyleValidator } from '../../infrastructure/core/StyleValidator.js'
import { PlatformValidator } from '../../infrastructure/rn/PlatformValidator.js'
import { TargetValidator } from '../core/TargetValidator.js'

export class NordlysValidator extends StyleValidator {
  constructor(componentType = 'View') {
    const platformValidator = new PlatformValidator()
    const targetValidator = new TargetValidator()
    super(platformValidator, targetValidator, componentType)
  }
}
