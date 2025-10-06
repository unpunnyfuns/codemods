/**
 * React Native codemod helpers
 */

import { addNamedImport } from '../imports.js'

/**
 * Check if a value can be extracted to StyleSheet
 */
export function shouldExtractToStyleSheet(value, isTokenHelper = false) {
  if (!value) {
    return false
  }

  if (
    value.type === 'Literal' ||
    value.type === 'StringLiteral' ||
    value.type === 'NumericLiteral' ||
    value.type === 'BooleanLiteral'
  ) {
    return true
  }

  // Token helper member expressions can be extracted
  if (value.type === 'MemberExpression' && isTokenHelper) {
    return true
  }

  return false
}

/**
 * Convert style props object to AST properties for StyleSheet
 */
function buildStyleSheetProperties(styleProps, j) {
  return Object.entries(styleProps).map(([key, value]) => {
    return j.property('init', j.identifier(key), value)
  })
}

/**
 * Check if a variable name is already imported or declared
 */
function isNameInUse(root, name, j) {
  const imports = root.find(j.ImportDeclaration)
  for (const importPath of imports.paths()) {
    const specifiers = importPath.node.specifiers || []
    for (const spec of specifiers) {
      if (spec.local?.name === name) {
        return true
      }
      if (spec.type === 'ImportSpecifier' && spec.imported?.name === name) {
        return true
      }
    }
  }

  const declarations = root.find(j.VariableDeclarator, { id: { name } })
  if (declarations.length > 0) {
    return true
  }

  return false
}

/**
 * Create or extend StyleSheet.create() at the end of the file
 * Returns the variable name used for the StyleSheet
 */
export function addOrExtendStyleSheet(root, elementStyles, j) {
  if (elementStyles.length === 0) {
    return undefined
  }

  const newStyleProperties = elementStyles.map(({ name, styles }) => {
    const properties = buildStyleSheetProperties(styles, j)
    return j.property('init', j.identifier(name), j.objectExpression(properties))
  })

  // Look for existing StyleSheet.create()
  const allStyleSheets = root.find(j.VariableDeclarator, {
    init: {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: { name: 'StyleSheet' },
        property: { name: 'create' },
      },
    },
  })

  if (allStyleSheets.length > 0) {
    const firstStyleSheet = allStyleSheets.at(0)
    const init = firstStyleSheet.get().node.init
    if (init.arguments.length > 0 && init.arguments[0]?.type === 'ObjectExpression') {
      init.arguments[0].properties.push(...newStyleProperties)
    }
    const existingVarName = firstStyleSheet.get().node.id.name
    addNamedImport(root, 'react-native', 'StyleSheet', j)
    return existingVarName
  }

  // Create new StyleSheet.create
  let stylesVarName = 'styles'
  if (isNameInUse(root, 'styles', j)) {
    stylesVarName = 'componentStyles'
  }

  const styleSheetCall = j.variableDeclaration('const', [
    j.variableDeclarator(
      j.identifier(stylesVarName),
      j.callExpression(j.memberExpression(j.identifier('StyleSheet'), j.identifier('create')), [
        j.objectExpression(newStyleProperties),
      ]),
    ),
  ])

  root.find(j.Program).forEach((path) => {
    path.node.body.push(styleSheetCall)
  })

  addNamedImport(root, 'react-native', 'StyleSheet', j)

  return stylesVarName
}
