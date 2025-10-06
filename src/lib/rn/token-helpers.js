/**
 * Utility functions for working with design token helpers
 */

/**
 * Build a nested member expression from a dot-separated path
 * Handles numeric keys with bracket notation
 *
 * @example
 * buildTokenPath(j, 'color', 'background.secondary')
 * // => color.background.secondary
 *
 * buildTokenPath(j, 'color', 'white.900')
 * // => color.white['900']
 */
export function buildTokenPath(j, tokenHelper, tokenPath) {
  const parts = tokenPath.split('.')

  let expression = j.identifier(tokenHelper)

  for (const part of parts) {
    const needsBracketNotation = /^[\d-]/.test(part) || !/^[a-zA-Z_$][\w$]*$/.test(part)

    if (needsBracketNotation) {
      expression = j.memberExpression(expression, j.stringLiteral(part), true)
    } else {
      expression = j.memberExpression(expression, j.identifier(part))
    }
  }

  return expression
}
