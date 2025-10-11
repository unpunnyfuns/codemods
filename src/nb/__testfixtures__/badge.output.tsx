import { Badge } from '@hb-frontend/app/src/components/nordlys/Badge'
import { color, space } from '@hb-frontend/nordlys'
import { StyleSheet, View } from 'react-native'

export function Example() {
  return (
    <>
      {/* Text badge */}
      <Badge text="New" size="md" />
      {/* Badge with expression */}
      <Badge text={count} size="md" />
      {/* Badge with colorScheme (maps to state) */}
      <Badge state="success" text="Success" size="md" />
      {/* Badge with size and transparent */}
      <Badge size="lg" transparent text="Large" />
      {/* Indicator dot pattern (no text, just styles) */}
      <View style={styles.badge4} />
      {/* Badge with testID */}
      <Badge testID="status-badge" text="Active" size="md" />
      {/* Badge with layout props */}
      <View style={styles.badge6}>
        <Badge text="Beta" size="md" />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  badge4: {
    padding: 0,
    backgroundColor: color.icon.brand,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  badge6: {
    marginTop: space.sm,
    marginLeft: space.xs,
  },
})
