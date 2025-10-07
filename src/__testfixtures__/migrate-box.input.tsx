import { SomeOtherComponent } from '@org/common/src/other'
import { Box } from 'native-base'

export function MyComponent() {
  return (
    <>
      <Box bg="blue.500" p={4} m={2} rounded="md">
        <SomeOtherComponent />
      </Box>
      <Box
        testID="test-box"
        backgroundColor="red.300"
        px={3}
        py={2}
        borderWidth={1}
        borderColor="gray.200"
      >
        <SomeOtherComponent />
      </Box>
      <Box w="100%" h={200}>
        <SomeOtherComponent />
      </Box>
    </>
  )
}
