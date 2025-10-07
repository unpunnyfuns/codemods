import { radius } from '@org/aurora'
import { SomeOtherComponent } from '@org/common/src/other'
import { Stack } from 'aurora'
import { StyleSheet } from 'react-native'

export function ComprehensiveExample() {
  return (
    <>
      {/* Test multi-property expansion with tokens */}
      <Stack direction="vertical" style={styles.vstack0}>
        <SomeOtherComponent />
      </Stack>
      {/* Test marginX/marginY expansion */}
      <Stack direction="horizontal" style={styles.hstack0}>
        <SomeOtherComponent />
      </Stack>
      {/* Test flexbox props */}
      <Stack direction="vertical" style={styles.vstack1}>
        <SomeOtherComponent />
      </Stack>
      {/* Test position props */}
      <Stack direction="horizontal" style={styles.hstack1}>
        <SomeOtherComponent />
      </Stack>
      {/* Test full prop names */}
      <Stack direction="vertical" style={styles.vstack2}>
        <SomeOtherComponent />
      </Stack>
      {/* Test mixed shortcuts and value mappings */}
      <Stack direction="horizontal" style={styles.hstack2}>
        <SomeOtherComponent />
      </Stack>
      {/* Test edge case: boxSize instead of size */}
      <Stack direction="vertical" style={styles.vstack3}>
        <SomeOtherComponent />
      </Stack>
      {/* Test all border radius corners */}
      <Stack direction="horizontal" style={styles.hstack3}>
        <SomeOtherComponent />
      </Stack>
    </>
  )
}

const styles = StyleSheet.create({
  hstack0: {
    marginLeft: 4,
    marginRight: 4,
    marginTop: 2,
    marginBottom: 2,
    gap: 'sm',
  },

  hstack1: {
    position: 'absolute',
    top: 10,
    left: 20,
    zIndex: 999,
  },

  hstack2: {
    backgroundColor: 'red.500',
    padding: 3,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
  },

  hstack3: {
    borderTopLeftRadius: radius('xs'),
    borderTopRightRadius: radius('sm'),
    borderBottomLeftRadius: radius('md'),
    borderBottomRightRadius: radius('lg'),
  },

  vstack0: {
    borderTopLeftRadius: radius('lg'),
    borderTopRightRadius: radius('lg'),
    borderBottomLeftRadius: radius('md'),
    borderBottomRightRadius: radius('md'),
    width: 'full',
    height: 'full',
    gap: 'md',
  },

  vstack1: {
    flex: 1,
    flexGrow: 2,
    flexShrink: 0,
    flexWrap: 'wrap',
    alignSelf: 'center',
  },

  vstack2: {
    margin: 8,
    padding: 4,
    width: '100%',
    height: 200,
    backgroundColor: 'blue.500',
    borderRadius: radius('xl'),
    borderWidth: 2,
    borderColor: 'gray.200',
  },

  vstack3: {
    width: 100,
    height: 100,
    borderTopLeftRadius: radius('sm'),
    borderBottomLeftRadius: radius('sm'),
    borderTopRightRadius: radius('md'),
    borderBottomRightRadius: radius('md'),
  },
})
