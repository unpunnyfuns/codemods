import { SomeOtherComponent } from '@org/common/src/other'
import { Stack } from 'aurora'
import { StyleSheet } from 'react-native'

export function MyComponent() {
  return (
    <>
      <Stack direction="row" style={styles.hstack0}>
        <SomeOtherComponent />
      </Stack>
      <Stack direction="row" style={styles.hstack1}>
        <SomeOtherComponent />
      </Stack>
      <Stack direction="row" style={styles.hstack2}>
        <SomeOtherComponent />
      </Stack>
    </>
  )
}

const styles = StyleSheet.create({
  hstack0: {
    gap: 2,
    margin: 4,
  },

  hstack1: {
    marginTop: 8,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },

  hstack2: {
    marginHorizontal: 5,
    marginBottom: 1,
  },
})
