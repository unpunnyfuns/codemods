/**
 * Make sure atom components are imported from their individual paths
 *
 * import { Box, Button as Btn, type ButtonProps } from '@org/common/src/components'
 * //=>
 * import { Box } from '@org/common/src/components/atoms/Box'
 * import { Button as Btn } from '@org/common/src/components/atoms/Button'
 *
 * A quick breakdown AST import nodes:
 *
 * node.specifiers = [
 *   { type: 'ImportSpecifier', imported: { name: 'Box' }, local: { name: 'Box' }},
 *   { type: 'ImportSpecifier', imported: { name: 'Button' }, local: { name: 'Btn' }}
 *   { type: 'ImportSpecifier',
 *     imported: { name: 'ButtonProps' },
 *     local: { name: 'ButtonProps' },
 *     importKind: 'type'
 *   }
 * ]
 *
 * node.source = '@org/common/src/components'
 */

// Path constants
const IMPORT_PATH = '@org/common/src/components'
const ATOM_PREFIX = '@org/common/src/components/atoms/'

// Atom components and types we care about, organically hand-picked and curated
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

// Resolve component name from import name in ATOMS
function getComponent(importName) {
  if (ATOMS.has(importName)) {
    return importName
  }
  // Check if it's one of our known types
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

  imports
    // Get rid of pesky side-effect imports (import './something')
    .filter((path) => path.node.specifiers?.length > 0)
    .forEach((path) => {
      const { node } = path
      const atomSpecifiers = []
      const otherSpecifiers = []

      // Populate the two lists
      node.specifiers.forEach((spec) => {
        // Non-named imports are of no interest here
        if (spec.type !== 'ImportSpecifier') {
          otherSpecifiers.push(spec)
          return
        }

        // Please be an atom.. or else
        const component = getComponent(spec.imported.name)
        if (component) {
          atomSpecifiers.push({ spec, component })
        } else {
          otherSpecifiers.push(spec)
        }
      })

      // Keep track of components vs types; ComponentName:boolean
      atomSpecifiers.forEach(({ spec, component }) => {
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
      })

      // Update or remove the original import
      if (otherSpecifiers.length > 0) {
        j(path).replaceWith(j.importDeclaration(otherSpecifiers, node.source))
      } else {
        j(path).remove()
      }
    })

  return atoms
}

function insertImports(root, atoms, j) {
  if (atoms.size === 0) {
    return
  }
  // The following code looks like a war crime, and probably is...
  const newImports = Array.from(atoms.values()).map(({ path, isType, specifiers }) => {
    const declaration = j.importDeclaration(specifiers, j.literal(path))
    if (isType) {
      declaration.importKind = 'type'
    }
    return declaration
  })
  // Insert after the last existing import, or at the top if none exist
  const lastImport = root.find(j.ImportDeclaration).at(-1)
  if (lastImport.length) {
    lastImport.insertAfter(newImports)
  } else {
    root.get().node.program.body.unshift(...newImports)
  }
}

function main(fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  // Find the imports we care about
  const imports = root.find(j.ImportDeclaration, {
    source: {
      value: (value) => value === IMPORT_PATH || value === `${IMPORT_PATH}/`,
    },
  })

  // Bail early, this file has been found not guilty of being a pain in the...
  if (!imports.length) {
    return fileInfo.source
  }

  // But we found something, so we need to process the damn thing..
  const atoms = processImports(imports, j)

  // Finally, we can insert all teh tings back to the source file!!1
  insertImports(root, atoms, j)

  // Dump to disk
  return root.toSource({
    quote: 'single',
    tabWidth: 2,
    useTabs: false,
  })
  // Run lint:fix afterwards to solve import orders and whatnot
}

export default main
