/**
 * Convert HStack from react-native to Stack with direction="row" from aurora
 * This is a wrapper around migrate-stack with HStack-specific defaults
 *
 * import { HStack } from 'react-native'
 * <HStack>{children}</HStack>
 * //=>
 * import { Stack } from 'aurora'
 * <Stack direction="row">{children}</Stack>
 *
 * Options:
 * - sourceImport: The import path to look for (default: 'react-native')
 * - sourceName: The named import to replace (default: 'HStack')
 * - targetImport: The import path to use (default: 'aurora')
 * - targetName: The new component name (default: 'Stack')
 * - propName: The prop name to add (default: 'direction')
 * - propValue: The prop value to add (default: 'row')
 */

import migrateStack from './migrate-stack.js'

function main(fileInfo, api, options = {}) {
  const {
    sourceImport = 'react-native',
    sourceName = 'HStack',
    targetImport = 'aurora',
    targetName = 'Stack',
    propName = 'direction',
    propValue = 'row',
  } = options

  // Convert propName/propValue to staticProps format
  const staticProps = { [propName]: propValue }

  // Call migrate-stack with converted options
  return migrateStack(fileInfo, api, {
    sourceImport,
    sourceName,
    targetImport,
    targetName,
    staticProps,
  })
}

export default main
