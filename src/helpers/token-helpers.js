/**
 * Utility functions for working with design token helpers
 */

/**
 * Build a nested member expression from a dot-separated path
 * Handles numeric keys with bracket notation
 *
 * Examples:
 *   buildNestedMemberExpression(j, 'color', 'background.secondary')
 *   => color.background.secondary
 *
 *   buildNestedMemberExpression(j, 'color', 'white.900')
 *   => color.white['900']
 *
 *   buildNestedMemberExpression(j, 'space', 'md')
 *   => space.md
 */
export function buildNestedMemberExpression(j, tokenHelper, tokenPath) {
  const parts = tokenPath.split('.')

  let expression = j.identifier(tokenHelper)

  for (const part of parts) {
    const needsBracketNotation = /^[\d-]/.test(part) || !/^[a-zA-Z_$][\w$]*$/.test(part)

    if (needsBracketNotation) {
      // obj['-1'] or obj['900']
      expression = j.memberExpression(expression, j.stringLiteral(part), true)
    } else {
      // obj.prop
      expression = j.memberExpression(expression, j.identifier(part))
    }
  }

  return expression
}
