/**
 * Migrate NativeBase Stack components (HStack/VStack) to target Stack component
 * Wrapper around migrate-nb-component with stack-specific prop mappings
 * Automatically handles both HStack and VStack in a single run, setting direction accordingly
 *
 * import { HStack, VStack } from 'react-native'
 * <HStack space={2}>{children}</HStack>
 * <VStack space={4}>{children}</VStack>
 * //=>
 * import { Stack } from 'aurora'
 * import { StyleSheet } from 'react-native'
 * <Stack direction="row" style={styles.stack0}>{children}</Stack>
 * <Stack direction="column" style={styles.stack1}>{children}</Stack>
 * const styles = StyleSheet.create({ stack0: { gap: 2 }, stack1: { gap: 4 } })
 *
 * Options:
 * - sourceImport: The import path to look for (default: 'react-native')
 * - targetImport: The import path to use (default: 'aurora')
 * - targetName: The new component name (default: 'Stack')
 */

import * as stackProps from './mappings/stack-props.js'
import migrateNbComponent from './migrate-nb-component.js'

function main(fileInfo, api, options = {}) {
  return migrateNbComponent(fileInfo, api, {
    ...options,
    components: [
      { name: 'HStack', staticProps: { direction: 'row' } },
      { name: 'VStack', staticProps: { direction: 'column' } },
    ],
    mappings: stackProps,
  })
}

export default main
