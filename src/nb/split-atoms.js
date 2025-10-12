// Split barrel imports into individual atom imports
// See split-atoms.md for documentation

import { insertImports, matchesImportPath } from '@puns/shiftkit'

const IMPORT_PATH = '@hb-frontend/common/src/components'
const ATOM_PREFIX = '@hb-frontend/common/src/components/atoms/'

// Atom components and their associated types
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
// Components return themselves, types return their component
function getComponent(importName) {
  if (ATOMS.has(importName)) {
    return importName
  }
  for (const [componentName, associatedTypes] of ATOMS) {
    if (associatedTypes.includes(importName)) {
      return componentName
    }
  }
  return null
}

function processImports(imports, j) {
  const atoms = new Map()

  // Skip side-effect imports (import './something')
  const importsWithSpecifiers = imports.filter((path) => path.node.specifiers?.length > 0).paths()

  for (const path of importsWithSpecifiers) {
    const { node } = path
    const atomSpecifiers = []
    const otherSpecifiers = []

    for (const spec of node.specifiers) {
      if (spec.type !== 'ImportSpecifier') {
        otherSpecifiers.push(spec)
        continue
      }

      const component = getComponent(spec.imported.name)
      if (component) {
        atomSpecifiers.push({ spec, component })
      } else {
        otherSpecifiers.push(spec)
      }
    }

    // Group atoms by path and type (type vs value imports)
    for (const { spec, component } of atomSpecifiers) {
      const importPath = `${ATOM_PREFIX}${component}`
      const isType = node.importKind === 'type' || spec.importKind === 'type'
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

    if (otherSpecifiers.length > 0) {
      j(path).replaceWith(j.importDeclaration(otherSpecifiers, node.source))
    } else {
      j(path).remove()
    }
  }

  return atoms
}

function createAtomImports(atoms, j) {
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

  // import { ... } from '@hb-frontend/common/src/components'
  const imports = root.find(j.ImportDeclaration, {
    source: {
      value: matchesImportPath(IMPORT_PATH),
    },
  })

  if (!imports.length) {
    return fileInfo.source
  }

  const atoms = processImports(imports, j)
  const newImports = createAtomImports(atoms, j)
  insertImports(root, newImports, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
