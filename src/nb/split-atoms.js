// Split barrel imports into individual atom imports
// See split-atoms.md for documentation

import { insertImports, matchesImportPath } from '../helpers/imports.js'

const IMPORT_PATH = '@hb-frontend/common/src/components'
const ATOM_PREFIX = '@hb-frontend/common/src/components/atoms/'

// Hardcoded map of atom components and their associated types
// Maintained manually - see split-atoms.md for full list
const ATOMS = new Map([
  ['Actionsheet', ['ActionsheetContentProps', 'ActionsheetItemProps', 'ActionsheetProps']],
  ['Alert', ['AlertProps']],
  ['Avatar', ['AvatarProps']],
  ['Badge', ['BadgeProps', 'BadgeTypeProp']],
  ['Box', ['BoxProps']],
  ['Button', ['ButtonProps']],
  ['Checkbox', ['CheckboxGroupProps', 'CheckboxProps']],
  ['Chip', ['ChipProps']],
  ['CircleFlag', ['CircleFlagName', 'CircleFlagProps']],
  ['FilterChip', ['FilterChipProps']],
  ['Icon', ['IconProps']],
  ['Input', ['InputProps']],
  ['Loader', []],
  ['Pressable', ['PressableProps']],
  ['Radio', ['RadioGroupProps', 'RadioProps']],
  ['ScrollView', ['ScrollViewProps']],
  ['SectionList', ['SectionListProps']],
  ['Slider', ['SliderProps']],
  ['Switch', ['SwitchProps']],
  ['Typography', ['TypographyProps', 'TypographySize', 'TypographyType']],
])

// Resolve component name from import name
// If it's a component, return itself. If it's a type, return its component.
function getComponent(importName) {
  // Direct component match
  if (ATOMS.has(importName)) {
    return importName
  }
  // Type match - find which component this type belongs to
  for (const [componentName, associatedTypes] of ATOMS) {
    if (associatedTypes.includes(importName)) {
      return componentName
    }
  }
  // Nothing to see here
  return null
}

// Let's split us some atoms
function processImports(imports, j) {
  const atoms = new Map()

  // Get rid of pesky side-effect imports (import './something')
  const importsWithSpecifiers = imports.filter((path) => path.node.specifiers?.length > 0).paths()

  for (const path of importsWithSpecifiers) {
    const { node } = path
    const atomSpecifiers = []
    const otherSpecifiers = []

    // Populate the two lists
    for (const spec of node.specifiers) {
      // Non-named imports are of no interest here
      if (spec.type !== 'ImportSpecifier') {
        otherSpecifiers.push(spec)
        continue
      }

      // Please be an atom.. or else
      const component = getComponent(spec.imported.name)
      if (component) {
        atomSpecifiers.push({ spec, component })
      } else {
        otherSpecifiers.push(spec)
      }
    }

    // Keep track of components vs types; ComponentName:boolean
    for (const { spec, component } of atomSpecifiers) {
      const importPath = `${ATOM_PREFIX}${component}`
      const isType = node.importKind === 'type' || spec.importKind === 'type'

      // Create a unique key for the group
      const groupKey = `${importPath}:${isType}`

      if (!atoms.has(groupKey)) {
        atoms.set(groupKey, {
          path: importPath,
          isType,
          specifiers: [],
        })
      }

      atoms.get(groupKey).specifiers.push(spec)
    }

    // Update or remove the original import
    if (otherSpecifiers.length > 0) {
      j(path).replaceWith(j.importDeclaration(otherSpecifiers, node.source))
    } else {
      j(path).remove()
    }
  }

  return atoms
}

function createAtomImports(atoms, j) {
  // The following code looks like a war crime, and probably is...
  return Array.from(atoms.values()).map(({ path, isType, specifiers }) => {
    const declaration = j.importDeclaration(specifiers, j.literal(path))
    if (isType) {
      declaration.importKind = 'type'
    }
    return declaration
  })
}

function main(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Find the imports we care about
  const imports = root.find(j.ImportDeclaration, {
    source: {
      value: matchesImportPath(IMPORT_PATH),
    },
  })

  // Bail early, this file has been found not guilty of being a pain in the...
  if (!imports.length) {
    return fileInfo.source
  }

  // But we found something, so we need to process the damn thing..
  const atoms = processImports(imports, j)

  // Finally, we can insert all teh tings back to the source file!!1
  const newImports = createAtomImports(atoms, j)
  insertImports(root, newImports, j)

  // Dump to disk
  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
  // Run lint:fix afterwards to solve import orders and whatnot
}

export default main
