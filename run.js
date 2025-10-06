#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function usage(projects = []) {
  console.log(`Usage: node run.js <project> --target=<path> --config=<file> [options]

Projects: ${projects.length ? projects.join(', ') : '(load config to see available projects)'}

Options:
  --config=<file>   Config file (required)
  --target=<path>   Target directory (required)
  --dry             Dry run (don't write files)
  --debug           Show debug output
  --cleanup         Run remove-unused after migrations

Examples:
  node run.js typography --config=config.json --target=packages/app/src
  node run.js box --config=config.json --target=packages/app/src --dry
  node run.js stack --config=config.json --target=packages/app/src --cleanup
`)
  process.exit(1)
}

function parseArgs(args) {
  const result = { project: null, target: null, dry: false, debug: false, config: null, cleanup: false }

  for (const arg of args) {
    if (arg.startsWith('--target=')) {
      result.target = arg.slice(9)
    } else if (arg === '--dry') {
      result.dry = true
    } else if (arg === '--debug') {
      result.debug = true
    } else if (arg === '--cleanup') {
      result.cleanup = true
    } else if (arg.startsWith('--config=')) {
      result.config = arg.slice(9)
    } else if (!arg.startsWith('--')) {
      result.project = arg
    }
  }

  return result
}

function runCodemod(codemod, target, options = {}) {
  const runSh = resolve(__dirname, 'run.sh')
  const args = [`--target=${target}`]

  if (options.tokenImport) args.push(`--tokenImport=${options.tokenImport}`)
  if (options.targetImport) args.push(`--targetImport=${options.targetImport}`)
  if (options.sourceImport) args.push(`--sourceImport=${options.sourceImport}`)
  if (options.dry) args.push('--dry')
  if (options.debug) args.push('--debug')

  const cmd = `${runSh} ${codemod} ${args.join(' ')}`
  console.log(`\n→ ${cmd}\n`)

  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() })
  } catch (error) {
    // jscodeshift returns non-zero even on partial success, continue
    console.log('(continuing...)')
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) usage()

  const opts = parseArgs(args)

  if (!opts.config) {
    console.error('Error: --config=<file> required')
    usage()
  }

  // Load config
  const configPath = resolve(process.cwd(), opts.config)
  if (!existsSync(configPath)) {
    console.error(`Error: config file not found: ${configPath}`)
    process.exit(1)
  }
  const config = JSON.parse(readFileSync(configPath, 'utf-8'))

  if (!opts.project) {
    console.error('Error: project name required')
    usage(Object.keys(config))
  }

  if (!opts.target) {
    console.error('Error: --target=<path> required')
    usage(Object.keys(config))
  }

  const projectConfig = config[opts.project]
  if (!projectConfig) {
    console.error(`Error: unknown project "${opts.project}"`)
    console.error(`Available: ${Object.keys(config).join(', ')}`)
    process.exit(1)
  }

  console.log(`\nRunning ${opts.project} migrations on ${opts.target}`)
  console.log(`Codemod: ${projectConfig.codemod}`)
  console.log(`Source imports: ${projectConfig.sourceImports.length} permutations`)
  if (opts.dry) console.log('(dry run)')
  console.log('')

  // Run for each sourceImport
  for (const sourceImport of projectConfig.sourceImports) {
    runCodemod(projectConfig.codemod, opts.target, {
      tokenImport: projectConfig.tokenImport,
      targetImport: projectConfig.targetImport,
      sourceImport,
      dry: opts.dry,
      debug: opts.debug,
    })
  }

  // Cleanup
  if (opts.cleanup) {
    console.log('\n--- Cleanup ---')
    runCodemod('remove-unused', opts.target, { dry: opts.dry })
  }

  console.log('\nDone!')
}

main()
