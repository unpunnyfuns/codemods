/**
 * JSX transformation utilities
 */

/* ===========================================================================
   Attributes
   =========================================================================== */

export function findAttribute(attributes, name) {
  return (
    attributes.find(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === name,
    ) || null
  )
}

export function hasAttribute(attributes, name) {
  return findAttribute(attributes, name) !== null
}

export function getAttributeValue(attributes, name) {
  const attr = findAttribute(attributes, name)
  if (!attr?.value) {
    return null
  }
  if (attr.value.type === 'JSXExpressionContainer') {
    return attr.value.expression
  }
  return attr.value
}

export function filterAttributes(attributes, { allow = null, deny = [] }) {
  return attributes.filter((attr) => {
    if (attr.type !== 'JSXAttribute' || !attr.name) {
      return false
    }
    const propName = attr.name.name
    if (allow !== null && !allow.includes(propName)) {
      return false
    }
    if (deny.includes(propName)) {
      return false
    }
    return true
  })
}

export function createAttribute(name, value, j) {
  if (typeof value === 'string') {
    return j.jsxAttribute(j.jsxIdentifier(name), j.stringLiteral(value))
  }
  if (!value) {
    return j.jsxAttribute(j.jsxIdentifier(name), null)
  }
  if (value.type === 'JSXExpressionContainer') {
    return j.jsxAttribute(j.jsxIdentifier(name), value)
  }
  return j.jsxAttribute(j.jsxIdentifier(name), j.jsxExpressionContainer(value))
}

export function createStringAttribute(name, value, j) {
  return j.jsxAttribute(j.jsxIdentifier(name), j.stringLiteral(value))
}

export function addTransformedProps(attributes, transformedProps, j) {
  for (const [name, value] of Object.entries(transformedProps)) {
    attributes.push(j.jsxAttribute(j.jsxIdentifier(name), value))
  }
}

/* ===========================================================================
   Elements
   =========================================================================== */

export function findJSXElements(root, name, j) {
  return root.find(j.JSXElement, {
    openingElement: {
      name: { type: 'JSXIdentifier', name },
    },
  })
}

export function createSelfClosingElement(name, attributes, j) {
  return j.jsxElement(j.jsxOpeningElement(j.jsxIdentifier(name), attributes, true))
}

export function createMemberElement(object, property, attributes, children, j) {
  const memberExpr = j.jsxMemberExpression(j.jsxIdentifier(object), j.jsxIdentifier(property))
  return j.jsxElement(
    j.jsxOpeningElement(memberExpr, attributes),
    j.jsxClosingElement(memberExpr),
    children,
  )
}

/* ===========================================================================
   Clone
   =========================================================================== */

export function cloneElement(element, j) {
  return j.jsxElement(
    element.openingElement,
    element.closingElement,
    element.children,
    element.openingElement.selfClosing,
  )
}

/* ===========================================================================
   Transforms
   =========================================================================== */

export function buildStyleValue(
  styleProps,
  inlineStyles,
  styleName,
  elementStyles,
  j,
  existingStyleReferences = [],
) {
  const styleArray = []

  for (const ref of existingStyleReferences) {
    styleArray.push(ref)
  }

  if (Object.keys(styleProps).length > 0) {
    const newStyleRef = j.memberExpression(j.identifier('styles'), j.identifier(styleName))
    styleArray.push(newStyleRef)
    elementStyles.push({ name: styleName, styles: styleProps })
  }

  if (Object.keys(inlineStyles).length > 0) {
    const inlineProperties = Object.entries(inlineStyles).map(([key, value]) => {
      return j.property('init', j.identifier(key), value)
    })
    const inlineObject = j.objectExpression(inlineProperties)
    styleArray.push(inlineObject)
  }

  if (styleArray.length === 0) {
    return null
  }
  if (styleArray.length === 1) {
    return styleArray[0]
  }
  return j.arrayExpression(styleArray)
}

export function createViewWrapper(childElement, styleValue, j) {
  return j.jsxElement(
    j.jsxOpeningElement(j.jsxIdentifier('View'), [
      j.jsxAttribute(j.jsxIdentifier('style'), j.jsxExpressionContainer(styleValue)),
    ]),
    j.jsxClosingElement(j.jsxIdentifier('View')),
    [j.jsxText('\n  '), childElement, j.jsxText('\n')],
  )
}

/* ===========================================================================
   Extraction
   =========================================================================== */

export function extractPropFromJSXElement(element, expectedElementName, propName) {
  if (!element || element.type !== 'JSXElement') {
    return null
  }

  const openingElement = element.openingElement
  if (
    !openingElement?.name ||
    openingElement.name.type !== 'JSXIdentifier' ||
    openingElement.name.name !== expectedElementName
  ) {
    return null
  }

  const attr = (openingElement.attributes || []).find(
    (attr) => attr.type === 'JSXAttribute' && attr.name?.name === propName,
  )

  if (!attr || attr.type !== 'JSXAttribute' || !attr.value) {
    return null
  }

  if (attr.value.type === 'Literal' || attr.value.type === 'StringLiteral') {
    return attr.value.value
  }
  if (attr.value.type === 'JSXExpressionContainer') {
    return attr.value.expression
  }

  return null
}

export function extractSimpleChild(children, j, options = {}) {
  const {
    allowedExpressionTypes = ['Identifier', 'CallExpression', 'MemberExpression', 'StringLiteral'],
  } = options

  const significantChildren = children.filter((child) => {
    if (child.type === 'JSXText') {
      return child.value.trim().length > 0
    }
    return true
  })

  if (significantChildren.length === 0) {
    return { value: null, isComplex: false }
  }

  if (significantChildren.length > 1) {
    return { value: null, isComplex: true }
  }

  const child = significantChildren[0]
  if (!child) {
    return { value: null, isComplex: false }
  }

  if (child.type === 'JSXText') {
    return { value: j.stringLiteral(child.value.trim()), isComplex: false }
  }

  if (child.type === 'JSXExpressionContainer') {
    const expr = child.expression
    if (allowedExpressionTypes.includes(expr.type)) {
      return { value: expr, isComplex: false }
    }
    return { value: null, isComplex: true }
  }

  if (child.type === 'JSXElement') {
    return { value: null, isComplex: true }
  }

  return { value: null, isComplex: false }
}

/* ===========================================================================
   Expressions
   =========================================================================== */

export function transformStringsInExpression(expression, transformFn, j) {
  if (!expression) {
    return expression
  }

  if (expression.type === 'StringLiteral' || expression.type === 'Literal') {
    if (typeof expression.value === 'string') {
      const transformed = transformFn(expression.value)
      return transformed || expression
    }
    return expression
  }

  if (expression.type === 'ConditionalExpression') {
    const transformedConsequent = transformStringsInExpression(
      expression.consequent,
      transformFn,
      j,
    )
    const transformedAlternate = transformStringsInExpression(expression.alternate, transformFn, j)

    if (
      transformedConsequent !== expression.consequent ||
      transformedAlternate !== expression.alternate
    ) {
      return j.conditionalExpression(expression.test, transformedConsequent, transformedAlternate)
    }
    return expression
  }

  if (expression.type === 'LogicalExpression') {
    const transformedLeft = transformStringsInExpression(expression.left, transformFn, j)
    const transformedRight = transformStringsInExpression(expression.right, transformFn, j)

    if (transformedLeft !== expression.left || transformedRight !== expression.right) {
      return j.logicalExpression(expression.operator, transformedLeft, transformedRight)
    }
    return expression
  }

  return expression
}
