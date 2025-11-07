/**
 * Vitest setup - suppress console output during tests
 */

import { afterAll, beforeAll, vi } from 'vitest'

// Store original console methods
const originalWarn = console.warn
const originalLog = console.log

beforeAll(() => {
  // Mock console.warn to suppress warnings during tests
  console.warn = vi.fn()
  // Mock console.log to suppress log output during tests
  console.log = vi.fn()
})

afterAll(() => {
  // Restore original console methods
  console.warn = originalWarn
  console.log = originalLog
})
