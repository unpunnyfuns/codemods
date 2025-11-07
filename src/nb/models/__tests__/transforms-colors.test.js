import { describe, expect, it } from 'vitest'
import { getNordlysColorPath, isLiteralColor } from '../transforms-colors.js'

describe('transforms-colors', () => {
  describe('getNordlysColorPath', () => {
    describe('white and black mappings', () => {
      it('maps white.900 to white.HW1', () => {
        expect(getNordlysColorPath('white.900')).toBe('white.HW1')
      })

      it('maps white.0 to white.HW1', () => {
        expect(getNordlysColorPath('white.0')).toBe('white.HW1')
      })

      it('maps black.900 to core.neutral.HN1', () => {
        expect(getNordlysColorPath('black.900')).toBe('core.neutral.HN1')
      })
    })

    describe('gray scale mappings', () => {
      it('maps gray to core.neutral.HN5', () => {
        expect(getNordlysColorPath('gray')).toBe('core.neutral.HN5')
      })

      it('maps gray.0 to core.neutral.HN10 (lightest)', () => {
        expect(getNordlysColorPath('gray.0')).toBe('core.neutral.HN10')
      })

      it('maps gray.100 through gray.900 to HN9 through HN1', () => {
        expect(getNordlysColorPath('gray.100')).toBe('core.neutral.HN9')
        expect(getNordlysColorPath('gray.200')).toBe('core.neutral.HN8')
        expect(getNordlysColorPath('gray.300')).toBe('core.neutral.HN7')
        expect(getNordlysColorPath('gray.400')).toBe('core.neutral.HN6')
        expect(getNordlysColorPath('gray.500')).toBe('core.neutral.HN5')
        expect(getNordlysColorPath('gray.600')).toBe('core.neutral.HN4')
        expect(getNordlysColorPath('gray.700')).toBe('core.neutral.HN3')
        expect(getNordlysColorPath('gray.800')).toBe('core.neutral.HN2')
        expect(getNordlysColorPath('gray.900')).toBe('core.neutral.HN1')
      })
    })

    describe('blue scale mappings', () => {
      it('maps blue.0 to core.blue.HB10', () => {
        expect(getNordlysColorPath('blue.0')).toBe('core.blue.HB10')
      })

      it('maps blue.100 to core.blue.HB9', () => {
        expect(getNordlysColorPath('blue.100')).toBe('core.blue.HB9')
      })

      it('maps blue.500 to core.blue.HB5', () => {
        expect(getNordlysColorPath('blue.500')).toBe('core.blue.HB5')
      })
    })

    describe('pink scale mappings', () => {
      it('maps pink.200 to core.neutral.HN9 (no pink in Nordlys)', () => {
        expect(getNordlysColorPath('pink.200')).toBe('core.neutral.HN9')
      })

      it('maps pink.400 to core.neutral.HN8', () => {
        expect(getNordlysColorPath('pink.400')).toBe('core.neutral.HN8')
      })
    })

    describe('account color mappings', () => {
      it('maps account to brand.primary', () => {
        expect(getNordlysColorPath('account')).toBe('brand.primary')
      })

      it('maps account.solid.default to brand.primary', () => {
        expect(getNordlysColorPath('account.solid.default')).toBe('brand.primary')
      })
    })

    describe('background semantic mappings', () => {
      it('maps background.info to feedback.info.subtle', () => {
        expect(getNordlysColorPath('background.info')).toBe('feedback.info.subtle')
      })

      it('maps background.error to feedback.error.subtle', () => {
        expect(getNordlysColorPath('background.error')).toBe('feedback.error.subtle')
      })
    })

    describe('input color mappings', () => {
      it('maps input.backgroundDefault to background.secondary', () => {
        expect(getNordlysColorPath('input.backgroundDefault')).toBe('background.secondary')
      })

      it('maps input.backgroundFocus to background.secondary', () => {
        expect(getNordlysColorPath('input.backgroundFocus')).toBe('background.secondary')
      })

      it('maps input.backgroundDisabled to background.tertiary', () => {
        expect(getNordlysColorPath('input.backgroundDisabled')).toBe('background.tertiary')
      })
    })

    describe('avatar color mappings', () => {
      it('maps avatar.default to background.primary', () => {
        expect(getNordlysColorPath('avatar.default')).toBe('background.primary')
      })

      it('maps avatar.info to feedback.info.subtle', () => {
        expect(getNordlysColorPath('avatar.info')).toBe('feedback.info.subtle')
      })

      it('maps avatar.success to feedback.success.subtle', () => {
        expect(getNordlysColorPath('avatar.success')).toBe('feedback.success.subtle')
      })
    })

    describe('direct color paths (no remapping)', () => {
      it('passes through background.primary unchanged', () => {
        expect(getNordlysColorPath('background.primary')).toBe('background.primary')
      })

      it('passes through background.primary-alternate unchanged', () => {
        expect(getNordlysColorPath('background.primary-alternate')).toBe(
          'background.primary-alternate',
        )
      })

      it('passes through background.secondary unchanged', () => {
        expect(getNordlysColorPath('background.secondary')).toBe('background.secondary')
      })

      it('passes through background.tertiary unchanged', () => {
        expect(getNordlysColorPath('background.tertiary')).toBe('background.tertiary')
      })

      it('passes through background.screen unchanged', () => {
        expect(getNordlysColorPath('background.screen')).toBe('background.screen')
      })
    })

    describe('unmapped colors', () => {
      it('passes through unknown color paths unchanged', () => {
        expect(getNordlysColorPath('text.primary')).toBe('text.primary')
        expect(getNordlysColorPath('brand.primary')).toBe('brand.primary')
        expect(getNordlysColorPath('feedback.error.strong')).toBe('feedback.error.strong')
        expect(getNordlysColorPath('custom.color')).toBe('custom.color')
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
