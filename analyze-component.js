/**
 * Analyze a component's props from its TypeScript definition
 * Usage: node analyze-component.js <component-name> <file-path>
 */

const fs = require('fs')
const path = require('path')
const jscodeshift = require('jscodeshift')

function analyzeComponent(filePath, componentName) {
  const source = fs.readFileSync(filePath, 'utf8')
  const j = jscodeshift.withParser('tsx')
  const root = j(source)

  const results = {
    componentName,
    filePath,
    propsInterface: null,
    propsType: null,
    imports: [],
    exportedAs: null,
  }

  // Find type/interface definitions that might be props
  const possiblePropsNames = [
    `${componentName}Props`,
    `I${componentName}Props`,
    `${componentName}Properties`,
  ]

  // Look for interfaces
  root.find(j.TSInterfaceDeclaration).forEach((path) => {
    const name = path.value.id.name
    if (possiblePropsNames.includes(name) || name.toLowerCase().includes('props')) {
      results.propsInterface = {
        name,
        extends: path.value.extends?.map((e) => j(e).toSource()) || [],
        properties: path.value.body.body.map((prop) => ({
          name: prop.key?.name || j(prop.key).toSource(),
          type: prop.typeAnnotation ? j(prop.typeAnnotation.typeAnnotation).toSource() : 'any',
          optional: prop.optional,
          comments: prop.comments?.map((c) => c.value.trim()) || [],
        })),
      }
    }
  })

  // Look for type aliases
  root.find(j.TSTypeAliasDeclaration).forEach((path) => {
    const name = path.value.id.name
    if (possiblePropsNames.includes(name) || name.toLowerCase().includes('props')) {
      results.propsType = {
        name,
        type: j(path.value.typeAnnotation).toSource(),
      }
    }
  })

  // Find imports
  root.find(j.ImportDeclaration).forEach((path) => {
    results.imports.push({
      source: path.value.source.value,
      specifiers: path.value.specifiers.map((spec) => ({
        type: spec.type,
        imported: spec.imported?.name || null,
        local: spec.local?.name || null,
      })),
    })
  })

  // Find how component is exported
  root.find(j.ExportNamedDeclaration).forEach((path) => {
    if (path.value.declaration) {
      const decl = path.value.declaration
      if (
        (decl.type === 'VariableDeclaration' && decl.declarations[0]?.id.name === componentName) ||
        (decl.type === 'FunctionDeclaration' && decl.id?.name === componentName) ||
        (decl.type === 'TSInterfaceDeclaration' && decl.id?.name.includes('Props'))
      ) {
        results.exportedAs = 'named'
      }
    }
  })

  root.find(j.ExportDefaultDeclaration).forEach((path) => {
    if (path.value.declaration?.name === componentName) {
      results.exportedAs = 'default'
    }
  })

  return results
}

// CLI usage
if (require.main === module) {
  const [, , componentName, filePath] = process.argv

  if (!componentName || !filePath) {
    console.error('Usage: node analyze-component.js <component-name> <file-path>')
    process.exit(1)
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }

  const results = analyzeComponent(filePath, componentName)
  console.log(JSON.stringify(results, null, 2))
}

module.exports = { analyzeComponent }
