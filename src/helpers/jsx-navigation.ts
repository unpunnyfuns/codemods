/**
 * jQuery-style helpers for AST path navigation
 */

/**
 * Get parent path of an element
 * @param {Object} path - Element path
 * @returns {Object|null} - Parent path or null
 */
export function getParent(path) {
  return path.parent || null
}

/**
 * Find nearest ancestor matching predicate
 * @param {Object} path - Starting path
 * @param {Function} predicate - Function to test each ancestor
 * @returns {Object|null} - First matching ancestor path or null
 */
export function findAncestor(path, predicate) {
  let current = path.parent

  while (current) {
    if (predicate(current)) {
      return current
    }
    current = current.parent
  }

  return null
}

/**
 * Find nearest ancestor JSX element
 * @param {Object} path - Starting path
 * @returns {Object|null} - Nearest JSX element path or null
 */
export function findParentElement(path) {
  return findAncestor(path, (p) => p.node?.type === 'JSXElement')
}

/**
 * Find nearest ancestor JSX element with specific name
 * @param {Object} path - Starting path
 * @param {string} name - Element name to find
 * @returns {Object|null} - Nearest matching element path or null
 */
export function findParentElementByName(path, name) {
  return findAncestor(path, (p) => {
    if (p.node?.type === 'JSXElement') {
      const elementName = p.node.openingElement?.name
      if (elementName?.type === 'JSXIdentifier') {
        return elementName.name === name
      }
    }
    return false
  })
}

/**
 * Get all ancestors up to root
 * @param {Object} path - Starting path
 * @returns {Array} - Array of ancestor paths from closest to root
 */
export function getAncestors(path) {
  const ancestors = []
  let current = path.parent

  while (current) {
    ancestors.push(current)
    current = current.parent
  }

  return ancestors
}

/**
 * Get all ancestor JSX elements
 * @param {Object} path - Starting path
 * @returns {Array} - Array of JSX element paths from closest to root
 */
export function getAncestorElements(path) {
  return getAncestors(path).filter((p) => p.node?.type === 'JSXElement')
}

/**
 * Check if path is a descendant of another path
 * @param {Object} path - Potential descendant path
 * @param {Object} ancestorPath - Potential ancestor path
 * @returns {boolean}
 */
export function isDescendantOf(path, ancestorPath) {
  let current = path.parent

  while (current) {
    if (current === ancestorPath) {
      return true
    }
    current = current.parent
  }

  return false
}

/**
 * Get depth of path (distance from root)
 * @param {Object} path - Path to measure
 * @returns {number} - Depth (0 = root)
 */
export function getDepth(path) {
  let depth = 0
  let current = path.parent

  while (current) {
    depth++
    current = current.parent
  }

  return depth
}

/**
 * Get sibling paths at the same level
 * @param {Object} path - Element path
 * @returns {Array} - Array of sibling paths (excluding self)
 */
export function getSiblings(path) {
  const parent = path.parent

  if (!parent || !parent.node) {
    return []
  }

  // Handle JSX children
  if (parent.node.type === 'JSXElement' && parent.node.children) {
    const siblings = []
    for (let i = 0; i < parent.node.children.length; i++) {
      const child = parent.node.children[i]
      if (child !== path.node) {
        // Create a pseudo-path for sibling
        siblings.push({
          node: child,
          parent: parent,
          index: i,
        })
      }
    }
    return siblings
  }

  return []
}

/**
 * Get previous sibling path
 * @param {Object} path - Element path
 * @returns {Object|null} - Previous sibling path or null
 */
export function getPreviousSibling(path) {
  const parent = path.parent

  if (!parent || !parent.node) {
    return null
  }

  if (parent.node.type === 'JSXElement' && parent.node.children) {
    const index = parent.node.children.indexOf(path.node)
    if (index > 0) {
      return {
        node: parent.node.children[index - 1],
        parent: parent,
        index: index - 1,
      }
    }
  }

  return null
}

/**
 * Get next sibling path
 * @param {Object} path - Element path
 * @returns {Object|null} - Next sibling path or null
 */
export function getNextSibling(path) {
  const parent = path.parent

  if (!parent || !parent.node) {
    return null
  }

  if (parent.node.type === 'JSXElement' && parent.node.children) {
    const index = parent.node.children.indexOf(path.node)
    if (index >= 0 && index < parent.node.children.length - 1) {
      return {
        node: parent.node.children[index + 1],
        parent: parent,
        index: index + 1,
      }
    }
  }

  return null
}

/**
 * Get index of element in parent's children
 * @param {Object} path - Element path
 * @returns {number} - Index or -1 if not found
 */
export function getIndexInParent(path) {
  const parent = path.parent

  if (!parent || !parent.node) {
    return -1
  }

  if (parent.node.type === 'JSXElement' && parent.node.children) {
    return parent.node.children.indexOf(path.node)
  }

  return -1
}

/**
 * Check if element is first child
 * @param {Object} path - Element path
 * @returns {boolean}
 */
export function isFirstChild(path) {
  return getIndexInParent(path) === 0
}

/**
 * Check if element is last child
 * @param {Object} path - Element path
 * @returns {boolean}
 */
export function isLastChild(path) {
  const parent = path.parent

  if (!parent || !parent.node) {
    return false
  }

  if (parent.node.type === 'JSXElement' && parent.node.children) {
    const index = parent.node.children.indexOf(path.node)
    return index === parent.node.children.length - 1
  }

  return false
}

/**
 * Check if element is only child
 * @param {Object} path - Element path
 * @returns {boolean}
 */
export function isOnlyChild(path) {
  const parent = path.parent

  if (!parent || !parent.node) {
    return false
  }

  if (parent.node.type === 'JSXElement' && parent.node.children) {
    return parent.node.children.length === 1
  }

  return false
}

/**
 * Find all descendant elements matching predicate
 * @param {Object} element - Starting element
 * @param {Function} predicate - Function to test each descendant
 * @returns {Array} - Array of matching elements
 */
export function findDescendants(element, predicate) {
  const matches = []

  function traverse(node) {
    if (!node) {
      return
    }

    if (node.type === 'JSXElement') {
      if (predicate(node)) {
        matches.push(node)
      }

      if (node.children) {
        for (const child of node.children) {
          traverse(child)
        }
      }
    }
  }

  traverse(element)
  return matches
}

/**
 * Find all descendant elements with specific name
 * @param {Object} element - Starting element
 * @param {string} name - Element name to find
 * @returns {Array} - Array of matching elements
 */
export function findDescendantsByName(element, name) {
  return findDescendants(element, (node) => {
    const elementName = node.openingElement?.name
    if (elementName?.type === 'JSXIdentifier') {
      return elementName.name === name
    }
    return false
  })
}

/**
 * Get root path
 * @param {Object} path - Starting path
 * @returns {Object} - Root path
 */
export function getRoot(path) {
  let current = path

  while (current.parent) {
    current = current.parent
  }

  return current
}

/**
 * Check if path is at root level
 * @param {Object} path - Path to check
 * @returns {boolean}
 */
export function isRoot(path) {
  return !path.parent
}

/**
 * Find nearest common ancestor of two paths
 * @param {Object} path1 - First path
 * @param {Object} path2 - Second path
 * @returns {Object|null} - Common ancestor or null
 */
export function findCommonAncestor(path1, path2) {
  const ancestors1 = new Set([path1, ...getAncestors(path1)])
  let current = path2

  while (current) {
    if (ancestors1.has(current)) {
      return current
    }
    current = current.parent
  }

  return null
}

/**
 * Walk up tree until condition is met
 * @param {Object} path - Starting path
 * @param {Function} predicate - Function to test each ancestor (return true to stop)
 * @returns {Object|null} - First path where predicate returns true or null
 */
export function walkUp(path, predicate) {
  let current = path

  while (current) {
    if (predicate(current)) {
      return current
    }
    current = current.parent
  }

  return null
}

/**
 * Walk down tree (depth-first) until condition is met
 * @param {Object} element - Starting element
 * @param {Function} predicate - Function to test each node (return true to stop)
 * @returns {Object|null} - First node where predicate returns true or null
 */
export function walkDown(element, predicate) {
  if (predicate(element)) {
    return element
  }

  if (element.children) {
    for (const child of element.children) {
      if (child.type === 'JSXElement') {
        const result = walkDown(child, predicate)
        if (result) {
          return result
        }
      }
    }
  }

  return null
}

/**
 * Get path to element from root (breadcrumb)
 * @param {Object} path - Element path
 * @returns {Array} - Array of element names from root to element
 */
export function getPathNames(path) {
  const names = []
  const ancestors = [path, ...getAncestors(path)].reverse()

  for (const ancestor of ancestors) {
    if (ancestor.node?.type === 'JSXElement') {
      const name = ancestor.node.openingElement?.name
      if (name?.type === 'JSXIdentifier') {
        names.push(name.name)
      } else if (name?.type === 'JSXMemberExpression') {
        names.push(`${name.object?.name}.${name.property?.name}`)
      } else {
        names.push('__unknown__')
      }
    }
  }

  return names
}

/**
 * Check if element has ancestor with specific name
 * @param {Object} path - Element path
 * @param {string} name - Ancestor name to check
 * @returns {boolean}
 */
export function hasAncestor(path, name) {
  return findParentElementByName(path, name) !== null
}

/**
 * Count children matching predicate
 * @param {Object} element - Parent element
 * @param {Function} predicate - Function to test each child
 * @returns {number} - Count of matching children
 */
export function countChildrenWhere(element, predicate) {
  if (!element.children) {
    return 0
  }

  return element.children.filter(predicate).length
}
