import { radius } from '@org/aurora'
import { SomeOtherComponent } from '@org/common/src/other'
import { Stack } from 'aurora'
import { StyleSheet } from 'react-native'

export function MyComponent() {
  return (
    <>
      <Stack direction="row" style={styles.hstack0}>
        <SomeOtherComponent />
      </Stack>
      <Stack testID="test-stack" direction="row" style={styles.hstack1}>
        <SomeOtherComponent />
      </Stack>
      <Stack onPress={() => {}} reverse={true} direction="row" style={styles.hstack2}>
        <SomeOtherComponent />
      </Stack>
    </>
  )
}

const styles = StyleSheet.create({
  hstack0: {
    gap: 2,
    margin: 4,
    alignItems: 'flex-start',
    borderRadius: radius('md'),
  },

  hstack1: {
    marginTop: 8,
    paddingHorizontal: 3,
    paddingVertical: 2,
    justifyContent: 'space-between',
  },

  hstack2: {
    marginHorizontal: 5,
    marginBottom: 1,
  },
})
