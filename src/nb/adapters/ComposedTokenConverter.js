/**
 * ComposedTokenConverter - NativeBase→target token conversion
 *
 * Extends generic TokenConverter with NativeBase→target specific handlers:
 * - space: NativeBase spacing tokens → target space tokens
 * - radius: NativeBase radius tokens → target radius tokens
 * - color: NativeBase color paths → target color paths
 */

import { TokenConverter } from '../../lib/rn/TokenConverter.js'
import { getTargetColorPath, isLiteralColor } from '../models/transforms-colors.js'
import { convertRadiusToken, convertSpaceToken } from '../models/transforms-tokens.js'

export class ComposedTokenConverter extends TokenConverter {
  constructor(logger = null) {
    super(logger)

    // Register NativeBase→target token handlers
    this.registerHandler('space', convertSpaceToken)
    this.registerHandler('radius', convertRadiusToken)
    this.registerHandler('color', getTargetColorPath)
  }

  /**
   * Override to provide target-specific literal color detection
   */
  isLiteralColor(tokenPath) {
    return isLiteralColor(tokenPath)
  }
}
