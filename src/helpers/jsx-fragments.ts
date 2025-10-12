/**
 * jQuery-style helpers for JSX fragments
 */

/**
 * Create a JSX fragment
 * @param {Array} children - Fragment children
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSX fragment
 */
export function createFragment(children, j) {
  return j.jsxFragment(j.jsxOpeningFragment(), j.jsxClosingFragment(), children)
}

/**
 * Create a React.Fragment with optional key
 * @param {Array} children - Fragment children
 * @param {string} key - Optional key attribute
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSX element for React.Fragment
 */
export function createReactFragment(children, key, j) {
  const attributes = key ? [j.jsxAttribute(j.jsxIdentifier('key'), j.stringLiteral(key))] : []

  const opening = j.jsxOpeningElement(
    j.jsxMemberExpression(j.jsxIdentifier('React'), j.jsxIdentifier('Fragment')),
    attributes,
  )

  const closing = j.jsxClosingElement(
    j.jsxMemberExpression(j.jsxIdentifier('React'), j.jsxIdentifier('Fragment')),
  )

  return j.jsxElement(opening, closing, children)
}

/**
 * Check if element is a JSX fragment
 * @param {Object} element - Element to check
 * @returns {boolean}
 */
export function isFragment(element) {
  if (!element || element.type !== 'JSXFragment') {
    return false
  }
  return true
}

/**
 * Check if element is React.Fragment
 * @param {Object} element - Element to check
 * @returns {boolean}
 */
export function isReactFragment(element) {
  if (!element || element.type !== 'JSXElement') {
    return false
  }

  const name = element.openingElement?.name
  if (name?.type === 'JSXMemberExpression') {
    return name.object?.name === 'React' && name.property?.name === 'Fragment'
  }

  if (name?.type === 'JSXIdentifier') {
    return name.name === 'Fragment'
  }

  return false
}

/**
 * Check if element is any kind of fragment
 * @param {Object} element - Element to check
 * @returns {boolean}
 */
export function isAnyFragment(element) {
  return isFragment(element) || isReactFragment(element)
}

/**
 * Unwrap fragment, returning its children
 * @param {Object} element - Fragment element
 * @returns {Array} - Fragment children
 */
export function unwrapFragment(element) {
  if (!element) {
    return []
  }

  if (element.type === 'JSXFragment') {
    return element.children || []
  }

  if (element.type === 'JSXElement' && isReactFragment(element)) {
    return element.children || []
  }

  return [element]
}

/**
 * Wrap children in a fragment
 * @param {Array} children - Children to wrap
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSX fragment
 */
export function wrapInFragment(children, j) {
  return createFragment(children, j)
}

/**
 * Convert React.Fragment to short syntax <>
 * @param {Object} element - React.Fragment element
 * @param {Object} j - jscodeshift API
 * @returns {Object} - JSX fragment or original if has key
 */
export function convertToShortFragment(element, j) {
  if (!isReactFragment(element)) {
    return element
  }

  // Can't use short syntax if fragment has attributes (like key)
  const attrs = element.openingElement?.attributes || []
  if (attrs.length > 0) {
    return element
  }

  return createFragment(element.children || [], j)
}

/**
 * Convert short fragment to React.Fragment
 * @param {Object} element - JSX fragment
 * @param {Object} j - jscodeshift API
 * @returns {Object} - React.Fragment element
 */
export function convertToReactFragment(element, j) {
  if (!isFragment(element)) {
    return element
  }

  return createReactFragment(element.children || [], null, j)
}

/**
 * Flatten nested fragments recursively
 * @param {Array} children - Children to flatten
 * @returns {Array} - Flattened children
 */
export function flattenFragments(children) {
  if (!children || children.length === 0) {
    return []
  }

  const flattened = []

  for (const child of children) {
    if (isAnyFragment(child)) {
      const fragmentChildren = child.children || []
      flattened.push(...flattenFragments(fragmentChildren))
    } else {
      flattened.push(child)
    }
  }

  return flattened
}

/**
 * Replace element with its children (removes wrapper)
 * @param {Object} path - Element path
 * @param {Object} j - jscodeshift API
 * @returns {Array} - Unwrapped children
 */
export function unwrapElement(path, j) {
  const element = path.node
  const children = element.children || []

  if (children.length === 0) {
    j(path).remove()
    return []
  }

  if (children.length === 1) {
    j(path).replaceWith(children[0])
    return children
  }

  // Multiple children need a fragment
  const fragment = createFragment(children, j)
  j(path).replaceWith(fragment)
  return children
}

/**
 * Remove empty fragments
 * @param {Array} children - Children to filter
 * @returns {Array} - Children with empty fragments removed
 */
export function removeEmptyFragments(children) {
  return children.filter((child) => {
    if (isAnyFragment(child)) {
      const fragmentChildren = child.children || []
      return fragmentChildren.length > 0
    }
    return true
  })
}

/**
 * Merge adjacent fragments
 * @param {Array} children - Children to merge
 * @param {Object} j - jscodeshift API
 * @returns {Array} - Children with merged fragments
 */
export function mergeAdjacentFragments(children, j) {
  if (!children || children.length <= 1) {
    return children
  }

  const merged = []
  let pendingFragmentChildren = []

  for (const child of children) {
    if (isAnyFragment(child)) {
      pendingFragmentChildren.push(...(child.children || []))
    } else {
      if (pendingFragmentChildren.length > 0) {
        merged.push(createFragment(pendingFragmentChildren, j))
        pendingFragmentChildren = []
      }
      merged.push(child)
    }
  }

  // Handle remaining fragment children
  if (pendingFragmentChildren.length > 0) {
    merged.push(createFragment(pendingFragmentChildren, j))
  }

  return merged
}

/**
 * Extract key from React.Fragment if present
 * @param {Object} element - React.Fragment element
 * @returns {string|null} - Key value or null
 */
export function getFragmentKey(element) {
  if (!isReactFragment(element)) {
    return null
  }

  const attrs = element.openingElement?.attributes || []
  const keyAttr = attrs.find((attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'key')

  if (!keyAttr || !keyAttr.value) {
    return null
  }

  if (keyAttr.value.type === 'StringLiteral' || keyAttr.value.type === 'Literal') {
    return keyAttr.value.value
  }

  return null
}

/**
 * Replace element with fragment if it has multiple children
 * @param {Object} element - Element to potentially convert
 * @param {Object} j - jscodeshift API
 * @returns {Object} - Fragment or original element
 */
export function convertToFragmentIfNeeded(element, j) {
  const children = element.children || []

  if (children.length <= 1) {
    return element
  }

  return createFragment(children, j)
}

/**
 * Get non-fragment children count
 * @param {Array} children - Children to count
 * @returns {number} - Count of non-fragment children (fragments are unwrapped)
 */
export function countNonFragmentChildren(children) {
  if (!children || children.length === 0) {
    return 0
  }

  let count = 0

  for (const child of children) {
    if (isAnyFragment(child)) {
      count += countNonFragmentChildren(child.children || [])
    } else if (child.type !== 'JSXText' || child.value.trim() !== '') {
      count++
    }
  }

  return count
}
