import { Pressable } from '@hb-frontend/common/src/components'
import { Text } from 'react-native'

export function MyComponent() {
  return (
    <>
      <Pressable bg="blue.500" p={4} m={2} onPress={() => {}}>
        <Text>Simple pressable</Text>
      </Pressable>

      <Pressable mt={8} accessibilityRole="link" onPress={() => {}}>
        <Text>Custom role</Text>
      </Pressable>

      <Pressable isDisabled _hover={{ bg: 'red' }} _pressed={{ bg: 'green' }} onPress={() => {}}>
        <Text>With pseudo props</Text>
      </Pressable>
    </>
  )
}
