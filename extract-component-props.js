#!/usr/bin/env node
/**
 * Extract component props information for migration mapping
 * Usage: node extract-component-props.js <file-path> [component-name]
 *
 * Extracts:
 * - All prop names and their types
 * - Required vs optional props
 * - Enum/union literal values
 * - Extended interfaces/types
 * - Comments/JSDoc
 */

const fs = require('fs')
const jscodeshift = require('jscodeshift')

function resolveImportPath(fromFile, importPath) {
  // Resolve relative imports
  if (importPath.startsWith('.')) {
    const dir = require('path').dirname(fromFile)
    let resolved = require('path').resolve(dir, importPath)

    // Try with various extensions
    const extensions = ['', '.ts', '.tsx', '.d.ts']
    for (const ext of extensions) {
      const tryPath = resolved + ext
      if (fs.existsSync(tryPath)) {
        return tryPath
      }
    }

    // Try as directory with index
    for (const ext of ['.ts', '.tsx', '.d.ts']) {
      const tryPath = require('path').join(resolved, `index${ext}`)
      if (fs.existsSync(tryPath)) {
        return tryPath
      }
    }
  }

  // External module - can't resolve
  return null
}

function extractPropsInfo(filePath, targetComponentName = null, resolveImports = true) {
  const source = fs.readFileSync(filePath, 'utf8')
  const j = jscodeshift.withParser('tsx')
  const root = j(source)

  const results = {
    filePath,
    interfaces: [],
    typeAliases: [],
    imports: [],
    componentProps: null,
  }

  // Extract imports
  root.find(j.ImportDeclaration).forEach((path) => {
    const source = path.value.source.value
    const specifiers = path.value.specifiers.map((spec) => {
      if (spec.type === 'ImportSpecifier') {
        return { imported: spec.imported.name, local: spec.local.name, type: 'named' }
      }
      if (spec.type === 'ImportDefaultSpecifier') {
        return { imported: 'default', local: spec.local.name, type: 'default' }
      }
      if (spec.type === 'ImportNamespaceSpecifier') {
        return { imported: '*', local: spec.local.name, type: 'namespace' }
      }
      return null
    }).filter(Boolean)

    results.imports.push({ source, specifiers })
  })

  // Extract all interfaces
  root.find(j.TSInterfaceDeclaration).forEach((path) => {
    const name = path.value.id.name
    const interfaceInfo = {
      name,
      extends: path.value.extends?.map((e) => {
        const extName = e.expression.name
        const typeParams = e.typeParameters?.params.map(p => j(p).toSource())
        return typeParams ? `${extName}<${typeParams.join(', ')}>` : extName
      }) || [],
      properties: [],
    }

    path.value.body.body.forEach((prop) => {
      if (prop.type === 'TSPropertySignature') {
        const propName = prop.key?.name || j(prop.key).toSource()
        const propType = prop.typeAnnotation ? j(prop.typeAnnotation.typeAnnotation).toSource() : 'any'

        // Extract enum/literal values if it's a union
        let enumValues = null
        if (prop.typeAnnotation?.typeAnnotation.type === 'TSUnionType') {
          enumValues = prop.typeAnnotation.typeAnnotation.types
            .filter(t => t.type === 'TSLiteralType')
            .map(t => {
              if (t.literal.type === 'StringLiteral') return `'${t.literal.value}'`
              if (t.literal.type === 'NumericLiteral') return t.literal.value
              if (t.literal.type === 'BooleanLiteral') return t.literal.value
              return j(t).toSource()
            })
        }

        interfaceInfo.properties.push({
          name: propName,
          type: propType,
          optional: prop.optional || false,
          enumValues,
          comment: prop.comments?.[0]?.value.trim() || null,
        })
      }
    })

    results.interfaces.push(interfaceInfo)
  })

  // Extract type aliases
  root.find(j.TSTypeAliasDeclaration).forEach((path) => {
    const name = path.value.id.name
    const typeInfo = {
      name,
      type: j(path.value.typeAnnotation).toSource(),
      comment: path.value.comments?.[0]?.value.trim() || null,
    }

    // If it's a union of literals, extract them
    if (path.value.typeAnnotation.type === 'TSUnionType') {
      typeInfo.enumValues = path.value.typeAnnotation.types
        .filter(t => t.type === 'TSLiteralType')
        .map(t => {
          if (t.literal.type === 'StringLiteral') return `'${t.literal.value}'`
          if (t.literal.type === 'NumericLiteral') return t.literal.value
          return j(t).toSource()
        })
    }

    results.typeAliases.push(typeInfo)
  })

  // Resolve imported types if requested
  if (resolveImports) {
    results.resolvedImports = []
    const debug = process.env.DEBUG === '1'

    for (const imp of results.imports) {
      const resolvedPath = resolveImportPath(filePath, imp.source)

      if (debug) {
        console.error(`\nDEBUG: Processing import from '${imp.source}'`)
        console.error(`  Resolved to: ${resolvedPath || 'null (external)'}`)
      }

      if (resolvedPath) {
        try {
          // Recursively extract from imported file (but don't resolve its imports to avoid cycles)
          const importedData = extractPropsInfo(resolvedPath, null, false)

          if (debug) {
            console.error(`  Found ${importedData.interfaces.length} interfaces, ${importedData.typeAliases.length} type aliases`)
          }

          for (const spec of imp.specifiers) {
            const typeName = spec.imported

            if (debug) {
              console.error(`  Looking for type: ${typeName}`)
            }

            // Find the type/interface in the imported file
            const foundInterface = importedData.interfaces.find(i => i.name === typeName)
            const foundType = importedData.typeAliases.find(t => t.name === typeName)

            if (foundInterface || foundType) {
              if (debug) {
                console.error(`    ✓ Found!`)
              }
              results.resolvedImports.push({
                name: typeName,
                localName: spec.local,
                source: imp.source,
                resolvedPath,
                definition: foundInterface || foundType,
              })
            } else if (debug) {
              console.error(`    ✗ Not found`)
              console.error(`    Available: ${[...importedData.interfaces.map(i => i.name), ...importedData.typeAliases.map(t => t.name)].join(', ')}`)
            }
          }
        } catch (err) {
          if (debug) {
            console.error(`  ERROR parsing: ${err.message}`)
          }
        }
      } else {
        // External import - just record where it's from
        for (const spec of imp.specifiers) {
          results.resolvedImports.push({
            name: spec.imported,
            localName: spec.local,
            source: imp.source,
            resolvedPath: null,
            definition: null,
            external: true,
          })
        }
      }
    }
  }

  // Find the main component props
  // Look for XProps, XProperties, or the component function itself
  if (targetComponentName) {
    const propsNames = [
      `${targetComponentName}Props`,
      `I${targetComponentName}Props`,
      `${targetComponentName}Properties`,
    ]

    for (const propsName of propsNames) {
      const found = results.interfaces.find(i => i.name === propsName) ||
                    results.typeAliases.find(t => t.name === propsName)
      if (found) {
        results.componentProps = found
        break
      }
    }
  }

  return results
}

function formatOutput(results) {
  console.log('='.repeat(80))
  console.log(`Component Props Analysis: ${results.filePath}`)
  console.log('='.repeat(80))
  console.log()

  // Show imports
  if (results.imports?.length) {
    console.log('Imports:')
    console.log('-'.repeat(80))
    results.imports.forEach(imp => {
      const specs = imp.specifiers.map(s => {
        if (s.type === 'default') return s.local
        if (s.type === 'namespace') return `* as ${s.local}`
        return s.imported === s.local ? s.imported : `${s.imported} as ${s.local}`
      }).join(', ')
      console.log(`  from '${imp.source}': ${specs}`)
    })
    console.log()
  }

  // Show resolved imports with their definitions
  if (results.resolvedImports?.length) {
    console.log('Resolved Imported Types:')
    console.log('-'.repeat(80))
    results.resolvedImports.forEach(imp => {
      if (imp.external) {
        console.log(`  ${imp.name} (from '${imp.source}' - external)`)
      } else if (imp.definition) {
        console.log(`  ${imp.name} (from '${imp.source}'):`)
        if (imp.definition.properties) {
          // It's an interface
          if (imp.definition.extends?.length) {
            console.log(`    extends: ${imp.definition.extends.join(', ')}`)
          }
          imp.definition.properties.forEach(prop => {
            const opt = prop.optional ? '?' : ''
            console.log(`      ${prop.name}${opt}: ${prop.type}`)
          })
        } else if (imp.definition.type) {
          // It's a type alias
          console.log(`    = ${imp.definition.type}`)
        }
        console.log()
      }
    })
    console.log()
  }

  if (results.componentProps) {
    console.log(`Main Props Interface: ${results.componentProps.name}`)
    if (results.componentProps.extends?.length) {
      console.log(`Extends: ${results.componentProps.extends.join(', ')}`)
    }
    console.log()
    console.log('Props:')
    console.log('-'.repeat(80))

    results.componentProps.properties?.forEach(prop => {
      const optional = prop.optional ? '?' : ''
      const enumInfo = prop.enumValues ? ` [${prop.enumValues.join(' | ')}]` : ''
      console.log(`  ${prop.name}${optional}: ${prop.type}${enumInfo}`)
      if (prop.comment) {
        console.log(`    // ${prop.comment}`)
      }
    })
    console.log()
  }

  // Show related types
  console.log('Related Types:')
  console.log('-'.repeat(80))
  results.typeAliases.forEach(type => {
    console.log(`  type ${type.name} = ${type.type}`)
    if (type.enumValues?.length) {
      console.log(`    Values: ${type.enumValues.join(' | ')}`)
    }
    if (type.comment) {
      console.log(`    // ${type.comment}`)
    }
    console.log()
  })

  // Show other interfaces (might be extended)
  if (results.interfaces.length > 1 || !results.componentProps) {
    console.log()
    console.log('All Interfaces:')
    console.log('-'.repeat(80))
    results.interfaces.forEach(iface => {
      if (results.componentProps && iface.name === results.componentProps.name) return

      console.log(`  interface ${iface.name}`)
      if (iface.extends?.length) {
        console.log(`    extends ${iface.extends.join(', ')}`)
      }
      console.log(`    Properties: ${iface.properties.map(p => p.name).join(', ')}`)
      console.log()
    })
  }
}

// CLI usage
if (require.main === module) {
  const [, , filePath, componentName] = process.argv

  if (!filePath) {
    console.error('Usage: node extract-component-props.js <file-path> [component-name]')
    console.error('')
    console.error('Example:')
    console.error('  node extract-component-props.js ./src/components/Typography.tsx Typography')
    process.exit(1)
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }

  const results = extractPropsInfo(filePath, componentName)
  formatOutput(results)
}

module.exports = { extractPropsInfo }
