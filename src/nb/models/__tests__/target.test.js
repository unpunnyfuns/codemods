import { describe, expect, it } from 'vitest'
import {
  getTokenValue,
  isRestrictedTypographyProp,
  isValidRadiusToken,
  isValidSpaceToken,
} from '../target.js'

describe('target validators', () => {
  describe('isValidSpaceToken', () => {
    it('returns true for valid space tokens', () => {
      expect(isValidSpaceToken('zero')).toBe(true)
      expect(isValidSpaceToken('2xs')).toBe(true)
      expect(isValidSpaceToken('xs')).toBe(true)
      expect(isValidSpaceToken('sm')).toBe(true)
      expect(isValidSpaceToken('md')).toBe(true)
      expect(isValidSpaceToken('lg')).toBe(true)
      expect(isValidSpaceToken('xl')).toBe(true)
      expect(isValidSpaceToken('2xl')).toBe(true)
      expect(isValidSpaceToken('3xl')).toBe(true)
    })

    it('returns false for invalid space tokens', () => {
      expect(isValidSpaceToken('4xl')).toBe(false)
      expect(isValidSpaceToken('xxl')).toBe(false)
      expect(isValidSpaceToken('invalid')).toBe(false)
      expect(isValidSpaceToken('')).toBe(false)
      expect(isValidSpaceToken(null)).toBe(false)
      expect(isValidSpaceToken(undefined)).toBe(false)
    })
  })

  describe('isValidRadiusToken', () => {
    it('returns true for valid radius tokens', () => {
      expect(isValidRadiusToken('sm')).toBe(true)
      expect(isValidRadiusToken('md')).toBe(true)
      expect(isValidRadiusToken('lg')).toBe(true)
      expect(isValidRadiusToken('xl')).toBe(true)
      expect(isValidRadiusToken('2xl')).toBe(true)
    })

    it('returns false for invalid radius tokens', () => {
      expect(isValidRadiusToken('xs')).toBe(false)
      expect(isValidRadiusToken('3xl')).toBe(false)
      expect(isValidRadiusToken('full')).toBe(false)
      expect(isValidRadiusToken('invalid')).toBe(false)
      expect(isValidRadiusToken('')).toBe(false)
      expect(isValidRadiusToken(null)).toBe(false)
      expect(isValidRadiusToken(undefined)).toBe(false)
    })
  })

  describe('isRestrictedTypographyProp', () => {
    it('returns true for managed font properties', () => {
      expect(isRestrictedTypographyProp('fontFamily')).toBe(true)
      expect(isRestrictedTypographyProp('fontSize')).toBe(true)
      expect(isRestrictedTypographyProp('fontWeight')).toBe(true)
      expect(isRestrictedTypographyProp('lineHeight')).toBe(true)
      expect(isRestrictedTypographyProp('letterSpacing')).toBe(true)
      expect(isRestrictedTypographyProp('textTransform')).toBe(true)
    })

    it('returns false for allowed text properties', () => {
      expect(isRestrictedTypographyProp('color')).toBe(false)
      expect(isRestrictedTypographyProp('textAlign')).toBe(false)
      expect(isRestrictedTypographyProp('textDecorationLine')).toBe(false)
      expect(isRestrictedTypographyProp('textDecorationStyle')).toBe(false)
      expect(isRestrictedTypographyProp('textDecorationColor')).toBe(false)
    })

    it('returns false for non-typography properties', () => {
      expect(isRestrictedTypographyProp('margin')).toBe(false)
      expect(isRestrictedTypographyProp('padding')).toBe(false)
      expect(isRestrictedTypographyProp('backgroundColor')).toBe(false)
    })
  })

  describe('getTokenValue', () => {
    describe('space tokens', () => {
      it('returns correct pixel values for space tokens', () => {
        expect(getTokenValue('space', 'zero')).toBe(0)
        expect(getTokenValue('space', '2xs')).toBe(2)
        expect(getTokenValue('space', 'xs')).toBe(4)
        expect(getTokenValue('space', 'sm')).toBe(8)
        expect(getTokenValue('space', 'md')).toBe(12)
        expect(getTokenValue('space', 'lg')).toBe(16)
        expect(getTokenValue('space', 'xl')).toBe(32)
        expect(getTokenValue('space', '2xl')).toBe(64)
        expect(getTokenValue('space', '3xl')).toBe(128)
      })

      it('returns null for invalid space tokens', () => {
        expect(getTokenValue('space', '4xl')).toBe(null)
        expect(getTokenValue('space', 'invalid')).toBe(null)
        expect(getTokenValue('space', '')).toBe(null)
      })
    })

    describe('radius tokens', () => {
      it('returns correct pixel values for radius tokens', () => {
        expect(getTokenValue('radius', 'sm')).toBe(4)
        expect(getTokenValue('radius', 'md')).toBe(8)
        expect(getTokenValue('radius', 'lg')).toBe(12)
        expect(getTokenValue('radius', 'xl')).toBe(24)
        expect(getTokenValue('radius', '2xl')).toBe(32)
      })

      it('returns null for invalid radius tokens', () => {
        expect(getTokenValue('radius', 'xs')).toBe(null)
        expect(getTokenValue('radius', '3xl')).toBe(null)
        expect(getTokenValue('radius', 'invalid')).toBe(null)
        expect(getTokenValue('radius', '')).toBe(null)
      })
    })

    describe('invalid token types', () => {
      it('returns null for unknown token types', () => {
        expect(getTokenValue('color', 'red')).toBe(null)
        expect(getTokenValue('invalid', 'sm')).toBe(null)
        expect(getTokenValue('', 'sm')).toBe(null)
      })
    })
  })
})
