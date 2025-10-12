/**
 * Factory for creating jQuery-style JSX helpers with jscodeshift context curried in
 *
 * Usage:
 * ```javascript
 * function transform(fileInfo, api) {
 *   const j = api.jscodeshift
 *   const $ = createJSXHelper(j)  // ← Curry j once
 *   const root = j(fileInfo.source)
 *
 *   $.findElements(root, 'Button').forEach(path => {
 *     const attrs = $.filterAttributes(path.node.openingElement.attributes, {
 *       allow: ['variant']
 *     })
 *     attrs.push($.createAttribute('type', 'solid'))  // ← No j!
 *     const element = $.createElement('Button', attrs)
 *     $(path).replaceWith(element)
 *   })
 * }
 * ```
 */

import {
  createArrayExpression,
  createMemberExpression as createMemberExpr,
  createNestedObject,
  createObjectExpression,
  createProperty,
  createTemplateLiteral,
  addAttributes,
  addTransformedProps,
  createAttribute,
  createObjectAttribute,
  createStringAttribute,
  extractAttributeValue,
  filterAttributes,
  findAttribute,
  getAttribute,
  getAttributeValue,
  hasAttribute,
  hasProp,
  removeAttributes,
  setAttributes,
  toExpressionContainer,
  addChildren,
  findChild,
  findChildByName,
  getChildrenCount,
  getTextContent,
  insertChildAt,
  removeChildAt,
  removeChildren,
  replaceChildren,
  wrapChildren,
  cloneAsSelfClosing,
  cloneElement,
  cloneOpeningElement,
  cloneWithAddedAttributes,
  cloneWithAttributes,
  cloneWithChildren,
  cloneWithNewName,
  cloneWithTransformedAttributes,
  cloneWithTransformedChildren,
  ensureExpression,
  ensureLiteral,
  expressionToString,
  fromAttributeValue,
  isExpression,
  isLiteral,
  parseNumeric,
  stringToExpression,
  stringToNumeric,
  toAttributeValue,
  toBooleanAttribute,
  toStyleObject,
  createElementWithChildren,
  createMemberElement,
  createMemberExpression,
  createSelfClosingElement,
  findJSXElements,
  findJSXMemberElements,
  getElementName,
  getNonEmptyChildren,
  hasChildren,
  isMemberExpression,
} from '@puns/shiftkit'

/**
 * Create JSX helper with jscodeshift context curried in
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Helper object with all functions curried
 */
export function createJSXHelper(j) {
  return {
    // Query functions (don't need j - pass through)
    hasAttribute,
    hasProp,
    findAttribute,
    getAttribute,
    getAttributeValue,
    extractAttributeValue,
    filterAttributes,
    getElementName,
    hasChildren,
    getNonEmptyChildren,
    isMemberExpression,
    expressionToString,
    fromAttributeValue,
    isLiteral,
    isExpression,
    parseNumeric,
    getTextContent,
    findChild,
    findChildByName,
    getChildrenCount,

    // Attribute builders (curry j)
    createAttribute: (name, value) => createAttribute(name, value, j),
    createStringAttribute: (name, value) => createStringAttribute(name, value, j),
    createObjectAttribute: (name, properties) => createObjectAttribute(name, properties, j),
    addTransformedProps: (attributes, transformedProps) =>
      addTransformedProps(attributes, transformedProps, j),
    toExpressionContainer: (value) => toExpressionContainer(value, j),
    setAttributes,
    addAttributes,
    removeAttributes,

    // Element builders (curry j)
    findElements: (root, name) => findJSXElements(root, name, j),
    findMemberElements: (root, object, property) =>
      findJSXMemberElements(root, object, property, j),
    createElement: (name, attributes) => createSelfClosingElement(name, attributes, j),
    createElementWithChildren: (name, attributes, children) =>
      createElementWithChildren(name, attributes, children, j),
    createMemberExpression: (object, property) => createMemberExpression(object, property, j),
    createMemberElement: (object, property, attributes, children) =>
      createMemberElement(object, property, attributes, children, j),

    // Clone helpers (curry j)
    clone: (element) => cloneElement(element, j),
    cloneWithNewName: (element, newName) => cloneWithNewName(element, newName, j),
    cloneWithAttributes: (element, newAttrs) => cloneWithAttributes(element, newAttrs, j),
    cloneWithAddedAttributes: (element, additionalAttrs) =>
      cloneWithAddedAttributes(element, additionalAttrs, j),
    cloneWithChildren: (element, newChildren) => cloneWithChildren(element, newChildren, j),
    cloneAsSelfClosing: (element) => cloneAsSelfClosing(element, j),
    cloneOpeningElement: (element) => cloneOpeningElement(element, j),
    cloneWithTransformedAttributes: (element, transformer) =>
      cloneWithTransformedAttributes(element, transformer, j),
    cloneWithTransformedChildren: (element, transformer) =>
      cloneWithTransformedChildren(element, transformer, j),

    // Conversion helpers (curry j)
    stringToExpression: (value) => stringToExpression(value, j),
    stringToNumeric: (value) => stringToNumeric(value, j),
    ensureLiteral: (value) => ensureLiteral(value, j),
    ensureExpression: (value) => ensureExpression(value, j),
    toAttributeValue: (value) => toAttributeValue(value, j),
    toBooleanAttribute: (value) => toBooleanAttribute(value, j),
    toStyleObject: (styles) => toStyleObject(styles, j),

    // Children helpers (curry j where needed)
    addChildren,
    replaceChildren,
    removeChildren,
    wrapChildren: (element, wrapperName) => wrapChildren(element, wrapperName, j),
    insertChildAt,
    removeChildAt,

    // AST builders (curry j)
    createObjectExpression: (props) => createObjectExpression(props, j),
    createArrayExpression: (items) => createArrayExpression(items, j),
    createMemberExpr: (path) => createMemberExpr(path, j),
    createNestedObject: (obj) => createNestedObject(obj, j),
    createProperty: (key, value) => createProperty(key, value, j),
    createTemplateLiteral: (parts) => createTemplateLiteral(parts, j),
  }
}
