/**
 * jQuery-style helpers for batch JSX operations
 */

import { createAttribute } from './jsx-attributes.js'
import { updateElementName } from './jsx-transforms.js'

/**
 * Transform multiple elements with the same function
 * @param {Array} paths - Collection of element paths
 * @param {Function} transformer - Function to transform each element
 * @returns {Array} - Transformation results
 */
export function transformAll(paths, transformer) {
  return paths.map((path) => transformer(path))
}

/**
 * Rename multiple elements to the same name
 * @param {Array} paths - Collection of element paths
 * @param {string} newName - New element name
 * @param {Object} j - jscodeshift API
 * @returns {number} - Number of elements renamed
 */
export function renameAll(paths, newName, j) {
  let count = 0

  for (const path of paths) {
    updateElementName(path, newName, j)
    count++
  }

  return count
}

/**
 * Add attribute to all elements in collection
 * @param {Array} paths - Collection of element paths
 * @param {string} attrName - Attribute name
 * @param {*} attrValue - Attribute value
 * @param {Object} j - jscodeshift API
 * @returns {number} - Number of elements modified
 */
export function addAttributeToAll(paths, attrName, attrValue, j) {
  let count = 0

  for (const path of paths) {
    const attributes = path.node.openingElement.attributes || []
    attributes.push(createAttribute(attrName, attrValue, j))
    count++
  }

  return count
}

/**
 * Remove attribute from all elements in collection
 * @param {Array} paths - Collection of element paths
 * @param {string} attrName - Attribute name to remove
 * @returns {number} - Number of attributes removed
 */
export function removeAttributeFromAll(paths, attrName) {
  let count = 0

  for (const path of paths) {
    const attributes = path.node.openingElement.attributes || []
    const index = attributes.findIndex(
      (attr) => attr.type === 'JSXAttribute' && attr.name && attr.name.name === attrName,
    )

    if (index !== -1) {
      attributes.splice(index, 1)
      count++
    }
  }

  return count
}

/**
 * Replace all elements in collection
 * @param {Array} paths - Collection of element paths
 * @param {Function} replacer - Function to generate replacement (path) => newElement
 * @param {Object} j - jscodeshift API
 * @returns {number} - Number of elements replaced
 */
export function replaceAll(paths, replacer, j) {
  let count = 0

  for (const path of paths) {
    const replacement = replacer(path)
    if (replacement) {
      j(path).replaceWith(replacement)
      count++
    }
  }

  return count
}

/**
 * Remove all elements in collection
 * @param {Array} paths - Collection of element paths
 * @param {Object} j - jscodeshift API
 * @returns {number} - Number of elements removed
 */
export function removeAll(paths, j) {
  let count = 0

  for (const path of paths) {
    j(path).remove()
    count++
  }

  return count
}

/**
 * Wrap all elements in collection with same wrapper
 * @param {Array} paths - Collection of element paths
 * @param {string} wrapperName - Wrapper element name
 * @param {Array} wrapperAttrs - Wrapper attributes
 * @param {Object} j - jscodeshift API
 * @returns {number} - Number of elements wrapped
 */
export function wrapAll(paths, wrapperName, wrapperAttrs, j) {
  let count = 0

  for (const path of paths) {
    const element = path.node

    const opening = j.jsxOpeningElement(j.jsxIdentifier(wrapperName), wrapperAttrs)
    const closing = j.jsxClosingElement(j.jsxIdentifier(wrapperName))
    const wrapper = j.jsxElement(opening, closing, [element])

    j(path).replaceWith(wrapper)
    count++
  }

  return count
}

/**
 * Collect elements by attribute value
 * @param {Array} paths - Collection of element paths
 * @param {string} attrName - Attribute name to group by
 * @returns {Map} - Map of attribute value to elements
 */
export function groupByAttribute(paths, attrName) {
  const groups = new Map()

  for (const path of paths) {
    const attributes = path.node.openingElement.attributes || []
    const attr = attributes.find(
      (a) => a.type === 'JSXAttribute' && a.name && a.name.name === attrName,
    )

    let key = '__no_attribute__'
    if (attr?.value) {
      if (attr.value.type === 'StringLiteral' || attr.value.type === 'Literal') {
        key = String(attr.value.value)
      } else {
        key = '__expression__'
      }
    }

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(path)
  }

  return groups
}

/**
 * Collect elements by element name
 * @param {Array} paths - Collection of element paths
 * @returns {Map} - Map of element name to elements
 */
export function groupByName(paths) {
  const groups = new Map()

  for (const path of paths) {
    const name = path.node.openingElement?.name
    let key = '__unknown__'

    if (name?.type === 'JSXIdentifier') {
      key = name.name
    } else if (name?.type === 'JSXMemberExpression') {
      key = `${name.object?.name}.${name.property?.name}`
    }

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(path)
  }

  return groups
}

/**
 * Filter collection by predicate
 * @param {Array} paths - Collection of element paths
 * @param {Function} predicate - Function to test each path
 * @returns {Array} - Filtered paths
 */
export function filterPaths(paths, predicate) {
  return paths.filter(predicate)
}

/**
 * Find first element matching predicate
 * @param {Array} paths - Collection of element paths
 * @param {Function} predicate - Function to test each path
 * @returns {Object|null} - First matching path or null
 */
export function findPath(paths, predicate) {
  return paths.find(predicate) || null
}

/**
 * Count elements matching predicate
 * @param {Array} paths - Collection of element paths
 * @param {Function} predicate - Function to test each path
 * @returns {number} - Count of matching elements
 */
export function countWhere(paths, predicate) {
  return paths.filter(predicate).length
}

/**
 * Check if any element matches predicate
 * @param {Array} paths - Collection of element paths
 * @param {Function} predicate - Function to test each path
 * @returns {boolean}
 */
export function anyMatch(paths, predicate) {
  return paths.some(predicate)
}

/**
 * Check if all elements match predicate
 * @param {Array} paths - Collection of element paths
 * @param {Function} predicate - Function to test each path
 * @returns {boolean}
 */
export function allMatch(paths, predicate) {
  return paths.every(predicate)
}

/**
 * Collect statistics about elements in collection
 * @param {Array} paths - Collection of element paths
 * @returns {Object} - Statistics object
 */
export function collectStats(paths) {
  const stats = {
    total: paths.length,
    byName: new Map(),
    withChildren: 0,
    selfClosing: 0,
    avgAttributes: 0,
  }

  let totalAttributes = 0

  for (const path of paths) {
    const element = path.node
    const name = element.openingElement?.name

    let nameKey = '__unknown__'
    if (name?.type === 'JSXIdentifier') {
      nameKey = name.name
    } else if (name?.type === 'JSXMemberExpression') {
      nameKey = `${name.object?.name}.${name.property?.name}`
    }

    stats.byName.set(nameKey, (stats.byName.get(nameKey) || 0) + 1)

    if (element.children && element.children.length > 0) {
      stats.withChildren++
    }

    if (element.selfClosing) {
      stats.selfClosing++
    }

    const attributes = element.openingElement?.attributes || []
    totalAttributes += attributes.length
  }

  stats.avgAttributes = paths.length > 0 ? totalAttributes / paths.length : 0

  return stats
}

/**
 * Apply different transformers based on element name
 * @param {Array} paths - Collection of element paths
 * @param {Object} transformers - Map of element name to transformer function
 * @returns {number} - Number of elements transformed
 */
export function transformByName(paths, transformers) {
  let count = 0

  for (const path of paths) {
    const name = path.node.openingElement?.name

    let nameKey = null
    if (name?.type === 'JSXIdentifier') {
      nameKey = name.name
    } else if (name?.type === 'JSXMemberExpression') {
      nameKey = `${name.object?.name}.${name.property?.name}`
    }

    if (nameKey && transformers[nameKey]) {
      transformers[nameKey](path)
      count++
    }
  }

  return count
}

/**
 * Clone all elements in collection
 * @param {Array} elements - Collection of elements (not paths)
 * @param {Object} j - jscodeshift API
 * @returns {Array} - Cloned elements
 */
export function cloneAll(elements, j) {
  return elements.map((element) => {
    return j.jsxElement(
      element.openingElement,
      element.closingElement,
      element.children,
      element.selfClosing,
    )
  })
}

/**
 * Extract attribute values from all elements
 * @param {Array} paths - Collection of element paths
 * @param {string} attrName - Attribute name to extract
 * @returns {Array} - Array of attribute values
 */
export function extractAttributeValues(paths, attrName) {
  const values = []

  for (const path of paths) {
    const attributes = path.node.openingElement.attributes || []
    const attr = attributes.find(
      (a) => a.type === 'JSXAttribute' && a.name && a.name.name === attrName,
    )

    if (attr?.value) {
      if (attr.value.type === 'StringLiteral' || attr.value.type === 'Literal') {
        values.push(attr.value.value)
      } else if (attr.value.type === 'JSXExpressionContainer') {
        values.push(attr.value.expression)
      } else {
        values.push(attr.value)
      }
    }
  }

  return values
}

/**
 * Update attribute value for all elements where it exists
 * @param {Array} paths - Collection of element paths
 * @param {string} attrName - Attribute name to update
 * @param {Function} updater - Function (oldValue) => newValue
 * @returns {number} - Number of attributes updated
 */
export function updateAttributeWhere(paths, attrName, updater) {
  let count = 0

  for (const path of paths) {
    const attributes = path.node.openingElement.attributes || []
    const attr = attributes.find(
      (a) => a.type === 'JSXAttribute' && a.name && a.name.name === attrName,
    )

    if (attr?.value) {
      const newValue = updater(attr.value)
      if (newValue !== attr.value) {
        attr.value = newValue
        count++
      }
    }
  }

  return count
}
