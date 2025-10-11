/**
 * Shared utilities for JSX element transformations
 */

/**
 * Update JSX element name (opening and closing tags)
 */
export function updateElementName(path, targetName) {
  path.node.openingElement.name.name = targetName
  if (path.node.closingElement) {
    path.node.closingElement.name.name = targetName
  }
}

/**
 * Remove props from element attributes array
 */
export function removePropsFromElement(attributes, propsToRemove) {
  propsToRemove.forEach((attr) => {
    const attrIndex = attributes.indexOf(attr)
    if (attrIndex > -1) {
      attributes.splice(attrIndex, 1)
    }
  })
}

/**
 * Add multiple props to element
 */
export function addPropsToElement(attributes, transformedProps, j) {
  Object.entries(transformedProps).forEach(([key, value]) => {
    const propAttr = j.jsxAttribute(j.jsxIdentifier(key), value)
    attributes.push(propAttr)
  })
}

/**
 * Build style prop value combining StyleSheet reference and/or inline styles
 * @param {Object} styleProps - Props to extract to StyleSheet
 * @param {Object} inlineStyles - Props to keep as inline styles
 * @param {string} styleName - Name for the StyleSheet entry
 * @param {Array} elementStyles - Array to push StyleSheet entries to
 * @param {Object} j - jscodeshift API
 * @param {Array} existingStyleReferences - Existing StyleSheet references like styles.foo
 */
export function buildStyleValue(
  styleProps,
  inlineStyles,
  styleName,
  elementStyles,
  j,
  existingStyleReferences = [],
) {
  const styleArray = []

  // Add existing StyleSheet references first
  for (const ref of existingStyleReferences) {
    styleArray.push(ref)
  }

  // If we have StyleSheet styles, reference styles.name
  if (Object.keys(styleProps).length > 0) {
    const newStyleRef = j.memberExpression(j.identifier('styles'), j.identifier(styleName))
    styleArray.push(newStyleRef)
    elementStyles.push({ name: styleName, styles: styleProps })
  }

  // If we have inline styles, create inline object
  if (Object.keys(inlineStyles).length > 0) {
    const inlineProperties = Object.entries(inlineStyles).map(([key, value]) => {
      return j.property('init', j.identifier(key), value)
    })
    const inlineObject = j.objectExpression(inlineProperties)
    styleArray.push(inlineObject)
  }

  if (styleArray.length === 0) {
    return null
  } else if (styleArray.length === 1) {
    return styleArray[0]
  } else {
    return j.arrayExpression(styleArray)
  }
}

/**
 * Add style prop to element if styleValue exists
 */
export function addStyleProp(attributes, styleValue, j) {
  if (styleValue) {
    const styleAttr = j.jsxAttribute(j.jsxIdentifier('style'), j.jsxExpressionContainer(styleValue))
    attributes.push(styleAttr)
  }
}

/**
 * Create a View wrapper around a child element with a style value
 * @param {Object} childElement - JSX element to wrap
 * @param {Object} styleValue - AST node for the style value (MemberExpression, ArrayExpression, ObjectExpression, etc.)
 * @param {Object} j - jscodeshift API
 * @returns {Object} - View element wrapping the child
 */
export function createViewWrapper(childElement, styleValue, j) {
  return j.jsxElement(
    j.jsxOpeningElement(j.jsxIdentifier('View'), [
      j.jsxAttribute(j.jsxIdentifier('style'), j.jsxExpressionContainer(styleValue)),
    ]),
    j.jsxClosingElement(j.jsxIdentifier('View')),
    [j.jsxText('\n  '), childElement, j.jsxText('\n')],
  )
}
