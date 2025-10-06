import { SomeOtherComponent } from '@org/common/src/other'
import { HStack } from 'native-base'

export function MyComponent() {
  return (
    <>
      <HStack space={2} m={4} align="start" rounded="md">
        <SomeOtherComponent />
      </HStack>
      <HStack mt={8} px={3} py={2} justify="between" testID="test-stack">
        <SomeOtherComponent />
      </HStack>
      <HStack mx={5} mb={1} reversed={true} onPress={() => {}} divider={<Divider />}>
        <SomeOtherComponent />
      </HStack>
    </>
  )
}
