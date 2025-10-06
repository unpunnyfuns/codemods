import { SomeOtherComponent } from '@org/common/src/other'
import { HStack } from 'react-native'

export function MyComponent() {
  return (
    <>
      <HStack space={2} m={4}>
        <SomeOtherComponent />
      </HStack>
      <HStack mt={8} px={3} py={2}>
        <SomeOtherComponent />
      </HStack>
      <HStack mx={5} mb={1}>
        <SomeOtherComponent />
      </HStack>
    </>
  )
}
