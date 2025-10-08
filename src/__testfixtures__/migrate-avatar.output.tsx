import { Avatar } from '@hb-frontend/app/src/components/nordlys/Avatar'
import { View, StyleSheet } from 'react-native'
import { color } from '@hb-frontend/nordlys'

export function MyComponent() {
  return (
    <>
      <View style={styles.avatar0}>
        <Avatar
          size="md"
          icon={{
            name: "user",
            fill: 'blue'
          }} />
      </View>
      <Avatar
        size="lg"
        image={{
          source: {
            uri: "https://example.com/avatar.jpg"
          }
        }} />
      <Avatar
        size="sm"
        image={{
          source: { uri: 'local.jpg' }
        }} />
      <Avatar letters="AB" lettersColor="white" size="md" />
    </>
  )
}

const styles = StyleSheet.create({
  avatar0: {
    backgroundColor: color.blue
  }
})
