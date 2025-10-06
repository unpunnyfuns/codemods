import { SomeOtherComponent } from '@org/common/src/other'
import { Stack } from 'aurora'
import { StyleSheet } from 'react-native'

export function MyComponent() {
  return (
    <>
      <Stack rounded="md" alignItems="flex-start" direction="row" style={styles.stack0}>
        <SomeOtherComponent />
      </Stack>
      <Stack
        testID="test-stack"
        justifyContent="space-between"
        direction="row"
        style={styles.stack1}
      >
        <SomeOtherComponent />
      </Stack>
      <Stack onPress={() => {}} reverse={true} direction="row" style={styles.stack2}>
        <SomeOtherComponent />
      </Stack>
    </>
  )
}

const styles = StyleSheet.create({
  stack0: {
    gap: 2,
    margin: 4,
  },

  stack1: {
    marginTop: 8,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },

  stack2: {
    marginHorizontal: 5,
    marginBottom: 1,
  },
})
