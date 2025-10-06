import { SomeOtherComponent } from '@source/common/src/other'
import { HStack, VStack } from 'native-base'

export function ComprehensiveExample() {
  return (
    <>
      {/* Test multi-property expansion with tokens */}
      <VStack roundedTop="lg" roundedBottom="md" size="full" space="md">
        <SomeOtherComponent />
      </VStack>

      {/* Test marginX/marginY expansion */}
      <HStack marginX={4} marginY={2} space="sm">
        <SomeOtherComponent />
      </HStack>

      {/* Test flexbox props */}
      <VStack flex={1} flexGrow={2} flexShrink={0} flexWrap="wrap" alignSelf="center">
        <SomeOtherComponent />
      </VStack>

      {/* Test position props */}
      <HStack position="absolute" top={10} left={20} zIndex={999}>
        <SomeOtherComponent />
      </HStack>

      {/* Test full prop names */}
      <VStack
        margin={8}
        padding={4}
        width="100%"
        height={200}
        backgroundColor="blue.500"
        borderRadius="xl"
        borderWidth={2}
        borderColor="gray.200"
      >
        <SomeOtherComponent />
      </VStack>

      {/* Test mixed shortcuts and value mappings */}
      <HStack
        bg="red.500"
        p={3}
        mx={2}
        align="center"
        justify="between"
        flex={1}
        overflow="hidden"
        display="flex"
      >
        <SomeOtherComponent />
      </HStack>

      {/* Test edge case: boxSize instead of size */}
      <VStack boxSize={100} roundedLeft="sm" roundedRight="md">
        <SomeOtherComponent />
      </VStack>

      {/* Test all border radius corners */}
      <HStack
        borderTopLeftRadius="xs"
        borderTopRightRadius="sm"
        borderBottomLeftRadius="md"
        borderBottomRightRadius="lg"
      >
        <SomeOtherComponent />
      </HStack>
    </>
  )
}
