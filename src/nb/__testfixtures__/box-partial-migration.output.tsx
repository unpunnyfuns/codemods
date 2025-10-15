import { color, space } from '@hb-frontend/nordlys'
import { Box } from 'native-base'
import { StyleSheet, View } from 'react-native'

export function Example() {
  return (
    <>
      <View style={styles.box0}>Successfully migrated</View>

      {/* TODO: Box requires manual migration
        Props that need manual handling:
          textAlign: "left" */}
      <Box textAlign="left" p="md">
        Skipped due to textAlign
      </Box>
    </>
  )
}

const styles = StyleSheet.create({
  box0: {
    padding: space.lg,
    backgroundColor: color.blue['500'],
  },
})
