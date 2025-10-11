/**
 * jQuery-style helpers for JSX children manipulation
 */

/**
 * Add children to an element
 * @param {Object} element - JSX element
 * @param {Array} children - Children to add
 * @param {string} position - 'start' or 'end' (default: 'end')
 */
export function addChildren(element, children, position = 'end') {
  if (!element.children) {
    element.children = []
  }

  if (position === 'start') {
    element.children.unshift(...children)
  } else {
    element.children.push(...children)
  }
}

/**
 * Replace all children of an element
 * @param {Object} element - JSX element
 * @param {Array} newChildren - New children array
 */
export function replaceChildren(element, newChildren) {
  element.children = newChildren
}

/**
 * Remove children that match a predicate
 * @param {Object} element - JSX element
 * @param {Function} predicate - Function that returns true for children to remove
 * @returns {Array} - Removed children
 */
export function removeChildren(element, predicate) {
  if (!element.children) {
    return []
  }

  const removed = []
  element.children = element.children.filter((child) => {
    if (predicate(child)) {
      removed.push(child)
      return false
    }
    return true
  })

  return removed
}

/**
 * Wrap all children in a new element
 * @param {Object} element - JSX element
 * @param {string} wrapperName - Name of wrapper element
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Wrapper element
 */
export function wrapChildren(element, wrapperName, j) {
  const children = element.children || []

  const wrapper = j.jsxElement(
    j.jsxOpeningElement(j.jsxIdentifier(wrapperName), []),
    j.jsxClosingElement(j.jsxIdentifier(wrapperName)),
    children,
  )

  element.children = [wrapper]
  return wrapper
}

/**
 * Extract all text content from element recursively
 * @param {Object} element - JSX element
 * @returns {string|null} - Concatenated text content or null
 */
export function getTextContent(element) {
  if (!element.children || element.children.length === 0) {
    return null
  }

  const texts = []

  function extractText(node) {
    if (node.type === 'JSXText') {
      const text = node.value.trim()
      if (text) {
        texts.push(text)
      }
    } else if (node.children) {
      for (const child of node.children) {
        extractText(child)
      }
    }
  }

  for (const child of element.children) {
    extractText(child)
  }

  return texts.length > 0 ? texts.join(' ') : null
}

/**
 * Get only non-whitespace children
 * @param {Object} element - JSX element
 * @returns {Array} - Non-whitespace children
 */
export function getNonWhitespaceChildren(element) {
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
 * Find first child matching predicate
 * @param {Object} element - JSX element
 * @param {Function} predicate - Function to test each child
 * @returns {Object|null} - First matching child or null
 */
export function findChild(element, predicate) {
  if (!element.children) {
    return null
  }

  return element.children.find(predicate) || null
}

/**
 * Find first child element by name
 * @param {Object} element - JSX element
 * @param {string} name - Element name to find
 * @returns {Object|null} - First matching element or null
 */
export function findChildByName(element, name) {
  return findChild(element, (child) => {
    if (child.type === 'JSXElement') {
      const childName = child.openingElement?.name
      if (childName?.type === 'JSXIdentifier') {
        return childName.name === name
      }
    }
    return false
  })
}

/**
 * Get children count (excluding whitespace)
 * @param {Object} element - JSX element
 * @returns {number} - Number of non-whitespace children
 */
export function getChildrenCount(element) {
  return getNonWhitespaceChildren(element).length
}

/**
 * Check if element has any non-whitespace children
 * @param {Object} element - JSX element
 * @returns {boolean}
 */
export function hasChildren(element) {
  return getChildrenCount(element) > 0
}

/**
 * Insert child at specific index
 * @param {Object} element - JSX element
 * @param {Object} child - Child to insert
 * @param {number} index - Index to insert at
 */
export function insertChildAt(element, child, index) {
  if (!element.children) {
    element.children = []
  }

  element.children.splice(index, 0, child)
}

/**
 * Remove child at specific index
 * @param {Object} element - JSX element
 * @param {number} index - Index to remove
 * @returns {Object|null} - Removed child or null
 */
export function removeChildAt(element, index) {
  if (!element.children || index < 0 || index >= element.children.length) {
    return null
  }

  const removed = element.children.splice(index, 1)
  return removed[0] || null
}
