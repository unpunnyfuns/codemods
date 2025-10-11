/**
 * jQuery-style helpers for cloning JSX elements
 */

/**
 * Deep clone a JSX element
 * @param {Object} element - JSX element to clone
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Cloned element
 */
export function cloneElement(element, j) {
  return j.jsxElement(
    element.openingElement,
    element.closingElement,
    element.children,
    element.selfClosing,
  )
}

/**
 * Clone element with a new name
 * @param {Object} element - JSX element to clone
 * @param {string} newName - New element name
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Cloned element with new name
 */
export function cloneWithNewName(element, newName, j) {
  const newOpening = j.jsxOpeningElement(
    j.jsxIdentifier(newName),
    element.openingElement.attributes,
    element.selfClosing,
  )

  const newClosing = element.closingElement ? j.jsxClosingElement(j.jsxIdentifier(newName)) : null

  return j.jsxElement(newOpening, newClosing, element.children, element.selfClosing)
}

/**
 * Clone element with new attributes
 * @param {Object} element - JSX element to clone
 * @param {Array} newAttrs - New attributes array
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Cloned element with new attributes
 */
export function cloneWithAttributes(element, newAttrs, j) {
  const elementName = element.openingElement.name

  const newOpening = j.jsxOpeningElement(elementName, newAttrs, element.selfClosing)

  const newClosing = element.closingElement ? j.jsxClosingElement(elementName) : null

  return j.jsxElement(newOpening, newClosing, element.children, element.selfClosing)
}

/**
 * Clone element with additional attributes merged in
 * @param {Object} element - JSX element to clone
 * @param {Array} additionalAttrs - Attributes to add
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Cloned element with merged attributes
 */
export function cloneWithAddedAttributes(element, additionalAttrs, j) {
  const existingAttrs = element.openingElement.attributes || []
  const mergedAttrs = [...existingAttrs, ...additionalAttrs]

  return cloneWithAttributes(element, mergedAttrs, j)
}

/**
 * Clone element with new children
 * @param {Object} element - JSX element to clone
 * @param {Array} newChildren - New children array
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Cloned element with new children
 */
export function cloneWithChildren(element, newChildren, j) {
  return j.jsxElement(
    element.openingElement,
    element.closingElement,
    newChildren,
    element.selfClosing,
  )
}

/**
 * Clone element as self-closing
 * @param {Object} element - JSX element to clone
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Self-closing cloned element
 */
export function cloneAsSelfClosing(element, j) {
  const elementName = element.openingElement.name
  const attrs = element.openingElement.attributes

  return j.jsxElement(j.jsxOpeningElement(elementName, attrs, true), null, [], true)
}

/**
 * Clone opening element only
 * @param {Object} element - JSX element
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Cloned opening element
 */
export function cloneOpeningElement(element, j) {
  return j.jsxOpeningElement(
    element.openingElement.name,
    element.openingElement.attributes,
    element.openingElement.selfClosing,
  )
}

/**
 * Clone element with transformed attributes
 * @param {Object} element - JSX element to clone
 * @param {Function} transformer - Function to transform attributes (attrs) => newAttrs
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Cloned element with transformed attributes
 */
export function cloneWithTransformedAttributes(element, transformer, j) {
  const existingAttrs = element.openingElement.attributes || []
  const newAttrs = transformer(existingAttrs)

  return cloneWithAttributes(element, newAttrs, j)
}

/**
 * Clone element with transformed children
 * @param {Object} element - JSX element to clone
 * @param {Function} transformer - Function to transform children (children) => newChildren
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Cloned element with transformed children
 */
export function cloneWithTransformedChildren(element, transformer, j) {
  const existingChildren = element.children || []
  const newChildren = transformer(existingChildren)

  return cloneWithChildren(element, newChildren, j)
}
