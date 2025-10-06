/**
 * NativeBase Usage Analyzer v2
 *
 * Core principle: Don't guess - trace.
 * Only count components that actually trace back to native-base imports.
 */

const fs = require('node:fs')
const path = require('node:path')
const glob = require('glob')
const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default

// Module-level config - set from CLI
const config = {
  internalPrefix: '@internal', // Internal package prefix (e.g., @internal, @myorg)
  designSystem: 'design-system', // Design system name in paths/imports
  packagesDir: 'packages', // Directory where internal packages live
}

// ============================================================================
// File Discovery
// ============================================================================

function findSourceFiles(rootDir, options = {}) {
  const { patterns = ['packages/**/src/**/*.{ts,tsx,js,jsx}'], includeTests = false } = options
  const ignore = ['**/node_modules/**', '**/dist/**', '**/build/**']
  if (!includeTests) {
    ignore.push('**/*.test.*', '**/*.spec.*')
  }

  const files = []
  for (const pattern of patterns) {
    const found = glob.sync(pattern, { cwd: rootDir, ignore })
    files.push(...found.map((f) => path.resolve(rootDir, f)))
  }
  return files
}

// ============================================================================
// File Parsing
// ============================================================================

function parseFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties', 'objectRestSpread'],
      errorRecovery: true,
    })
  } catch (_err) {
    return null
  }
}

// ============================================================================
// Import Extraction
// ============================================================================

/**
 * Extract all imports from a file
 * Returns: { imports: Map<localName, {source, originalName}>, exports: Map<exportedName, {source, localName}> }
 */
function extractImports(ast, _filePath) {
  const imports = new Map() // localName -> { source, originalName, type }
  const reExports = new Map() // exportedName -> { source, originalName }
  const allImportSources = new Set()

  traverse(ast, {
    ImportDeclaration(p) {
      const source = p.node.source.value
      allImportSources.add(source)

      for (const spec of p.node.specifiers) {
        if (spec.type === 'ImportSpecifier') {
          const originalName = spec.imported.name || spec.imported.value
          const localName = spec.local.name
          imports.set(localName, { source, originalName, type: 'named' })
        } else if (spec.type === 'ImportDefaultSpecifier') {
          imports.set(spec.local.name, { source, originalName: 'default', type: 'default' })
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          imports.set(spec.local.name, { source, originalName: '*', type: 'namespace' })
        }
      }
    },

    // Track re-exports: export { X } from 'source'
    ExportNamedDeclaration(p) {
      if (p.node.source) {
        const source = p.node.source.value
        allImportSources.add(source)

        for (const spec of p.node.specifiers) {
          const originalName = spec.local.name || spec.local.value
          const exportedName = spec.exported.name || spec.exported.value
          reExports.set(exportedName, { source, originalName })
        }
      }
    },

    // Track re-exports: export * from 'source'
    ExportAllDeclaration(p) {
      if (p.node.source) {
        const source = p.node.source.value
        allImportSources.add(source)
        reExports.set('*', { source, originalName: '*' })
      }
    },
  })

  return { imports, reExports, allImportSources }
}

// ============================================================================
// JSX Component Extraction
// ============================================================================

/**
 * Extract all JSX component usages from a file
 * Returns: [{ name, line }]
 */
function extractJSXComponents(ast) {
  const components = []

  traverse(ast, {
    JSXOpeningElement(p) {
      const name = p.node.name
      if (name.type === 'JSXIdentifier') {
        const componentName = name.name
        // Skip lowercase (HTML elements)
        if (componentName[0] === componentName[0].toUpperCase()) {
          components.push({
            name: componentName,
            line: p.node.loc?.start.line || 0,
          })
        }
      } else if (name.type === 'JSXMemberExpression') {
        // Handle Component.SubComponent
        const parts = []
        let current = name
        while (current.type === 'JSXMemberExpression') {
          parts.unshift(current.property.name)
          current = current.object
        }
        if (current.type === 'JSXIdentifier') {
          parts.unshift(current.name)
        }
        components.push({
          name: parts[0], // Track the base component
          fullName: parts.join('.'),
          line: p.node.loc?.start.line || 0,
        })
      }
    },

    // Also track hook calls like useToken, useToast
    CallExpression(p) {
      if (p.node.callee.type === 'Identifier') {
        const name = p.node.callee.name
        if (name.startsWith('use') && name[3] === name[3].toUpperCase()) {
          components.push({
            name,
            line: p.node.loc?.start.line || 0,
            isHook: true,
          })
        }
      }
    },
  })

  return components
}

// ============================================================================
// Import Resolution
// ============================================================================

/**
 * Resolve an import path to an absolute file path
 */
function resolveImportPath(importPath, fromFile, rootDir) {
  // External packages - return as-is for identification
  if (!importPath.startsWith('.') && !importPath.startsWith(config.internalPrefix)) {
    return { type: 'external', package: importPath.split('/')[0] }
  }

  const fromDir = path.dirname(fromFile)
  let resolved

  if (importPath.startsWith('.')) {
    resolved = path.resolve(fromDir, importPath)
  } else if (importPath.startsWith(`${config.internalPrefix}/`)) {
    const packagePath = importPath.replace(`${config.internalPrefix}/`, `${config.packagesDir}/`)
    resolved = path.resolve(rootDir, packagePath)
  } else {
    return { type: 'external', package: importPath }
  }

  // Try extensions
  const candidates = [
    resolved,
    `${resolved}.tsx`,
    `${resolved}.ts`,
    `${resolved}.js`,
    `${resolved}/index.tsx`,
    `${resolved}/index.ts`,
    `${resolved}/index.js`,
    // Monorepo packages often have src/ directory
    `${resolved}/src/index.tsx`,
    `${resolved}/src/index.ts`,
    `${resolved}/src/index.js`,
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { type: 'local', path: fs.realpathSync(candidate) }
    }
  }

  return { type: 'unresolved', original: importPath }
}

// ============================================================================
// Import Graph Building
// ============================================================================

function buildImportGraph(files, _rootDir) {
  const graph = new Map() // filePath -> { imports, reExports, allImportSources, jsxComponents }

  for (const file of files) {
    const ast = parseFile(file)
    if (!ast) {
      continue
    }

    const { imports, reExports, allImportSources } = extractImports(ast, file)
    const jsxComponents = extractJSXComponents(ast)

    graph.set(file, {
      imports,
      reExports,
      allImportSources,
      jsxComponents,
    })
  }

  return graph
}

// ============================================================================
// Import Tracing
// ============================================================================

/**
 * Trace a component import to its source
 * Returns: { source: 'native-base' | 'react-native' | designSystem | 'local' | 'unknown', path?: string[] }
 */
function traceImport(componentName, filePath, graph, rootDir, visited = new Set()) {
  // Prevent infinite loops
  const key = `${filePath}:${componentName}`
  if (visited.has(key)) {
    return { source: 'circular', path: [] }
  }
  visited.add(key)

  const fileData = graph.get(filePath)
  if (!fileData) {
    return { source: 'unknown', reason: 'file-not-in-graph' }
  }

  // Check if component is imported in this file
  const importInfo = fileData.imports.get(componentName)
  if (importInfo) {
    const { source } = importInfo

    // Direct native-base import
    if (source === 'native-base' || source.startsWith('native-base/')) {
      return { source: 'native-base', component: importInfo.originalName }
    }

    // React Native
    if (source === 'react-native' || source.startsWith('react-native/')) {
      return { source: 'react-native', component: importInfo.originalName }
    }

    // Target design system package
    if (
      source === `${config.internalPrefix}/${config.designSystem}` ||
      source.includes(`/${config.designSystem}/`)
    ) {
      return { source: config.designSystem, component: importInfo.originalName }
    }

    // Local import - resolve and trace further
    const resolved = resolveImportPath(source, filePath, rootDir)

    if (resolved.type === 'external') {
      return { source: 'external', package: resolved.package }
    }

    if (resolved.type === 'local') {
      // Trace into the resolved file
      const targetName =
        importInfo.originalName === 'default' ? componentName : importInfo.originalName
      return traceImport(targetName, resolved.path, graph, rootDir, visited)
    }

    return { source: 'unresolved', reason: 'import-not-resolved', import: source }
  }

  // Check re-exports
  const reExportInfo = fileData.reExports.get(componentName)
  if (reExportInfo) {
    const { source, originalName } = reExportInfo

    // Direct native-base re-export
    if (source === 'native-base' || source.startsWith('native-base/')) {
      return { source: 'native-base', component: originalName }
    }

    // React Native
    if (source === 'react-native' || source.startsWith('react-native/')) {
      return { source: 'react-native', component: originalName }
    }

    // Target design system
    if (
      source === `${config.internalPrefix}/${config.designSystem}` ||
      source.includes(`/${config.designSystem}/`)
    ) {
      return { source: config.designSystem, component: originalName }
    }

    // Local re-export - resolve and trace
    const resolved = resolveImportPath(source, filePath, rootDir)
    if (resolved.type === 'local') {
      return traceImport(originalName, resolved.path, graph, rootDir, visited)
    }

    return { source: 'unresolved', reason: 'reexport-not-resolved', import: source }
  }

  // Check for export * from
  const starExport = fileData.reExports.get('*')
  if (starExport) {
    const resolved = resolveImportPath(starExport.source, filePath, rootDir)
    if (resolved.type === 'local') {
      return traceImport(componentName, resolved.path, graph, rootDir, visited)
    }
  }

  // Component defined locally (not imported)
  // Check if this file imports from native-base - if so, the local component likely wraps NB
  for (const source of fileData.allImportSources) {
    if (source === 'native-base' || source.startsWith('native-base/')) {
      return { source: 'native-base', component: componentName, reason: 'file-imports-nb' }
    }
  }

  // Check if file is in design system folder OR imports from it (check BEFORE react-native)
  if (filePath.includes(`/${config.designSystem}/`)) {
    return {
      source: config.designSystem,
      component: componentName,
      reason: `file-in-${config.designSystem}`,
    }
  }
  for (const source of fileData.allImportSources) {
    if (
      source === `${config.internalPrefix}/${config.designSystem}` ||
      source.includes(`/${config.designSystem}/`)
    ) {
      return {
        source: config.designSystem,
        component: componentName,
        reason: `file-imports-${config.designSystem}`,
      }
    }
  }

  // Check if file imports from react-native
  for (const source of fileData.allImportSources) {
    if (source === 'react-native' || source.startsWith('react-native/')) {
      return { source: 'react-native', component: componentName, reason: 'file-imports-rn' }
    }
  }

  return { source: 'local-definition' }
}

// ============================================================================
// Analysis
// ============================================================================

function analyze(rootDir, options = {}) {
  const files = findSourceFiles(rootDir, options)
  const graph = buildImportGraph(files, rootDir)

  // Find files with direct native-base imports and categorize them
  const directNBFilesSet = new Set()
  for (const [file, data] of graph) {
    for (const source of data.allImportSources) {
      if (source === 'native-base' || source.startsWith('native-base/')) {
        directNBFilesSet.add(file)
        break
      }
    }
  }

  // Trace all JSX components
  const componentTraces = new Map() // component -> { source -> count }
  const fileResults = new Map() // file -> { nbInstances, targetInstances, rnInstances, isDirect }
  const failedTraces = [] // { component, import, file, reason }

  for (const [file, data] of graph) {
    let nbCount = 0
    let targetCount = 0
    let rnCount = 0
    const componentBreakdown = new Map()
    const isDirect = directNBFilesSet.has(file)

    for (const component of data.jsxComponents) {
      const trace = traceImport(component.name, file, graph, rootDir)

      if (trace.source === 'native-base') {
        nbCount++
        const key = trace.component || component.name
        if (!componentTraces.has(key)) {
          componentTraces.set(key, {
            'native-base': 0,
            [config.designSystem]: 0,
            'react-native': 0,
          })
        }
        componentTraces.get(key)['native-base']++
        componentBreakdown.set(component.name, (componentBreakdown.get(component.name) || 0) + 1)
      } else if (trace.source === config.designSystem) {
        targetCount++
      } else if (trace.source === 'react-native') {
        rnCount++
      } else if (trace.source === 'unresolved' || trace.source === 'unknown') {
        failedTraces.push({
          component: component.name,
          file: path.relative(rootDir, file),
          reason: trace.reason,
          import: trace.import,
        })
      }
    }

    fileResults.set(file, {
      nbCount,
      targetCount,
      rnCount,
      componentBreakdown,
      isDirect,
      hasReExports: data.reExports.size > 0,
    })
  }

  // Categorize direct NB files
  const directNBCategories = { withInstances: [], reExportOnly: [], noUsage: [] }
  for (const file of directNBFilesSet) {
    const result = fileResults.get(file)
    const relPath = path.relative(rootDir, file)
    if (result.nbCount > 0) {
      directNBCategories.withInstances.push({ file: relPath, count: result.nbCount })
    } else if (result.hasReExports) {
      directNBCategories.reExportOnly.push(relPath)
    } else {
      directNBCategories.noUsage.push(relPath)
    }
  }

  // Aggregate NB component counts
  const nbComponentCounts = new Map()
  for (const [component, sources] of componentTraces) {
    if (sources['native-base'] > 0) {
      nbComponentCounts.set(component, sources['native-base'])
    }
  }

  // Sort by count
  const sortedNBComponents = [...nbComponentCounts.entries()].sort((a, b) => b[1] - a[1])

  // Count direct vs transitive instances
  let directInstances = 0
  let transitiveInstances = 0
  for (const [_file, result] of fileResults) {
    if (result.nbCount > 0) {
      if (result.isDirect) {
        directInstances += result.nbCount
      } else {
        transitiveInstances += result.nbCount
      }
    }
  }

  // Files with NB usage (sorted)
  const filesWithNB = [...fileResults.entries()]
    .filter(([, r]) => r.nbCount > 0)
    .map(([f, r]) => ({
      file: path.relative(rootDir, f),
      count: r.nbCount,
      isDirect: r.isDirect,
      components: Object.fromEntries(r.componentBreakdown),
    }))
    .sort((a, b) => b.count - a.count)

  // Package breakdown
  const packageBreakdown = new Map()
  for (const { file, count } of filesWithNB) {
    const match = file.match(/^packages\/([^/]+)\//)
    const pkg = match ? `packages/${match[1]}` : 'other'
    if (!packageBreakdown.has(pkg)) {
      packageBreakdown.set(pkg, { files: 0, instances: 0 })
    }
    packageBreakdown.get(pkg).files++
    packageBreakdown.get(pkg).instances += count
  }
  const sortedPackages = [...packageBreakdown.entries()]
    .sort((a, b) => b[1].instances - a[1].instances)
    .map(([pkg, data]) => ({ package: pkg, ...data }))

  return {
    directNBFiles: [...directNBFilesSet].map((f) => path.relative(rootDir, f)),
    totalDirectFiles: directNBFilesSet.size,
    directNBCategories,
    directInstances,
    transitiveInstances,
    totalNBInstances: directInstances + transitiveInstances,
    componentCounts: Object.fromEntries(sortedNBComponents),
    packageBreakdown: sortedPackages,
    filesWithNB,
    failedTraces: aggregateFailedTraces(failedTraces),
  }
}

function aggregateFailedTraces(traces) {
  const grouped = new Map()
  for (const t of traces) {
    const key = `${t.component}:${t.import || 'unknown'}`
    if (!grouped.has(key)) {
      grouped.set(key, { component: t.component, import: t.import, reason: t.reason, files: [] })
    }
    grouped.get(key).files.push(t.file)
  }
  return [...grouped.values()].sort((a, b) => b.files.length - a.files.length)
}

// ============================================================================
// Output Formatting
// ============================================================================

function formatCurrentOutput(results) {
  const lines = []
  lines.push('=== NativeBase Usage ===\n')

  // File breakdown
  const { directNBCategories } = results
  const totalFilesWithNB = results.filesWithNB.length
  const directWithInstances = directNBCategories.withInstances.length
  const transitiveFiles = totalFilesWithNB - directWithInstances

  lines.push(`Files with NB usage: ${totalFilesWithNB} total`)
  lines.push(`  - Direct imports:  ${directWithInstances} files`)
  lines.push(`  - Via wrappers:    ${transitiveFiles} files`)
  lines.push('')
  lines.push('Direct import breakdown:')
  lines.push(`  - With instances: ${directNBCategories.withInstances.length} files`)
  lines.push(`  - Re-export only: ${directNBCategories.reExportOnly.length} files`)
  lines.push(`  - Types/config:   ${directNBCategories.noUsage.length} files`)
  lines.push('')

  // Instance breakdown
  lines.push('NB instances:')
  lines.push(`  - Direct (in NB files):     ${results.directInstances}`)
  lines.push(`  - Transitive (via wrappers): ${results.transitiveInstances}`)
  lines.push(`  - Total:                     ${results.totalNBInstances}`)
  lines.push('')

  lines.push('By component:')
  for (const [component, count] of Object.entries(results.componentCounts).slice(0, 15)) {
    lines.push(`  ${component}: ${count}`)
  }
  lines.push('')

  lines.push('By package:')
  for (const pkg of results.packageBreakdown) {
    lines.push(`  ${pkg.package}: ${pkg.files} files, ${pkg.instances} instances`)
  }
  lines.push('')

  lines.push('Top files by NB usage:')
  for (const f of results.filesWithNB.slice(0, 10)) {
    const marker = f.isDirect ? '[D]' : '[T]'
    lines.push(`  ${marker} ${f.file} (${f.count})`)
  }

  if (results.failedTraces.length > 0) {
    lines.push('')
    lines.push("Failed traces (couldn't resolve):")
    for (const t of results.failedTraces.slice(0, 10)) {
      lines.push(`  ${t.component} from '${t.import || 'unknown'}' in ${t.files.length} files`)
    }
  }

  return lines.join('\n')
}

function formatMachineOutput(results) {
  const lines = []
  // File counts
  const totalFilesWithNB = results.filesWithNB.length
  const directWithInstances = results.directNBCategories.withInstances.length
  lines.push(`TOTAL_FILES_WITH_NB=${totalFilesWithNB}`)
  lines.push(`DIRECT_FILES=${directWithInstances}`)
  lines.push(`TRANSITIVE_FILES=${totalFilesWithNB - directWithInstances}`)
  lines.push(`DIRECT_IMPORT_FILES=${results.totalDirectFiles}`)
  lines.push(`DIRECT_REEXPORT_ONLY=${results.directNBCategories.reExportOnly.length}`)
  lines.push(`DIRECT_TYPES_CONFIG=${results.directNBCategories.noUsage.length}`)

  // Instance counts
  lines.push(`DIRECT_INSTANCES=${results.directInstances}`)
  lines.push(`TRANSITIVE_INSTANCES=${results.transitiveInstances}`)
  lines.push(`TOTAL_INSTANCES=${results.totalNBInstances}`)

  // Per-component counts
  for (const [component, count] of Object.entries(results.componentCounts)) {
    lines.push(`COMPONENT_${component.toUpperCase()}=${count}`)
  }

  lines.push(`FAILED_TRACES=${results.failedTraces.reduce((sum, t) => sum + t.files.length, 0)}`)

  return lines.join('\n')
}

function formatVerboseOutput(results) {
  const lines = [formatCurrentOutput(results)]
  const directFiles = new Set(results.directNBFiles)

  lines.push('\n\n=== Direct NB Import Files ===')
  lines.push('\nWith instances:')
  for (const { file, count } of results.directNBCategories.withInstances) {
    lines.push(`  ${file} (${count})`)
  }
  lines.push('\nRe-export only:')
  for (const f of results.directNBCategories.reExportOnly) {
    lines.push(`  ${f}`)
  }
  lines.push('\nTypes/config only:')
  for (const f of results.directNBCategories.noUsage) {
    lines.push(`  ${f}`)
  }

  lines.push('\n=== All Files with NB Usage ===')
  for (const f of results.filesWithNB) {
    const marker = directFiles.has(f.file) ? '[D]' : '[T]'
    lines.push(`  ${marker} ${f.file}`)
    for (const [comp, count] of Object.entries(f.components)) {
      lines.push(`      ${comp}: ${count}`)
    }
  }

  if (results.failedTraces.length > 0) {
    lines.push('\n=== All Failed Traces ===')
    for (const t of results.failedTraces) {
      lines.push(`  ${t.component} from '${t.import || 'unknown'}' (${t.reason})`)
      for (const f of t.files.slice(0, 5)) {
        lines.push(`    - ${f}`)
      }
      if (t.files.length > 5) {
        lines.push(`    ... and ${t.files.length - 5} more`)
      }
    }
  }

  return lines.join('\n')
}

// ============================================================================
// CSV Export
// ============================================================================

function getGitInfo() {
  try {
    const { execSync } = require('node:child_process')
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
    const date = execSync('git show -s --format=%ci HEAD', { encoding: 'utf8' }).split(' ')[0]
    return { commit, date }
  } catch {
    return { commit: 'unknown', date: new Date().toISOString().split('T')[0] }
  }
}

function writeCSV(filePath, headers, rows, append = false) {
  const headerLine = headers.join(',')
  const dataLines = rows.map((row) =>
    row.map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v)).join(','),
  )

  if (append && fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, `${dataLines.join('\n')}\n`)
  } else {
    fs.writeFileSync(filePath, `${headerLine}\n${dataLines.join('\n')}\n`)
  }
}

function exportToCSV(results, outputDir, append = false) {
  const { commit, date } = getGitInfo()

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const totalFiles = results.filesWithNB.length
  const directWithInstances = results.directNBCategories.withInstances.length
  const transitiveFiles = totalFiles - directWithInstances

  // 1. Summary CSV
  writeCSV(
    path.join(outputDir, 'nb-summary.csv'),
    [
      'Date',
      'Commit',
      'TotalFiles',
      'DirectFiles',
      'TransitiveFiles',
      'TotalInstances',
      'DirectInstances',
      'TransitiveInstances',
    ],
    [
      [
        date,
        commit,
        totalFiles,
        directWithInstances,
        transitiveFiles,
        results.totalNBInstances,
        results.directInstances,
        results.transitiveInstances,
      ],
    ],
    append,
  )

  // 2. Components CSV
  const componentRows = Object.entries(results.componentCounts).map(([component, count]) => [
    date,
    commit,
    component,
    count,
  ])
  writeCSV(
    path.join(outputDir, 'nb-components.csv'),
    ['Date', 'Commit', 'Component', 'Count'],
    componentRows,
    append,
  )

  // 3. Packages CSV
  const packageRows = results.packageBreakdown.map((p) => [
    date,
    commit,
    p.package,
    p.files,
    p.instances,
  ])
  writeCSV(
    path.join(outputDir, 'nb-packages.csv'),
    ['Date', 'Commit', 'Package', 'Files', 'Instances'],
    packageRows,
    append,
  )

  // 4. Files CSV
  const fileRows = results.filesWithNB.map((f) => [
    date,
    commit,
    f.file,
    f.isDirect ? 1 : 0,
    f.count,
  ])
  writeCSV(
    path.join(outputDir, 'nb-files.csv'),
    ['Date', 'Commit', 'File', 'IsDirect', 'Instances'],
    fileRows,
    append,
  )

  // 5. File-Components CSV (for validation)
  const fileComponentRows = []
  for (const f of results.filesWithNB) {
    for (const [component, count] of Object.entries(f.components)) {
      fileComponentRows.push([date, commit, f.file, component, count])
    }
  }
  writeCSV(
    path.join(outputDir, 'nb-file-components.csv'),
    ['Date', 'Commit', 'File', 'Component', 'Count'],
    fileComponentRows,
    append,
  )

  return {
    summary: path.join(outputDir, 'nb-summary.csv'),
    components: path.join(outputDir, 'nb-components.csv'),
    packages: path.join(outputDir, 'nb-packages.csv'),
    files: path.join(outputDir, 'nb-files.csv'),
    fileComponents: path.join(outputDir, 'nb-file-components.csv'),
  }
}

// ============================================================================
// CLI
// ============================================================================

function parseArgWithValue(args, flag) {
  const index = args.indexOf(flag)
  return index !== -1 && args[index + 1] ? args[index + 1] : null
}

function runCLI() {
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose') || args.includes('-v')
  const machine = args.includes('--machine')
  const help = args.includes('--help') || args.includes('-h')
  const append = args.includes('--append')
  const includeTests = args.includes('--tests')

  // Parse options with values
  const csvDir = parseArgWithValue(args, '--csv')
  const internalPrefix = parseArgWithValue(args, '--internal-prefix')
  const designSystem = parseArgWithValue(args, '--design-system')
  const packagesDir = parseArgWithValue(args, '--packages-dir')

  // Update config from CLI
  if (internalPrefix) {
    config.internalPrefix = internalPrefix
  }
  if (designSystem) {
    config.designSystem = designSystem
  }
  if (packagesDir) {
    config.packagesDir = packagesDir
  }

  // Find target dir (positional arg that's not a flag value)
  const flagValues = [csvDir, internalPrefix, designSystem, packagesDir].filter(Boolean)
  const targetDir =
    args.find((arg) => !arg.startsWith('-') && !flagValues.includes(arg)) || process.cwd()

  if (help) {
    console.log('Usage: nb-analyzer [target-dir] [options]')
    console.log('')
    console.log('Options:')
    console.log('  -h, --help               Show help')
    console.log('  -v, --verbose            Show detailed breakdown')
    console.log('  --machine                Machine-readable output')
    console.log('  --csv <dir>              Export to CSV files in directory')
    console.log('  --append                 Append to existing CSV files')
    console.log('  --tests                  Include test files (*.test.*, *.spec.*)')
    console.log('')
    console.log('Config:')
    console.log(
      `  --internal-prefix <pkg>  Internal package prefix (default: ${config.internalPrefix})`,
    )
    console.log(`  --design-system <name>   Design system name (default: ${config.designSystem})`)
    console.log(`  --packages-dir <dir>     Packages directory (default: ${config.packagesDir})`)
    process.exit(0)
  }

  const results = analyze(path.resolve(targetDir), { includeTests })

  if (csvDir) {
    const files = exportToCSV(results, csvDir, append)
    console.log('Exported CSV files:')
    console.log(`  ${files.summary}`)
    console.log(`  ${files.components}`)
    console.log(`  ${files.packages}`)
    console.log(`  ${files.files}`)
    console.log(`  ${files.fileComponents}`)
  } else if (machine) {
    console.log(formatMachineOutput(results))
  } else if (verbose) {
    console.log(formatVerboseOutput(results))
  } else {
    console.log(formatCurrentOutput(results))
  }
}

if (require.main === module) {
  runCLI()
}

module.exports = {
  analyze,
  findSourceFiles,
  buildImportGraph,
  traceImport,
  formatCurrentOutput,
  formatMachineOutput,
  formatVerboseOutput,
  exportToCSV,
}
