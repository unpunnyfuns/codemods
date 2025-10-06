/**
 * Pure functional object utilities
 *
 * Minimal helpers for functional object manipulation without mutations.
 */

/**
 * Return a new object with specified keys omitted
 *
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to omit
 * @returns {Object} New object without specified keys
 */
export function omit(obj, keys) {
  const copy = { ...obj }
  for (const key of keys) {
    delete copy[key]
  }
  return copy
}

/**
 * Return a new object with only specified keys
 *
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to include
 * @returns {Object} New object with only specified keys
 */
export function pick(obj, keys) {
  const result = {}
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}
