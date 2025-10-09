// Migrate NativeBase HStack/VStack → Stack with direction
// See stack.md for documentation

import { addNamedImport, hasNamedImport, removeNamedImport } from '../helpers/imports.js'
import {
  addPropsToElement,
  addStyleProp,
  buildStyleValue,
  removePropsFromElement,
  updateElementName,
} from '../helpers/jsx-transforms.js'
import { alignValues, justifyValues } from './mappings/maps-values.js'
import { directProps } from './mappings/props-direct.js'
import { dropProps } from './mappings/props-drop.js'
import {
  border,
  color,
  extra,
  flexbox,
  layout,
  position,
  sizing,
  spacing,
  text,
} from './mappings/props-style.js'
import {
  addElementComment,
  addOrExtendStyleSheet,
  categorizeProps,
  validSpaceTokens,
  validateTokenValue,
} from './props.js'

// Stack prop mappings
const styleProps = {
  ...spacing,
  ...sizing,
  ...color,
  ...border,
  ...layout,
  ...flexbox,
  ...position,
  ...text,
  ...extra,

  // Stack-specific props with value mapping
  // align="start" → alignItems: 'flex-start' (extracted to StyleSheet)
  align: {
    styleName: 'alignItems',
    valueMap: alignValues,
  },
  // justify="between" → justifyContent: 'space-between' (extracted to StyleSheet)
  justify: {
    styleName: 'justifyContent',
    valueMap: justifyValues,
  },
}

// Remove space from STYLE_PROPS since it should stay on element as gap
delete styleProps.space

// space={2} → gap={space[2]} (stays on element, not extracted)
const transformProps = {
  space: 'gap',
}

const directPropsList = directProps

const dropPropsList = [...dropProps, 'divider', 'reversed', '_text', '_stack']

const STACK_COMPONENTS = [
  { name: 'HStack', direction: 'horizontal' },
  { name: 'VStack', direction: 'vertical' },
]

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const sourceImport = options.sourceImport ?? 'native-base'
  const targetImport = options.targetImport ?? '@hb-frontend/app/src/components/nordlys/Stack'
  const targetName = options.targetName ?? 'Stack'
  const tokenImport = options.tokenImport ?? '@hb-frontend/nordlys'

  // Find imports
  const imports = root.find(j.ImportDeclaration, { source: { value: sourceImport } })
  if (!imports.length) {
    return fileInfo.source
  }

  let transformed = false
  const elementStyles = []
  const usedTokenHelpers = new Set()

  const stackProps = {
    styleProps,
    transformProps,
    directProps: directPropsList,
    dropProps: dropPropsList,
  }

  // Process each stack component type
  for (const { name: componentName, direction } of STACK_COMPONENTS) {
    if (!hasNamedImport(imports, componentName)) {
      continue
    }

    const stackElements = root.find(j.JSXElement, {
      openingElement: { name: { name: componentName } },
    })
    if (stackElements.length === 0) {
      continue
    }

    // Transform each element
    stackElements.forEach((path, index) => {
      const attributes = path.node.openingElement.attributes || []

      // Categorize props
      const {
        styleProps,
        inlineStyles,
        transformedProps,
        propsToRemove,
        usedTokenHelpers: newHelpers,
        droppedProps,
        invalidStyles,
        existingStyleReferences,
      } = categorizeProps(attributes, stackProps, j)

      for (const h of newHelpers) {
        usedTokenHelpers.add(h)
      }

      // Validate gap prop (must be a valid space token name)
      if (transformedProps.gap) {
        const gapValue = transformedProps.gap
        const validation = validateTokenValue(gapValue, validSpaceTokens, false)

        if (!validation.isValid) {
          const gapAttr = j.jsxAttribute(j.jsxIdentifier('gap'), gapValue)
          droppedProps.push({ name: 'gap', attr: gapAttr })
          delete transformedProps.gap
        }
      }

      // Transform element
      removePropsFromElement(attributes, propsToRemove)
      updateElementName(path, targetName)

      // Add direction prop
      const directionProp = j.jsxAttribute(j.jsxIdentifier('direction'), j.stringLiteral(direction))
      attributes.push(directionProp)

      addPropsToElement(attributes, transformedProps, j)

      const styleValue = buildStyleValue(
        styleProps,
        inlineStyles,
        `${componentName.toLowerCase()}${index}`,
        elementStyles,
        j,
        existingStyleReferences,
      )
      addStyleProp(attributes, styleValue, j)

      // Add comment for dropped props and invalid styles
      addElementComment(path, droppedProps, invalidStyles, j)
    })

    removeNamedImport(imports, componentName, j)
    transformed = true
  }

  if (!transformed) {
    return fileInfo.source
  }

  // Update imports
  addNamedImport(root, targetImport, targetName, j)
  for (const h of usedTokenHelpers) {
    addNamedImport(root, tokenImport, h, j)
  }

  // Add StyleSheet
  addOrExtendStyleSheet(root, elementStyles, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
