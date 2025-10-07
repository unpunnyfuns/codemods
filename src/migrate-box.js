/**
 * Migrate NativeBase Box to Aurora View with StyleSheet
 *
 * Before:
 * <Box bg="blue.500" p={4} m={2} rounded="md">
 *   <Text>Content</Text>
 * </Box>
 *
 * After:
 * import { View } from 'react-native'
 * import { StyleSheet } from 'react-native'
 *
 * <View style={styles.box0}>
 *   <Text>Content</Text>
 * </View>
 *
 * const styles = StyleSheet.create({
 *   box0: {
 *     backgroundColor: 'blue.500',
 *     padding: 4,
 *     margin: 2,
 *     borderRadius: 'md',
 *   }
 * })
 */

import * as boxProps from './mappings/box-props.js'
import migrateNbComponent from './migrate-nb-component.js'

function main(fileInfo, api, options = {}) {
  return migrateNbComponent(fileInfo, api, {
    ...options,
    sourceImport: options.sourceImport || 'native-base',
    targetImport: options.targetImport || 'react-native',
    tokenImport: options.tokenImport || '@hb-frontend/nordlys',
    components: [{ name: 'Box', targetName: 'View', staticProps: {} }],
    mappings: boxProps,
  })
}

export default main
