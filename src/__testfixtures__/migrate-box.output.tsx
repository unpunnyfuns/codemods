import { radius } from '@org/aurora'
import { SomeOtherComponent } from '@org/common/src/other'
import { StyleSheet, View } from 'react-native'

export function MyComponent() {
  return (
    <>
      <View style={styles.box0}>
        <SomeOtherComponent />
      </View>
      <View testID="test-box" style={styles.box1}>
        <SomeOtherComponent />
      </View>
      <View style={styles.box2}>
        <SomeOtherComponent />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  box0: {
    backgroundColor: 'blue.500',
    padding: 4,
    margin: 2,
    borderRadius: radius('md'),
  },

  box1: {
    backgroundColor: 'red.300',
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'gray.200',
  },

  box2: {
    width: '100%',
    height: 200,
  },
})
