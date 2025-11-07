/**
 * NordlysTokenConverter - NativeBase→Nordlys token conversion
 *
 * Extends generic TokenConverter with NativeBase→Nordlys specific handlers:
 * - space: NativeBase spacing tokens → Nordlys space tokens
 * - radius: NativeBase radius tokens → Nordlys radius tokens
 * - color: NativeBase color paths → Nordlys color paths
 */

import { TokenConverter } from '../../infrastructure/core/TokenConverter.js'
import { getNordlysColorPath, isLiteralColor } from '../models/transforms-colors.js'
import { convertRadiusToken, convertSpaceToken } from '../models/transforms-tokens.js'

export class NordlysTokenConverter extends TokenConverter {
  constructor(logger = null) {
    super(logger)

    // Register NativeBase→Nordlys token handlers
    this.registerHandler('space', convertSpaceToken)
    this.registerHandler('radius', convertRadiusToken)
    this.registerHandler('color', getNordlysColorPath)
  }

  /**
   * Override to provide Nordlys-specific literal color detection
   */
  isLiteralColor(tokenPath) {
    return isLiteralColor(tokenPath)
  }
}
