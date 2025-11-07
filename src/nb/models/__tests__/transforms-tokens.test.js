import { beforeEach, describe, expect, it, vi } from 'vitest'
import { convertRadiusToken, convertSpaceToken } from '../transforms-tokens.js'

describe('transforms-tokens', () => {
  describe('convertSpaceToken', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    describe('standard semantic tokens', () => {
      it('converts 2xs to 2xs', () => {
        expect(convertSpaceToken('2xs')).toBe('2xs')
      })

      it('converts xs to xs', () => {
        expect(convertSpaceToken('xs')).toBe('xs')
      })

      it('converts sm to sm', () => {
        expect(convertSpaceToken('sm')).toBe('sm')
      })

      it('converts md to md', () => {
        expect(convertSpaceToken('md')).toBe('md')
      })

      it('converts lg to lg', () => {
        expect(convertSpaceToken('lg')).toBe('lg')
      })

      it('converts xl to xl', () => {
        expect(convertSpaceToken('xl')).toBe('xl')
      })

      it('converts 2xl to 2xl', () => {
        expect(convertSpaceToken('2xl')).toBe('2xl')
      })

      it('converts 3xl to 3xl', () => {
        expect(convertSpaceToken('3xl')).toBe('3xl')
      })
    })

    describe('unknown tokens', () => {
      it('passes through unknown string tokens with warning', () => {
        expect(convertSpaceToken('unknown')).toBe('unknown')
        expect(console.warn).toHaveBeenCalledWith(
          '⚠️  Unknown NativeBase space token: "unknown" - passing through unchanged',
        )
      })

      it('passes through numeric tokens without warning', () => {
        expect(convertSpaceToken(16)).toBe(16)
        expect(console.warn).not.toHaveBeenCalled()
      })

      it('passes through empty string with warning', () => {
        expect(convertSpaceToken('')).toBe('')
        expect(console.warn).toHaveBeenCalledWith(
          '⚠️  Unknown NativeBase space token: "" - passing through unchanged',
        )
      })
    })
  })

  describe('convertRadiusToken', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    describe('standard radius tokens', () => {
      it('converts sm to sm', () => {
        expect(convertRadiusToken('sm')).toBe('sm')
      })

      it('converts md to md', () => {
        expect(convertRadiusToken('md')).toBe('md')
      })

      it('converts lg to lg', () => {
        expect(convertRadiusToken('lg')).toBe('lg')
      })

      it('converts xl to xl', () => {
        expect(convertRadiusToken('xl')).toBe('xl')
      })

      it('converts full to 2xl (pill shapes)', () => {
        expect(convertRadiusToken('full')).toBe('2xl')
      })
    })

    describe('unknown tokens', () => {
      it('passes through xs with warning (not in Nordlys)', () => {
        expect(convertRadiusToken('xs')).toBe('xs')
        expect(console.warn).toHaveBeenCalledWith(
          '⚠️  Unknown NativeBase radius token: "xs" - passing through unchanged',
        )
      })

      it('passes through 3xl with warning', () => {
        expect(convertRadiusToken('3xl')).toBe('3xl')
        expect(console.warn).toHaveBeenCalledWith(
          '⚠️  Unknown NativeBase radius token: "3xl" - passing through unchanged',
        )
      })

      it('passes through unknown tokens with warning', () => {
        expect(convertRadiusToken('invalid')).toBe('invalid')
        expect(console.warn).toHaveBeenCalledWith(
          '⚠️  Unknown NativeBase radius token: "invalid" - passing through unchanged',
        )
      })

      it('passes through empty string with warning', () => {
        expect(convertRadiusToken('')).toBe('')
        expect(console.warn).toHaveBeenCalledWith(
          '⚠️  Unknown NativeBase radius token: "" - passing through unchanged',
        )
      })
    })
  })
})
