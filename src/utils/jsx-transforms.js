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
export function addPropsToElement(attributes, propEntries, j) {
  Object.entries(propEntries).forEach(([key, value]) => {
    const propAttr = j.jsxAttribute(j.jsxIdentifier(key), value)
    attributes.push(propAttr)
  })
}

/**
 * Build style prop value combining StyleSheet reference and/or inline styles
 */
export function buildStyleValue(styleProps, inlineStyles, styleName, elementStyles, j) {
  let styleValue = null

  // If we have StyleSheet styles, reference styles.name
  if (Object.keys(styleProps).length > 0) {
    styleValue = j.memberExpression(j.identifier('styles'), j.identifier(styleName))
    elementStyles.push({ name: styleName, styles: styleProps })
  }

  // If we have inline styles, create inline object
  if (Object.keys(inlineStyles).length > 0) {
    const inlineProperties = Object.entries(inlineStyles).map(([key, value]) => {
      return j.property('init', j.identifier(key), value)
    })
    const inlineObject = j.objectExpression(inlineProperties)

    // If we also have StyleSheet styles, combine them in an array
    if (styleValue) {
      styleValue = j.arrayExpression([styleValue, inlineObject])
    } else {
      styleValue = inlineObject
    }
  }

  return styleValue
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
