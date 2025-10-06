import { describe, expect, it } from 'vitest'
import { convertRadiusToken, convertSpaceToken } from '../transforms-tokens.js'

describe('transforms-tokens', () => {
  describe('convertSpaceToken', () => {
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
      it('passes through unknown string tokens unchanged', () => {
        expect(convertSpaceToken('unknown')).toBe('unknown')
      })

      it('passes through numeric tokens unchanged', () => {
        expect(convertSpaceToken(16)).toBe(16)
      })

      it('passes through empty string unchanged', () => {
        expect(convertSpaceToken('')).toBe('')
      })
    })
  })

  describe('convertRadiusToken', () => {
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
      it('passes through xs unchanged (not in target)', () => {
        expect(convertRadiusToken('xs')).toBe('xs')
      })

      it('passes through 3xl unchanged', () => {
        expect(convertRadiusToken('3xl')).toBe('3xl')
      })

      it('passes through unknown tokens unchanged', () => {
        expect(convertRadiusToken('invalid')).toBe('invalid')
      })

      it('passes through empty string unchanged', () => {
        expect(convertRadiusToken('')).toBe('')
      })
    })
  })
})
