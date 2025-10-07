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
export function buildNestedMemberExpression(j, tokenHelper, path) {
  const parts = path.split('.')

  // Start with the token helper identifier
  let expression = j.identifier(tokenHelper)

  // Build nested member expressions for each part
  for (const part of parts) {
    // Check if part requires bracket notation (starts with digit, dash, or contains special chars)
    const needsBracketNotation = /^[\d-]/.test(part) || !/^[a-zA-Z_$][\w$]*$/.test(part)

    if (needsBracketNotation) {
      // Use computed member expression: obj['-1'] or obj['900']
      expression = j.memberExpression(expression, j.stringLiteral(part), true)
    } else {
      // Use dot notation: obj.prop
      expression = j.memberExpression(expression, j.identifier(part))
    }
  }

  return expression
}
