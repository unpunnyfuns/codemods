/**
 * Split barrel imports into individual atom imports for tree-shaking
 *
 * import { Avatar, Button } from '@your/common/components'
 * becomes
 * import { Avatar } from '@your/common/components/atoms/Avatar'
 * import { Button } from '@your/common/components/atoms/Button'
 *
 * Associated types grouped with component (AvatarProps with Avatar)
 * Type imports preserved (import type { ... })
 * Non-atom imports kept in original barrel
 */

import { insertImports, matchesImportPath } from '../lib/imports.js'

/* ===========================================================================
   Configuration
   =========================================================================== */

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

/* ===========================================================================
   Helpers
   =========================================================================== */

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

// Extract atom specifiers from barrel imports, group by path:isType
function processImports(imports, atomPrefix, j) {
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
      const importPath = `${atomPrefix}${component}`
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

/* ===========================================================================
   Transform
   =========================================================================== */

function createAtomImports(atoms, j) {
  return Array.from(atoms.values()).map(({ path, isType, specifiers }) => {
    const declaration = j.importDeclaration(specifiers, j.literal(path))
    if (isType) {
      declaration.importKind = 'type'
    }
    return declaration
  })
}

/* ===========================================================================
   Pipeline
   =========================================================================== */

function main(fileInfo, api, options = {}) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const barrelImport = options.barrelImport
  const atomPrefix = options.atomPrefix

  if (!barrelImport) {
    throw new Error('--barrelImport is required (e.g., --barrelImport="@your/common/components")')
  }
  if (!atomPrefix) {
    throw new Error(
      '--atomPrefix is required (e.g., --atomPrefix="@your/common/components/atoms/")',
    )
  }

  const imports = root.find(j.ImportDeclaration, {
    source: {
      value: matchesImportPath(barrelImport),
    },
  })

  if (!imports.length) {
    return fileInfo.source
  }

  const atoms = processImports(imports, atomPrefix, j)
  const newImports = createAtomImports(atoms, j)
  insertImports(root, newImports, j)

  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
}

export default main
