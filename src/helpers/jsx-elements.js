/**
 * jQuery-style helpers for JSX element manipulation
 */

/**
 * Find JSX elements by name (supports both JSXIdentifier and JSXMemberExpression)
 * @param {Object} root - jscodeshift root
 * @param {string} name - Element name to find
 * @param {Object} j - jscodeshift API
 * @returns {Collection} - Collection of JSX elements
 */
export function findJSXElements(root, name, j) {
  return root.find(j.JSXElement, {
    openingElement: {
      name: {
        type: 'JSXIdentifier',
        name: name,
      },
    },
  })
}

/**
 * Find JSX member expression elements (e.g., Alert.Title)
 * @param {Object} root - jscodeshift root
 * @param {string} object - Object name (e.g., 'Alert')
 * @param {string} property - Property name (e.g., 'Title')
 * @param {Object} j - jscodeshift API
 * @returns {Collection} - Collection of JSX elements
 */
export function findJSXMemberElements(root, object, property, j) {
  return root.find(j.JSXElement, {
    openingElement: {
      name: {
        type: 'JSXMemberExpression',
        object: { name: object },
        property: { name: property },
      },
    },
  })
}

/**
 * Check if element name is a member expression (e.g., Alert.Title)
 * @param {Object} elementName - Element name node
 * @param {string} object - Expected object name
 * @param {string} property - Expected property name
 * @returns {boolean}
 */
export function isMemberExpression(elementName, object, property) {
  if (!elementName) {
    return false
  }

  return (
    elementName.type === 'JSXMemberExpression' &&
    elementName.object?.name === object &&
    elementName.property?.name === property
  )
}

/**
 * Create member expression identifier (e.g., Alert.Title)
 * @param {string} object - Object name
 * @param {string} property - Property name
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSXMemberExpression node
 */
export function createMemberExpression(object, property, j) {
  return j.jsxMemberExpression(j.jsxIdentifier(object), j.jsxIdentifier(property))
}

/**
 * Create self-closing JSX element
 * @param {string} name - Element name
 * @param {Array} attributes - Element attributes
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSXElement node
 */
export function createSelfClosingElement(name, attributes, j) {
  return j.jsxElement(j.jsxOpeningElement(j.jsxIdentifier(name), attributes, true), null, [], true)
}

/**
 * Create JSX element with children
 * @param {string} name - Element name
 * @param {Array} attributes - Element attributes
 * @param {Array} children - Element children
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSXElement node
 */
export function createElementWithChildren(name, attributes, children, j) {
  return j.jsxElement(
    j.jsxOpeningElement(j.jsxIdentifier(name), attributes),
    j.jsxClosingElement(j.jsxIdentifier(name)),
    children,
  )
}

/**
 * Get element name as string (handles both JSXIdentifier and JSXMemberExpression)
 * @param {Object} element - JSX element
 * @returns {string} - Element name (e.g., 'Button' or 'Alert.Title')
 */
export function getElementName(element) {
  const nameNode = element.openingElement?.name || element.name

  if (!nameNode) {
    return null
  }

  if (nameNode.type === 'JSXIdentifier') {
    return nameNode.name
  }

  if (nameNode.type === 'JSXMemberExpression') {
    return `${nameNode.object?.name}.${nameNode.property?.name}`
  }

  return null
}

/**
 * Check if element has children
 * @param {Object} element - JSX element
 * @returns {boolean}
 */
export function hasChildren(element) {
  return element.children && element.children.length > 0
}

/**
 * Get non-empty children (filters out whitespace text nodes)
 * @param {Object} element - JSX element
 * @returns {Array} - Non-empty children
 */
export function getNonEmptyChildren(element) {
  if (!element.children) {
    return []
  }

  return element.children.filter((child) => {
    if (child.type === 'JSXText') {
      return child.value.trim() !== ''
    }
    return true
  })
}

/**
 * Create JSX member element (e.g., <Switch.Label>children</Switch.Label>)
 * @param {string} object - Object name (e.g., 'Switch')
 * @param {string} property - Property name (e.g., 'Label')
 * @param {Array} attributes - Element attributes
 * @param {Array} children - Element children
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSXElement node
 */
export function createMemberElement(object, property, attributes, children, j) {
  const memberExpr = createMemberExpression(object, property, j)

  return j.jsxElement(
    j.jsxOpeningElement(memberExpr, attributes),
    j.jsxClosingElement(memberExpr),
    children,
  )
}
