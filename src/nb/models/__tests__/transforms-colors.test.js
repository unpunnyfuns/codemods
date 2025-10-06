import { describe, expect, it } from 'vitest'
import { getTargetColorPath, isLiteralColor } from '../transforms-colors.js'

describe('transforms-colors', () => {
  describe('getTargetColorPath', () => {
    describe('white and black mappings', () => {
      it('maps white.900 to white.HW1', () => {
        expect(getTargetColorPath('white.900')).toBe('white.HW1')
      })

      it('maps white.0 to white.HW1', () => {
        expect(getTargetColorPath('white.0')).toBe('white.HW1')
      })

      it('maps black.900 to core.neutral.HN1', () => {
        expect(getTargetColorPath('black.900')).toBe('core.neutral.HN1')
      })
    })

    describe('gray scale mappings', () => {
      it('maps gray to core.neutral.HN5', () => {
        expect(getTargetColorPath('gray')).toBe('core.neutral.HN5')
      })

      it('maps gray.0 to core.neutral.HN10 (lightest)', () => {
        expect(getTargetColorPath('gray.0')).toBe('core.neutral.HN10')
      })

      it('maps gray.100 through gray.900 to HN9 through HN1', () => {
        expect(getTargetColorPath('gray.100')).toBe('core.neutral.HN9')
        expect(getTargetColorPath('gray.200')).toBe('core.neutral.HN8')
        expect(getTargetColorPath('gray.300')).toBe('core.neutral.HN7')
        expect(getTargetColorPath('gray.400')).toBe('core.neutral.HN6')
        expect(getTargetColorPath('gray.500')).toBe('core.neutral.HN5')
        expect(getTargetColorPath('gray.600')).toBe('core.neutral.HN4')
        expect(getTargetColorPath('gray.700')).toBe('core.neutral.HN3')
        expect(getTargetColorPath('gray.800')).toBe('core.neutral.HN2')
        expect(getTargetColorPath('gray.900')).toBe('core.neutral.HN1')
      })
    })

    describe('blue scale mappings', () => {
      it('maps blue.0 to core.blue.HB10', () => {
        expect(getTargetColorPath('blue.0')).toBe('core.blue.HB10')
      })

      it('maps blue.100 to core.blue.HB9', () => {
        expect(getTargetColorPath('blue.100')).toBe('core.blue.HB9')
      })

      it('maps blue.500 to core.blue.HB5', () => {
        expect(getTargetColorPath('blue.500')).toBe('core.blue.HB5')
      })
    })

    describe('pink scale mappings', () => {
      it('maps pink.200 to core.neutral.HN9 (no pink in target)', () => {
        expect(getTargetColorPath('pink.200')).toBe('core.neutral.HN9')
      })

      it('maps pink.400 to core.neutral.HN8', () => {
        expect(getTargetColorPath('pink.400')).toBe('core.neutral.HN8')
      })
    })

    describe('account color mappings', () => {
      it('maps account to brand.primary', () => {
        expect(getTargetColorPath('account')).toBe('brand.primary')
      })

      it('maps account.solid.default to brand.primary', () => {
        expect(getTargetColorPath('account.solid.default')).toBe('brand.primary')
      })
    })

    describe('background semantic mappings', () => {
      it('maps background.info to feedback.info.subtle', () => {
        expect(getTargetColorPath('background.info')).toBe('feedback.info.subtle')
      })

      it('maps background.error to feedback.error.subtle', () => {
        expect(getTargetColorPath('background.error')).toBe('feedback.error.subtle')
      })
    })

    describe('input color mappings', () => {
      it('maps input.backgroundDefault to background.secondary', () => {
        expect(getTargetColorPath('input.backgroundDefault')).toBe('background.secondary')
      })

      it('maps input.backgroundFocus to background.secondary', () => {
        expect(getTargetColorPath('input.backgroundFocus')).toBe('background.secondary')
      })

      it('maps input.backgroundDisabled to background.tertiary', () => {
        expect(getTargetColorPath('input.backgroundDisabled')).toBe('background.tertiary')
      })
    })

    describe('avatar color mappings', () => {
      it('maps avatar.default to background.primary', () => {
        expect(getTargetColorPath('avatar.default')).toBe('background.primary')
      })

      it('maps avatar.info to feedback.info.subtle', () => {
        expect(getTargetColorPath('avatar.info')).toBe('feedback.info.subtle')
      })

      it('maps avatar.success to feedback.success.subtle', () => {
        expect(getTargetColorPath('avatar.success')).toBe('feedback.success.subtle')
      })
    })

    describe('direct color paths (no remapping)', () => {
      it('passes through background.primary unchanged', () => {
        expect(getTargetColorPath('background.primary')).toBe('background.primary')
      })

      it('passes through background.primary-alternate unchanged', () => {
        expect(getTargetColorPath('background.primary-alternate')).toBe(
          'background.primary-alternate',
        )
      })

      it('passes through background.secondary unchanged', () => {
        expect(getTargetColorPath('background.secondary')).toBe('background.secondary')
      })

      it('passes through background.tertiary unchanged', () => {
        expect(getTargetColorPath('background.tertiary')).toBe('background.tertiary')
      })

      it('passes through background.screen unchanged', () => {
        expect(getTargetColorPath('background.screen')).toBe('background.screen')
      })
    })

    describe('text color mappings', () => {
      it('maps text.brand to brand.primary (NB-only path)', () => {
        expect(getTargetColorPath('text.brand')).toBe('brand.primary')
      })

      // text.primary/secondary/tertiary/quaternary exist in target - pass through unchanged
      it('passes through text.primary (exists in target)', () => {
        expect(getTargetColorPath('text.primary')).toBe('text.primary')
      })

      it('passes through text.secondary (exists in target)', () => {
        expect(getTargetColorPath('text.secondary')).toBe('text.secondary')
      })

      it('passes through text.tertiary (exists in target)', () => {
        expect(getTargetColorPath('text.tertiary')).toBe('text.tertiary')
      })

      it('passes through text.quaternary (exists in target)', () => {
        expect(getTargetColorPath('text.quaternary')).toBe('text.quaternary')
      })

      it('passes through text.quaternary-alternate (exists in target)', () => {
        expect(getTargetColorPath('text.quaternary-alternate')).toBe('text.quaternary-alternate')
      })
    })

    describe('unmapped colors', () => {
      it('passes through unknown color paths unchanged', () => {
        expect(getTargetColorPath('brand.primary')).toBe('brand.primary')
        expect(getTargetColorPath('feedback.error.strong')).toBe('feedback.error.strong')
        expect(getTargetColorPath('custom.color')).toBe('custom.color')
      })
    })
  })

  describe('isLiteralColor', () => {
    it('returns true for transparent', () => {
      expect(isLiteralColor('transparent')).toBe(true)
    })

    it('returns false for non-literal colors', () => {
      expect(isLiteralColor('red')).toBe(false)
      expect(isLiteralColor('blue.500')).toBe(false)
      expect(isLiteralColor('background.primary')).toBe(false)
      expect(isLiteralColor('#FF0000')).toBe(false)
      expect(isLiteralColor('')).toBe(false)
    })
  })
})
